import { Tool } from '@aispec/lib/types/tool';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Safely ensures a directory exists
 */
async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Validates and resolves a file path
 */
function validatePath(filePath: string, allowedDirs: string[]): string {
  const resolvedPath = path.resolve(filePath);
  const isInAllowedDir = allowedDirs.some(dir => 
    resolvedPath.startsWith(path.resolve(dir))
  );
  
  if (!isInAllowedDir) {
    throw new Error(`Access denied: ${filePath} is not in allowed directories`);
  }
  
  return resolvedPath;
}

export const fileWriterTool: Tool = {
  id: 'file_writer',
  name: 'File Writer',
  description: 'Creates or updates files in allowed directories',
  parameters: [
    {
      name: 'filepath',
      type: 'string',
      description: 'The path to the file to create/update',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'The content to write to the file',
      required: true,
    },
    {
      name: 'append',
      type: 'boolean',
      description: 'If true, appends content to existing file instead of overwriting',
      required: false,
    }
  ],
  returnType: 'string',
  handler: async (params: Record<string, any>) => {
    try {
      const { filepath, content, append = false } = params;
      const allowedDirs = [process.cwd()]; // Configure allowed directories
      const resolvedPath = validatePath(filepath, allowedDirs);
      
      // Ensure parent directory exists
      await ensureDir(path.dirname(resolvedPath));
      
      // Write file
      const flag = append ? 'a' : 'w';
      await fs.writeFile(resolvedPath, content, { flag });
      
      return `Successfully ${append ? 'appended to' : 'wrote'} file: ${filepath}`;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File write failed: ${error.message}`);
      }
      throw new Error('File write failed: Unknown error');
    }
  },
};

export const fileReaderTool: Tool = {
  id: 'file_reader',
  name: 'File Reader',
  description: 'Reads content from files in allowed directories',
  parameters: [
    {
      name: 'filepath',
      type: 'string',
      description: 'The path to the file to read',
      required: true,
    },
    {
      name: 'encoding',
      type: 'string',
      description: 'File encoding (default: utf-8)',
      required: false,
    }
  ],
  returnType: 'string',
  handler: async (params: Record<string, any>) => {
    try {
      const { filepath, encoding = 'utf-8' } = params;
      const allowedDirs = [process.cwd()]; // Configure allowed directories
      const resolvedPath = validatePath(filepath, allowedDirs);
      
      // Check if file exists
      await fs.access(resolvedPath);
      
      // Read file
      const content = await fs.readFile(resolvedPath, { encoding });
      return content;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File read failed: ${error.message}`);
      }
      throw new Error('File read failed: Unknown error');
    }
  },
};

export const fileDeleterTool: Tool = {
  id: 'file_deleter',
  name: 'File Deleter',
  description: 'Deletes files from allowed directories',
  parameters: [
    {
      name: 'filepath',
      type: 'string',
      description: 'The path to the file to delete',
      required: true,
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'If true, recursively deletes directories',
      required: false,
    }
  ],
  returnType: 'string',
  handler: async (params: Record<string, any>) => {
    try {
      const { filepath, recursive = false } = params;
      const allowedDirs = [process.cwd()]; // Configure allowed directories
      const resolvedPath = validatePath(filepath, allowedDirs);
      
      // Check if path exists
      await fs.access(resolvedPath);
      
      // Get file stats
      const stats = await fs.stat(resolvedPath);
      
      if (stats.isDirectory()) {
        if (!recursive) {
          throw new Error('Cannot delete directory without recursive flag');
        }
        await fs.rm(resolvedPath, { recursive: true });
      } else {
        await fs.unlink(resolvedPath);
      }
      
      return `Successfully deleted: ${filepath}`;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File deletion failed: ${error.message}`);
      }
      throw new Error('File deletion failed: Unknown error');
    }
  },
};

export const listDirTool: Tool = {
  id: 'list_dir',
  name: 'List Directory',
  description: 'Lists contents of a directory',
  parameters: [
    {
      name: 'dirpath',
      type: 'string',
      description: 'The path to the directory to list',
      required: true,
    },
    {
      name: 'recursive',
      type: 'boolean',
      description: 'If true, lists contents recursively',
      required: false,
    }
  ],
  returnType: 'array',
  handler: async (params: Record<string, any>) => {
    try {
      const { dirpath, recursive = false } = params;
      const allowedDirs = [process.cwd()]; // Configure allowed directories
      const resolvedPath = validatePath(dirpath, allowedDirs);
      
      // Check if directory exists
      const stats = await fs.stat(resolvedPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }
      
      async function* getFiles(dir: string): AsyncGenerator<string> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const res = path.resolve(dir, entry.name);
          if (entry.isDirectory() && recursive) {
            yield* getFiles(res);
          } else {
            yield res;
          }
        }
      }
      
      const files: string[] = [];
      for await (const f of getFiles(resolvedPath)) {
        files.push(path.relative(resolvedPath, f));
      }
      
      return files;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Directory listing failed: ${error.message}`);
      }
      throw new Error('Directory listing failed: Unknown error');
    }
  },
};
