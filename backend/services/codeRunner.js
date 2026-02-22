import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';

class CodeRunner {
    constructor() {
        this.tempDir = path.join(os.tmpdir(), 'code-execution');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    /**
     * Execute code in the specified language
     * @param {string} language - javascript, python, java, cpp
     * @param {string} code - The source code
     * @param {string} input - Input for stdin
     * @returns {Promise<{output: string, error: string, executionTime: number}>}
     */
    async run(language, code, input = '') {
        const jobId = uuidv4();
        const startTime = process.hrtime();

        try {
            console.log(`[CodeRunner] Job ${jobId} Input: ${JSON.stringify(input)}`);

            let result;
            switch (language.toLowerCase()) {
                case 'javascript':
                    result = await this.executeJavaScript(jobId, code, input);
                    break;
                case 'python':
                    result = await this.executePython(jobId, code, input);
                    break;
                case 'java':
                    result = await this.executeJava(jobId, code, input);
                    break;
                case 'cpp':
                case 'c++':
                    result = await this.executeCpp(jobId, code, input);
                    break;
                default:
                    throw new Error(`Unsupported language: ${language}`);
            }

            console.log(`[CodeRunner] Job ${jobId} Output: ${JSON.stringify(result.output)}`);

            const endTime = process.hrtime(startTime);
            const executionTime = (endTime[0] * 1000 + endTime[1] / 1e6).toFixed(2); // ms

            return {
                ...result,
                executionTime: parseFloat(executionTime)
            };

        } catch (error) {
            console.error(`[CodeRunner] Job ${jobId} Error:`, error);
            return {
                output: '',
                error: error.message,
                executionTime: 0
            };
        } finally {
            this.cleanup(jobId);
        }
    }

    async executeJavaScript(jobId, code, input) {
        const filePath = path.join(this.tempDir, `${jobId}.js`);
        fs.writeFileSync(filePath, code);

        return this.spawnProcess('node', [filePath], input);
    }

    async executePython(jobId, code, input) {
        const filePath = path.join(this.tempDir, `${jobId}.py`);
        fs.writeFileSync(filePath, code);

        // Try 'python' and 'python3'
        try {
            return await this.spawnProcess('python', [filePath], input);
        } catch {
            return await this.spawnProcess('python3', [filePath], input);
        }
    }

    async executeJava(jobId, code, input) {
        // Java requires class name to match file name. We'll parse it or wrap it.
        // For simplicity, we assume a Main class or wrap in Main.

        let className = 'Main';
        const match = code.match(/class\s+(\w+)/);
        if (match) {
            className = match[1];
        } else {
            // Wrap in a Main class if no class is defined (script-like java? unlikely but safe)
            code = `public class Main {
                public static void main(String[] args) {
                    ${code}
                }
            }`;
            className = 'Main';
        }

        // Java file must match class name.
        // We'll create a subdirectory for this job to avoid conflicts with 'Main'
        const jobDir = path.join(this.tempDir, jobId);
        fs.mkdirSync(jobDir);
        const filePath = path.join(jobDir, `${className}.java`);
        fs.writeFileSync(filePath, code);

        // Compile
        try {
            await this.spawnProcess('javac', [filePath], '');
        } catch (compileErr) {
            return { output: '', error: `Compilation Error:\n${compileErr.error || compileErr.message}` };
        }

        // Execute
        return this.spawnProcess('java', ['-cp', jobDir, className], input);
    }

    async executeCpp(jobId, code, input) {
        const sourcePath = path.join(this.tempDir, `${jobId}.cpp`);
        const exePath = path.join(this.tempDir, `${jobId}.exe`); // Windows exe
        fs.writeFileSync(sourcePath, code);

        // Compile
        try {
            await this.spawnProcess('g++', [sourcePath, '-o', exePath], '');
        } catch (compileErr) {
            return { output: '', error: `Compilation Error:\n${compileErr.error || compileErr.message}` };
        }

        // Execute
        return this.spawnProcess(exePath, [], input);
    }

    spawnProcess(command, args, input, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args);
            let output = '';
            let error = '';

            const timer = setTimeout(() => {
                child.kill();
                reject(new Error('Execution timed out (5s limit)'));
            }, timeout);

            if (input) {
                child.stdin.write(input);
                child.stdin.end();
            }

            child.stdout.on('data', (data) => {
                output += data.toString();
            });

            child.stderr.on('data', (data) => {
                error += data.toString();
            });

            child.on('close', (code) => {
                clearTimeout(timer);
                resolve({ output, error });
            });

            child.on('error', (err) => {
                clearTimeout(timer);
                // Don't reject for missing runtime, just return error
                resolve({ output: '', error: `Runtime Error: ${err.message}` });
            });
        });
    }

    cleanup(jobId) {
        // Cleanup files matching jobID
        try {
            const files = fs.readdirSync(this.tempDir);
            files.forEach(file => {
                if (file.startsWith(jobId)) {
                    const fullPath = path.join(this.tempDir, file);
                    if (fs.lstatSync(fullPath).isDirectory()) {
                        fs.rmSync(fullPath, { recursive: true, force: true });
                    } else {
                        fs.unlinkSync(fullPath);
                    }
                }
            });
        } catch (e) {
            console.error('Cleanup error:', e);
        }
    }
}

export default new CodeRunner();
