import { Tool } from '@aispec/tool-types';
import { spawn } from 'child_process';
import { writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface PythonOutput {
  exitCode: number;
  stderr: string;
  stdout: string;
}

class PythonRunner {
  async installPackage(packageName: string): Promise<PythonOutput> {
    return new Promise((resolve) => {
      const pipProcess = spawn('pip3', ['install', packageName]);
      let stdout = '';
      let stderr = '';

      pipProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pipProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pipProcess.on('close', (code) => {
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  }

  async runCode(code: string, timeout = 30000): Promise<PythonOutput> {
    const filepath = await this.createTempFile(code);

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [filepath]);
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          exitCode: 124,
          stderr:
            stderr
            + '\nExecution timed out after '
            + timeout / 1000
            + ' seconds',
          stdout,
        });
      }, timeout);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  }

  async runCodeWithInput(
    code: string,
    input: string,
    timeout = 30000,
  ): Promise<PythonOutput> {
    const filepath = await this.createTempFile(code);

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [filepath]);
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          exitCode: 124,
          stderr:
            stderr
            + '\nExecution timed out after '
            + timeout / 1000
            + ' seconds',
          stdout,
        });
      }, timeout);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });

      if (input) {
        pythonProcess.stdin.write(input);
        pythonProcess.stdin.end();
      }
    });
  }

  async runInteractiveCode(
    code: string,
    inputs: string[],
    timeout = 30000,
  ): Promise<PythonOutput> {
    const filepath = await this.createTempFile(code);

    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', [filepath]);
      let stdout = '';
      let stderr = '';
      let inputIndex = 0;
      const timer = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          exitCode: 124,
          stderr:
            stderr
            + '\nExecution timed out after '
            + timeout / 1000
            + ' seconds',
          stdout,
        });
      }, timeout);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        if (inputIndex < inputs.length) {
          pythonProcess.stdin.write(inputs[inputIndex] + '\n');
          inputIndex++;
        }
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  }

  private async createTempFile(code: string): Promise<string> {
    const tempDir = tmpdir();
    const filename = `python_${uuidv4()}.py`;
    const filepath = join(tempDir, filename);
    await writeFile(filepath, code);
    return filepath;
  }
}

// Create a singleton instance
const pythonRunner = new PythonRunner();

// Tool definitions
const runCodeTool: Tool = {
  description: 'Execute Python code and return the output',
  handler: async (params: any) => {
    return await pythonRunner.runCode(params.code, params.timeout);
  },
  id: 'run_code',
  name: 'Run Python Code',
  parameters: [
    {
      description: 'Python code to execute',
      name: 'code',
      required: true,
      type: 'string',
    },
    {
      description: 'Execution timeout in milliseconds',
      name: 'timeout',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'object',
};

const runCodeWithInputTool: Tool = {
  description: 'Execute Python code with input data',
  handler: async (params: any) => {
    return await pythonRunner.runCodeWithInput(
      params.code,
      params.input,
      params.timeout,
    );
  },
  id: 'run_code_with_input',
  name: 'Run Python Code with Input',
  parameters: [
    {
      description: 'Python code to execute',
      name: 'code',
      required: true,
      type: 'string',
    },
    {
      description: 'Input data to provide to the program',
      name: 'input',
      required: true,
      type: 'string',
    },
    {
      description: 'Execution timeout in milliseconds',
      name: 'timeout',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'object',
};

const runInteractiveCodeTool: Tool = {
  description: 'Execute Python code that requires multiple user inputs',
  handler: async (params: any) => {
    return await pythonRunner.runInteractiveCode(
      params.code,
      params.inputs,
      params.timeout,
    );
  },
  id: 'run_interactive_code',
  name: 'Run Interactive Python Code',
  parameters: [
    {
      description: 'Python code to execute',
      name: 'code',
      required: true,
      type: 'string',
    },
    {
      description: 'Array of input strings to provide in sequence',
      name: 'inputs',
      required: true,
      type: 'array',
    },
    {
      description: 'Execution timeout in milliseconds',
      name: 'timeout',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'object',
};

const installPackageTool: Tool = {
  description: 'Install a Python package using pip',
  handler: async (params: any) => {
    return await pythonRunner.installPackage(params.packageName);
  },
  id: 'install_package',
  name: 'Install Python Package',
  parameters: [
    {
      description: 'Name of the package to install',
      name: 'packageName',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const tools = [
  runCodeTool,
  runCodeWithInputTool,
  runInteractiveCodeTool,
  installPackageTool,
];

export { tools };
