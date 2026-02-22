import codeRunner from './backend/services/codeRunner.js';

async function testRunner() {
    console.log('--- Testing Code Runner ---');

    // 1. JavaScript
    console.log('\nTesting JavaScript...');
    const jsRes = await codeRunner.run('javascript', 'console.log("Hello from JS! " + (5+5));');
    console.log('JS Result:', jsRes);

    // 2. Python
    console.log('\nTesting Python...');
    const pyRes = await codeRunner.run('python', 'print("Hello from Python! " + str(5+5))');
    console.log('Python Result:', pyRes);

    // 3. Java
    console.log('\nTesting Java...');
    const javaCode = `
        public class Main {
            public static void main(String[] args) {
                System.out.println("Hello from Java! " + (5+5));
            }
        }
    `;
    const javaRes = await codeRunner.run('java', javaCode);
    console.log('Java Result:', javaRes);

    // 4. C++
    console.log('\nTesting C++...');
    const cppCode = `
        #include <iostream>
        int main() {
            std::cout << "Hello from C++! " << (5+5) << std::endl;
            return 0;
        }
    `;
    const cppRes = await codeRunner.run('cpp', cppCode);
    console.log('C++ Result:', cppRes);
}

testRunner();
