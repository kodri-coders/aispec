import { Tool } from "@aispec/tool-types";
import { spawn } from "child_process";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";

interface PythonOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

class PythonRunner {
  private async createTempFile(code: string): Promise<string> {
    const tempDir = tmpdir();
    const filename = `python_${uuidv4()}.py`;
    const filepath = join(tempDir, filename);
    await writeFile(filepath, code);
    return filepath;
  }

  async runCode(code: string, timeout = 30000): Promise<PythonOutput> {
    const filepath = await this.createTempFile(code);

    return new Promise((resolve) => {
      const pythonProcess = spawn("python3", [filepath]);
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          stdout,
          stderr:
            stderr +
            "\nExecution timed out after " +
            timeout / 1000 +
            " seconds",
          exitCode: 124,
        });
      }, timeout);

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
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
      const pythonProcess = spawn("python3", [filepath]);
      let stdout = "";
      let stderr = "";
      const timer = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          stdout,
          stderr:
            stderr +
            "\nExecution timed out after " +
            timeout / 1000 +
            " seconds",
          exitCode: 124,
        });
      }, timeout);

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
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
      const pythonProcess = spawn("python3", [filepath]);
      let stdout = "";
      let stderr = "";
      let inputIndex = 0;
      const timer = setTimeout(() => {
        pythonProcess.kill();
        resolve({
          stdout,
          stderr:
            stderr +
            "\nExecution timed out after " +
            timeout / 1000 +
            " seconds",
          exitCode: 124,
        });
      }, timeout);

      pythonProcess.stdout.on("data", (data) => {
        stdout += data.toString();
        if (inputIndex < inputs.length) {
          pythonProcess.stdin.write(inputs[inputIndex] + "\n");
          inputIndex++;
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pythonProcess.on("close", (code) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
        });
      });
    });
  }

  async installPackage(packageName: string): Promise<PythonOutput> {
    return new Promise((resolve) => {
      const pipProcess = spawn("pip3", ["install", packageName]);
      let stdout = "";
      let stderr = "";

      pipProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      pipProcess.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      pipProcess.on("close", (code) => {
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
const pythonRunner = new PythonRunner();

// Tool definitions
const runCodeTool: Tool = {
  id: "run_code",
  name: "Run Python Code",
  description: "Execute Python code and return the output",
  parameters: [
    {
      name: "code",
      type: "string",
      description: "Python code to execute",
      required: true,
    },
    {
      name: "timeout",
      type: "number",
      description: "Execution timeout in milliseconds",
      required: false,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await pythonRunner.runCode(params.code, params.timeout);
  },
};

const runCodeWithInputTool: Tool = {
  id: "run_code_with_input",
  name: "Run Python Code with Input",
  description: "Execute Python code with input data",
  parameters: [
    {
      name: "code",
      type: "string",
      description: "Python code to execute",
      required: true,
    },
    {
      name: "input",
      type: "string",
      description: "Input data to provide to the program",
      required: true,
    },
    {
      name: "timeout",
      type: "number",
      description: "Execution timeout in milliseconds",
      required: false,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await pythonRunner.runCodeWithInput(
      params.code,
      params.input,
      params.timeout,
    );
  },
};

const runInteractiveCodeTool: Tool = {
  id: "run_interactive_code",
  name: "Run Interactive Python Code",
  description: "Execute Python code that requires multiple user inputs",
  parameters: [
    {
      name: "code",
      type: "string",
      description: "Python code to execute",
      required: true,
    },
    {
      name: "inputs",
      type: "array",
      description: "Array of input strings to provide in sequence",
      required: true,
    },
    {
      name: "timeout",
      type: "number",
      description: "Execution timeout in milliseconds",
      required: false,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await pythonRunner.runInteractiveCode(
      params.code,
      params.inputs,
      params.timeout,
    );
  },
};

const installPackageTool: Tool = {
  id: "install_package",
  name: "Install Python Package",
  description: "Install a Python package using pip",
  parameters: [
    {
      name: "packageName",
      type: "string",
      description: "Name of the package to install",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await pythonRunner.installPackage(params.packageName);
  },
};

const tools = [
  runCodeTool,
  runCodeWithInputTool,
  runInteractiveCodeTool,
  installPackageTool,
];

export { tools };
