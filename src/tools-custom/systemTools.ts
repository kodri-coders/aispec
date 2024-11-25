import { Tool } from '@aispec/lib/types/tool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ExecResult {
  stdout: string;
  stderr: string;
  code: number | null;
}

/**
 * Validates command for security
 */
function validateCommand(command: string, allowedCommands: string[]): boolean {
  const baseCommand = command.split(' ')[0];
  return allowedCommands.includes(baseCommand);
}

export const execCommandTool: Tool = {
  id: 'exec_command',
  name: 'Execute Command',
  description: 'Executes system commands safely',
  parameters: [
    {
      name: 'command',
      type: 'string',
      description: 'The command to execute',
      required: true,
    },
    {
      name: 'cwd',
      type: 'string',
      description: 'Working directory for command execution',
      required: false,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Timeout in milliseconds',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: Record<string, any>): Promise<ExecResult> => {
    try {
      const { command, cwd = process.cwd(), timeout = 30000 } = params;
      
      // List of allowed commands for security
      const allowedCommands = ['ls', 'pwd', 'echo', 'cat', 'mkdir', 'rm', 'cp', 'mv'];
      
      if (!validateCommand(command, allowedCommands)) {
        throw new Error(`Command not allowed: ${command}`);
      }
      
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      
      return {
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code: 0
      };
    } catch (error: any) {
      if (error.killed) {
        throw new Error(`Command timed out: ${error.message}`);
      }
      return {
        stdout: '',
        stderr: error.message,
        code: error.code || 1
      };
    }
  },
};
