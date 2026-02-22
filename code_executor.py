import subprocess
import os
import shutil
import time

class CodeExecutor:
    def __init__(self):
        self.temp_dir = "temp_code_execution"
        if not os.path.exists(self.temp_dir):
            os.makedirs(self.temp_dir)

    def execute_code(self, language, code, input_data):
        timestamp = str(int(time.time()))
        unique_id = f"{timestamp}"
        
        if language == 'python' or language == 'python3':
            return self._execute_python(code, input_data, unique_id)
        elif language == 'java':
            return self._execute_java(code, input_data, unique_id)
        elif language == 'c':
            return self._execute_c(code, input_data, unique_id)
        elif language == 'cpp' or language == 'c++':
            return self._execute_cpp(code, input_data, unique_id)
        else:
            return {"status": "Error", "output": "Unsupported language"}

    def _execute_python(self, code, input_data, unique_id):
        filename = os.path.join(self.temp_dir, f"script_{unique_id}.py")
        with open(filename, "w") as f:
            f.write(code)
        
        try:
            process = subprocess.Popen(
                ['python', filename],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=input_data, timeout=5)
            if stderr:
                return {"status": "Error", "output": stderr}
            return {"status": "Success", "output": stdout.strip()}
        except subprocess.TimeoutExpired:
            return {"status": "Error", "output": "Time Limit Exceeded"}
        except Exception as e:
            return {"status": "Error", "output": str(e)}
        finally:
            if os.path.exists(filename):
                os.remove(filename)

    def _execute_java(self, code, input_data, unique_id):
        # Java requires class name to match file name. Assume class is "Main".
        # We might need to parse class name or wrap it.
        # For simplicity, user MUST use "public class Main"
        filename = os.path.join(self.temp_dir, "Main.java")
        # We need isolation, so maybe make a subdir
        work_dir = os.path.join(self.temp_dir, unique_id)
        os.makedirs(work_dir, exist_ok=True)
        filename = os.path.join(work_dir, "Main.java")
        
        with open(filename, "w") as f:
            f.write(code)
            
        try:
            # Compile
            compile_proc = subprocess.run(
                ['javac', filename],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if compile_proc.returncode != 0:
                shutil.rmtree(work_dir)
                return {"status": "Compilation Error", "output": compile_proc.stderr}
            
            # Run
            process = subprocess.Popen(
                ['java', '-cp', work_dir, 'Main'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=input_data, timeout=5)
            if stderr:
                 # Check if it's a runtime error
                 return {"status": "Runtime Error", "output": stderr}
            return {"status": "Success", "output": stdout.strip()}
            
        except subprocess.TimeoutExpired:
            return {"status": "Error", "output": "Time Limit Exceeded"}
        except Exception as e:
            return {"status": "Error", "output": str(e)}
        finally:
            if os.path.exists(work_dir):
                try:
                    shutil.rmtree(work_dir)
                except:
                    pass

    def _execute_c(self, code, input_data, unique_id):
        # Check for GCC
        if shutil.which("gcc") is None:
             return {"status": "Error", "output": "GCC compiler not found on server."}
        
        work_dir = os.path.join(self.temp_dir, unique_id)
        os.makedirs(work_dir, exist_ok=True)
        source_file = os.path.join(work_dir, "main.c")
        exe_file = os.path.join(work_dir, "main.exe")
        
        with open(source_file, "w") as f:
            f.write(code)

        try:
            # Compile
            compile_proc = subprocess.run(
                ['gcc', source_file, '-o', exe_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if compile_proc.returncode != 0:
                shutil.rmtree(work_dir)
                return {"status": "Compilation Error", "output": compile_proc.stderr}

            # Run
            process = subprocess.Popen(
                [exe_file],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=input_data, timeout=5)
            # C stderr usually empty unless crash
            return {"status": "Success", "output": stdout.strip()}
        
        except subprocess.TimeoutExpired:
            return {"status": "Error", "output": "Time Limit Exceeded"}
        except Exception as e:
            return {"status": "Error", "output": str(e)}
        finally:
            if os.path.exists(work_dir):
                 try:
                    shutil.rmtree(work_dir)
                 except:
                    pass

    def _execute_cpp(self, code, input_data, unique_id):
         # Check for G++
        if shutil.which("g++") is None:
             return {"status": "Error", "output": "G++ compiler not found on server."}

        work_dir = os.path.join(self.temp_dir, unique_id)
        os.makedirs(work_dir, exist_ok=True)
        source_file = os.path.join(work_dir, "main.cpp")
        exe_file = os.path.join(work_dir, "main.exe")
        
        with open(source_file, "w") as f:
            f.write(code)

        try:
            # Compile
            compile_proc = subprocess.run(
                ['g++', source_file, '-o', exe_file],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            if compile_proc.returncode != 0:
                shutil.rmtree(work_dir)
                return {"status": "Compilation Error", "output": compile_proc.stderr}

            # Run
            process = subprocess.Popen(
                [exe_file],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(input=input_data, timeout=5)
            return {"status": "Success", "output": stdout.strip()}
        
        except subprocess.TimeoutExpired:
            return {"status": "Error", "output": "Time Limit Exceeded"}
        except Exception as e:
            return {"status": "Error", "output": str(e)}
        finally:
             if os.path.exists(work_dir):
                 try:
                    shutil.rmtree(work_dir)
                 except:
                    pass
