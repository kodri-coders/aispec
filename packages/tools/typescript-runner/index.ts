import { Tool } from '@aispec/tool-types';
import { spawn } from 'child_process';
import { mkdir, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

interface TypeScriptOutput {
  exitCode: number;
  stderr: string;
  stdout: string;
}

class TypeScriptRunner {
  async installPackage(packageName: string): Promise<TypeScriptOutput> {
    const projectDir = await this.createTempProject('');

    return new Promise((resolve) => {
      const npmProcess = spawn('npm', ['install', packageName], { cwd: projectDir });
      let stdout = '';
      let stderr = '';

      npmProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      npmProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      npmProcess.on('close', (code) => {
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  }

  async runCode(code: string, timeout = 30000): Promise<TypeScriptOutput> {
    const projectDir = await this.createTempProject(code);
    await this.installDependencies(projectDir);

    return new Promise((resolve) => {
      const tsProcess = spawn('npx', ['ts-node', '--esm', 'index.ts'], { cwd: projectDir });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        tsProcess.kill();
        resolve({
          exitCode: 124,
          stderr: stderr + '\nExecution timed out after ' + timeout / 1000 + ' seconds',
          stdout,
        });
      }, timeout);

      tsProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tsProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tsProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  }

  async runCodeWithInput(code: string, input: string, timeout = 30000): Promise<TypeScriptOutput> {
    const projectDir = await this.createTempProject(code);
    await this.installDependencies(projectDir);

    return new Promise((resolve) => {
      const tsProcess = spawn('npx', ['ts-node', '--esm', 'index.ts'], { cwd: projectDir });
      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        tsProcess.kill();
        resolve({
          exitCode: 124,
          stderr: stderr + '\nExecution timed out after ' + timeout / 1000 + ' seconds',
          stdout,
        });
      }, timeout);

      tsProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tsProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tsProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });

      if (input) {
        tsProcess.stdin.write(input);
        tsProcess.stdin.end();
      }
    });
  }

  async runInteractiveCode(code: string, inputs: string[], timeout = 30000): Promise<TypeScriptOutput> {
    const projectDir = await this.createTempProject(code);
    await this.installDependencies(projectDir);

    return new Promise((resolve) => {
      const tsProcess = spawn('npx', ['ts-node', '--esm', 'index.ts'], { cwd: projectDir });
      let stdout = '';
      let stderr = '';
      let inputIndex = 0;
      const timer = setTimeout(() => {
        tsProcess.kill();
        resolve({
          exitCode: 124,
          stderr: stderr + '\nExecution timed out after ' + timeout / 1000 + ' seconds',
          stdout,
        });
      }, timeout);

      tsProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        if (inputIndex < inputs.length) {
          tsProcess.stdin.write(inputs[inputIndex] + '\n');
          inputIndex++;
        }
      });

      tsProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tsProcess.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code ?? 0,
          stderr,
          stdout,
        });
      });
    });
  }

  private async createTempProject(code: string): Promise<string> {
    const tempDir = join(tmpdir(), `ts_${uuidv4()}`);
    await mkdir(tempDir);

    // Create package.json
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({
      dependencies: {
        '@types/node': 'latest',
        'ts-node': 'latest',
        'typescript': 'latest',
      },
      type: 'module',
    }));

    // Create tsconfig.json
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify({
      compilerOptions: {
        esModuleInterop: true,
        module: 'ESNext',
        moduleResolution: 'node',
        outDir: 'dist',
        skipLibCheck: true,
        strict: true,
        target: 'ESNext',
      },
    }));

    // Create the TypeScript file
    const filepath = join(tempDir, 'index.ts');
    await writeFile(filepath, code);

    return tempDir;
  }

  private async installDependencies(projectDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const npmProcess = spawn('npm', ['install'], { cwd: projectDir });

      npmProcess.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      npmProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        }
        else {
          reject(new Error(`npm install failed with code ${code}`));
        }
      });
    });
  }
}

// Create a singleton instance
const typescriptRunner = new TypeScriptRunner();

// Tool definitions
const runCodeTool: Tool = {
  description: 'Execute TypeScript code and return the output',
  handler: async (params: any) => {
    return await typescriptRunner.runCode(params.code, params.timeout);
  },
  id: 'run_code',
  name: 'Run TypeScript Code',
  parameters: [
    {
      description: 'TypeScript code to execute',
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
  description: 'Execute TypeScript code with input data',
  handler: async (params: any) => {
    return await typescriptRunner.runCodeWithInput(params.code, params.input, params.timeout);
  },
  id: 'run_code_with_input',
  name: 'Run TypeScript Code with Input',
  parameters: [
    {
      description: 'TypeScript code to execute',
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
  description: 'Execute TypeScript code that requires multiple user inputs',
  handler: async (params: any) => {
    return await typescriptRunner.runInteractiveCode(params.code, params.inputs, params.timeout);
  },
  id: 'run_interactive_code',
  name: 'Run Interactive TypeScript Code',
  parameters: [
    {
      description: 'TypeScript code to execute',
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
  description: 'Install an NPM package',
  handler: async (params: any) => {
    return await typescriptRunner.installPackage(params.packageName);
  },
  id: 'install_package',
  name: 'Install NPM Package',
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
