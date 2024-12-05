import fs from "fs/promises";
import path from "path";
import { Tool } from "@aispec/tool-types";

// Security utilities
async function validatePath(requestedPath: string): Promise<string> {
  const absolute = path.isAbsolute(requestedPath)
    ? path.resolve(requestedPath)
    : path.resolve(process.cwd(), requestedPath);

  const normalizedRequested = path.normalize(absolute);
  // Check if path is within allowed directories
  const allowedDirectories = [path.resolve(process.cwd(), "..")];
  const isAllowed = allowedDirectories.some((dir) =>
    normalizedRequested.startsWith(dir),
  );
  if (!isAllowed) {
    throw new Error(
      `Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(", ")}`,
    );
  }

  // Handle symlinks by checking their real path
  try {
    const realPath = await fs.realpath(absolute);
    const normalizedReal = path.normalize(realPath);
    const isRealPathAllowed = allowedDirectories.some((dir) =>
      normalizedReal.startsWith(dir),
    );
    if (!isRealPathAllowed) {
      throw new Error(
        "Access denied - symlink target outside allowed directories",
      );
    }
    return realPath;
  } catch (error) {
    // For new files that don't exist yet, verify parent directory
    const parentDir = path.dirname(absolute);
    try {
      const realParentPath = await fs.realpath(parentDir);
      const normalizedParent = path.normalize(realParentPath);
      const isParentAllowed = allowedDirectories.some((dir) =>
        normalizedParent.startsWith(dir),
      );
      if (!isParentAllowed) {
        throw new Error(
          "Access denied - parent directory outside allowed directories",
        );
      }
      return absolute;
    } catch {
      // Create parent directory
      await fs.mkdir(parentDir, { recursive: true });
      return absolute;
    }
  }
}

const readFileTool: Tool = {
  id: "fs_read_file",
  name: "Read File",
  description: "Read the contents of a file",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to the file to read",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    const content = await fs.readFile(validPath, "utf-8");
    return content;
  },
};

const writeFileTool = {
  id: "fs_write_file",
  name: "Write File",
  description: "Creates or rewrites files",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "The name of the file to create/update",
      required: true,
    },
    {
      name: "content",
      type: "string",
      description:
        "Content to write to the file.Make sure it is serialized in a single line for json.",
      required: true,
    },
  ],

  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.mkdir(path.dirname(validPath), { recursive: true });
    await fs.writeFile(validPath, params.content);
    return `File written to ${params.path}`;
  },
};

const appendFileTool = {
  id: "fs_append_file",
  name: "Append File",
  description: "Append content to a file",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to the file to append to",
      required: true,
    },
    {
      name: "content",
      type: "string",
      description: "Content to append to the file",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.appendFile(validPath, params.content);
    return `Content appended to ${params.path}`;
  },
};

const deleteFileTool = {
  id: "fs_delete_file",
  name: "Delete File",
  description: "Delete a file",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to the file to delete",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.unlink(validPath);
    return `File deleted: ${params.path}`;
  },
};

const listDirectoryTool = {
  id: "fs_list_directory",
  name: "List Directory",
  description: "List contents of a directory",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to the directory to list",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    const entries = await fs.readdir(validPath, { withFileTypes: true });
    const contents = entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "directory" : "file",
    }));
    return JSON.stringify(contents, null, 2);
  },
};

const createDirectoryTool = {
  id: "fs_create_directory",
  name: "Create Directory",
  description: "Create a new directory",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to create the directory at",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.mkdir(validPath, { recursive: true });
    return `Directory created: ${params.path}`;
  },
};

const deleteDirectoryTool = {
  id: "fs_delete_directory",
  name: "Delete Directory",
  description: "Delete a directory and its contents",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to the directory to delete",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    await fs.rm(validPath, { recursive: true, force: true });
    return `Directory deleted: ${params.path}`;
  },
};

const moveFileTool = {
  id: "fs_move",
  name: "Move File or Directory",
  description: "Move a file or directory to a new location",
  parameters: [
    {
      name: "source",
      type: "string",
      description: "Source path",
      required: true,
    },
    {
      name: "destination",
      type: "string",
      description: "Destination path",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validSourcePath = await validatePath(params.source);
    const validDestPath = await validatePath(params.destination);
    await fs.rename(validSourcePath, validDestPath);
    return `Moved ${params.source} to ${params.destination}`;
  },
};

const copyFileTool = {
  id: "fs_copy",
  name: "Copy File or Directory",
  description: "Copy a file or directory to a new location",
  parameters: [
    {
      name: "source",
      type: "string",
      description: "Source path",
      required: true,
    },
    {
      name: "destination",
      type: "string",
      description: "Destination path",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validSourcePath = await validatePath(params.source);
    const validDestPath = await validatePath(params.destination);
    await fs.cp(validSourcePath, validDestPath, { recursive: true });
    return `Copied ${params.source} to ${params.destination}`;
  },
};

const getFileStatsTool = {
  id: "fs_stats",
  name: "Get File Stats",
  description: "Get information about a file or directory",
  parameters: [
    {
      name: "path",
      type: "string",
      description: "Path to get stats for",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const validPath = await validatePath(params.path);
    const stats = await fs.stat(validPath);
    return JSON.stringify(
      {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
      },
      null,
      2,
    );
  },
};

const tools = {
  readFileTool,
  writeFileTool,
  appendFileTool,
  deleteFileTool,
  listDirectoryTool,
  createDirectoryTool,
  deleteDirectoryTool,
  moveFileTool,
  copyFileTool,
  getFileStatsTool,
};

export { tools };

