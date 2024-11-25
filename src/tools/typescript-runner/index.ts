import { Tool } from "../puppeteer/index.js";
import { spawn } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

interface TypeScriptOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

class TypeScriptRunner {
  private async createTempProject(code: string): Promise<string> {
    const tempDir = join(tmpdir(), `ts_${uuidv4()}`);
    await mkdir(tempDir);

    // Create package.json
    await writeFile(join(tempDir, 'package.json'), JSON.stringify({
      "type": "module",
      "dependencies": {
        "@types/node": "latest",
        "typescript": "latest",
        "ts-node": "latest"
      }
    }));

    // Create tsconfig.json
    await writeFile(join(tempDir, 'tsconfig.json'), JSON.stringify({
      "compilerOptions": {
        "target": "ESNext",
        "module": "ESNext",
        "moduleResolution": "node",
        "esModuleInterop": true,
        "strict": true,
        "skipLibCheck": true,
        "outDir": "dist"
      }
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
        } else {
          reject(new Error(`npm install failed with code ${code}`));
        }
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
          stdout,
          stderr: stderr + '\nExecution timed out after ' + timeout / 1000 + ' seconds',
          exitCode: 124,
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
          stdout,
          stderr,
          exitCode: code ?? 0,
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
          stdout,
          stderr: stderr + '\nExecution timed out after ' + timeout / 1000 + ' seconds',
          exitCode: 124,
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
          stdout,
          stderr,
          exitCode: code ?? 0,
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
          stdout,
          stderr: stderr + '\nExecution timed out after ' + timeout / 1000 + ' seconds',
          exitCode: 124,
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
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      });
    });
  }

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
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      });
    });
  }
}

// Create a singleton instance
const typescriptRunner = new TypeScriptRunner();

// Tool definitions
const runCodeTool: Tool = {
  id: 'run_code',
  name: 'Run TypeScript Code',
  description: 'Execute TypeScript code and return the output',
  parameters: [
    {
      name: 'code',
      type: 'string',
      description: 'TypeScript code to execute',
      required: true,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Execution timeout in milliseconds',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await typescriptRunner.runCode(params.code, params.timeout);
  },
};

const runCodeWithInputTool: Tool = {
  id: 'run_code_with_input',
  name: 'Run TypeScript Code with Input',
  description: 'Execute TypeScript code with input data',
  parameters: [
    {
      name: 'code',
      type: 'string',
      description: 'TypeScript code to execute',
      required: true,
    },
    {
      name: 'input',
      type: 'string',
      description: 'Input data to provide to the program',
      required: true,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Execution timeout in milliseconds',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await typescriptRunner.runCodeWithInput(params.code, params.input, params.timeout);
  },
};

const runInteractiveCodeTool: Tool = {
  id: 'run_interactive_code',
  name: 'Run Interactive TypeScript Code',
  description: 'Execute TypeScript code that requires multiple user inputs',
  parameters: [
    {
      name: 'code',
      type: 'string',
      description: 'TypeScript code to execute',
      required: true,
    },
    {
      name: 'inputs',
      type: 'array',
      description: 'Array of input strings to provide in sequence',
      required: true,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Execution timeout in milliseconds',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await typescriptRunner.runInteractiveCode(params.code, params.inputs, params.timeout);
  },
};

const installPackageTool: Tool = {
  id: 'install_package',
  name: 'Install NPM Package',
  description: 'Install an NPM package',
  parameters: [
    {
      name: 'packageName',
      type: 'string',
      description: 'Name of the package to install',
      required: true,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await typescriptRunner.installPackage(params.packageName);
  },
};

const tools = [
  runCodeTool,
  runCodeWithInputTool,
  runInteractiveCodeTool,
  installPackageTool,
];

export { tools };
