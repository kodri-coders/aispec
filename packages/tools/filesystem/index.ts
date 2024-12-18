import { Tool } from '@aispec/tool-types';
import fs from 'fs/promises';
import path from 'path';

// Security utilities
/**
 *
 * @param requestedPath
 */
async function validatePath(requestedPath: string): Promise<string> {
  const absolute = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(process.cwd(), requestedPath);

  const normalizedRequested = path.normalize(absolute);
  // Check if path is within allowed directories
  const allowedDirectories = [path.resolve(process.cwd(), '..')];
  const isAllowed = allowedDirectories.some(dir =>
    normalizedRequested.startsWith(dir),
  );
  if (!isAllowed) {
    throw new Error(
      `Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`,
    );
  }

  // Handle symlinks by checking their real path
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = path.normalize(realPath);
    const isRealPathAllowed = allowedDirectories.some(dir =>
      normalizedReal.startsWith(dir),
    );
    if (!isRealPathAllowed) {
      throw new Error(
        'Access denied - symlink target outside allowed directories',
      );
    }
    return realPath;
  }
  catch {
    // For new files that don't exist yet, verify parent directory
    const parentDir = path.dirname(absolute);
    try {
      const realParentPath = await fs.realpath(parentDir);
      const normalizedParent = path.normalize(realParentPath);
      const isParentAllowed = allowedDirectories.some(dir =>
        normalizedParent.startsWith(dir),
      );
      if (!isParentAllowed) {
        throw new Error(
          'Access denied - parent directory outside allowed directories',
        );
      }
      return absolute;
    }
    catch {
      // Create parent directory
      await fs.mkdir(parentDir, { recursive: true });
      return absolute;
    }
  }
}

const readFileTool: Tool = {
  description: 'Read the contents of a file',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    const content = await fs.readFile(validPath, 'utf-8');
    return content;
  },
  id: 'fs_read_file',
  name: 'Read File',
  parameters: [
    {
      description: 'Path to the file to read',
      name: 'path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const writeFileTool = {
  description: 'Creates or rewrites files',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.mkdir(path.dirname(validPath), { recursive: true });
    await fs.writeFile(validPath, params.content);
    return `File written to ${params.path}`;
  },
  id: 'fs_write_file',
  name: 'Write File',

  parameters: [
    {
      description: 'The name of the file to create/update',
      name: 'path',
      required: true,
      type: 'string',
    },
    {
      description:
        'Content to write to the file.Make sure it is serialized in a single line for json.',
      name: 'content',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const appendFileTool = {
  description: 'Append content to a file',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.appendFile(validPath, params.content);
    return `Content appended to ${params.path}`;
  },
  id: 'fs_append_file',
  name: 'Append File',
  parameters: [
    {
      description: 'Path to the file to append to',
      name: 'path',
      required: true,
      type: 'string',
    },
    {
      description: 'Content to append to the file',
      name: 'content',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const deleteFileTool = {
  description: 'Delete a file',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.unlink(validPath);
    return `File deleted: ${params.path}`;
  },
  id: 'fs_delete_file',
  name: 'Delete File',
  parameters: [
    {
      description: 'Path to the file to delete',
      name: 'path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const listDirectoryTool = {
  description: 'List contents of a directory',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    const entries = await fs.readdir(validPath, { withFileTypes: true });
    const contents = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
    }));
    return JSON.stringify(contents, null, 2);
  },
  id: 'fs_list_directory',
  name: 'List Directory',
  parameters: [
    {
      description: 'Path to the directory to list',
      name: 'path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const createDirectoryTool = {
  description: 'Create a new directory',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.mkdir(validPath, { recursive: true });
    return `Directory created: ${params.path}`;
  },
  id: 'fs_create_directory',
  name: 'Create Directory',
  parameters: [
    {
      description: 'Path to create the directory at',
      name: 'path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const deleteDirectoryTool = {
  description: 'Delete a directory and its contents',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.rm(validPath, { force: true, recursive: true });
    return `Directory deleted: ${params.path}`;
  },
  id: 'fs_delete_directory',
  name: 'Delete Directory',
  parameters: [
    {
      description: 'Path to the directory to delete',
      name: 'path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const moveFileTool = {
  description: 'Move a file or directory to a new location',
  handler: async (params: any) => {
    const validSourcePath = await validatePath(params.source);
    const validDestPath = await validatePath(params.destination);
    await fs.rename(validSourcePath, validDestPath);
    return `Moved ${params.source} to ${params.destination}`;
  },
  id: 'fs_move',
  name: 'Move File or Directory',
  parameters: [
    {
      description: 'Source path',
      name: 'source',
      required: true,
      type: 'string',
    },
    {
      description: 'Destination path',
      name: 'destination',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const copyFileTool = {
  description: 'Copy a file or directory to a new location',
  handler: async (params: any) => {
    const validSourcePath = await validatePath(params.source);
    const validDestPath = await validatePath(params.destination);
    await fs.cp(validSourcePath, validDestPath, { recursive: true });
    return `Copied ${params.source} to ${params.destination}`;
  },
  id: 'fs_copy',
  name: 'Copy File or Directory',
  parameters: [
    {
      description: 'Source path',
      name: 'source',
      required: true,
      type: 'string',
    },
    {
      description: 'Destination path',
      name: 'destination',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getFileStatsTool = {
  description: 'Get information about a file or directory',
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    const stats = await fs.stat(validPath);
    return JSON.stringify(
      {
        created: stats.birthtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        modified: stats.mtime,
        size: stats.size,
      },
      null,
      2,
    );
  },
  id: 'fs_stats',
  name: 'Get File Stats',
  parameters: [
    {
      description: 'Path to get stats for',
      name: 'path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = {
  appendFileTool,
  copyFileTool,
  createDirectoryTool,
  deleteDirectoryTool,
  deleteFileTool,
  getFileStatsTool,
  listDirectoryTool,
  moveFileTool,
  readFileTool,
  writeFileTool,
};

export { tools };
