import { Tool } from '@aispec/tool-types';
import { authenticate } from '@google-cloud/local-auth';
import fs from 'fs/promises';
import { google } from 'googleapis';
import path from 'path';

const CREDENTIALS_PATH = path.join(
  __dirname,
  '../../../.gdrive-server-credentials.json',
);
const OAUTH_KEYS_PATH = path.join(__dirname, '../../../gcp-oauth.keys.json');

class GoogleDriveManager {
  private drive = google.drive('v3');
  private isAuthenticated = false;

  async authenticate(): Promise<void> {
    try {
      const auth = await authenticate({
        keyfilePath: OAUTH_KEYS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      await fs.writeFile(CREDENTIALS_PATH, JSON.stringify(auth.credentials));
      this.isAuthenticated = true;
    }
    catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async getFile(fileId: string): Promise<{
    content: string;
    mimeType: string;
  }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    // Get file metadata
    const metadata = await this.drive.files.get({
      fields: 'mimeType',
      fileId,
    });

    const mimeType = metadata.data.mimeType || 'application/octet-stream';

    // Handle Google Workspace files
    if (mimeType.startsWith('application/vnd.google-apps')) {
      let exportMimeType: string;
      switch (mimeType) {
        case 'application/vnd.google-apps.document':
          exportMimeType = 'text/markdown';
          break;
        case 'application/vnd.google-apps.drawing':
          exportMimeType = 'image/png';
          break;
        case 'application/vnd.google-apps.presentation':
          exportMimeType = 'text/plain';
          break;
        case 'application/vnd.google-apps.spreadsheet':
          exportMimeType = 'text/csv';
          break;
        default:
          exportMimeType = 'text/plain';
      }

      const response = await this.drive.files.export({
        fileId,
        mimeType: exportMimeType,
      });

      return {
        content: response.data as string,
        mimeType: exportMimeType,
      };
    }

    // Handle regular files
    const response = await this.drive.files.get(
      {
        alt: 'media',
        fileId,
      },
      {
        responseType: 'arraybuffer',
      },
    );

    const content = Buffer.from(response.data as ArrayBuffer).toString(
      mimeType.startsWith('text/') || mimeType === 'application/json'
        ? 'utf-8'
        : 'base64',
    );

    return { content, mimeType };
  }

  async listFiles(pageToken?: string): Promise<{
    files: { id: string; mimeType: string; name: string }[];
    nextPageToken?: string;
  }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const response = await this.drive.files.list({
      fields: 'nextPageToken, files(id, name, mimeType)',
      pageSize: 10,
      pageToken,
    });

    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    };
  }

  async loadCredentials(): Promise<void> {
    try {
      await fs.access(CREDENTIALS_PATH);
      const credentials = JSON.parse(
        await fs.readFile(CREDENTIALS_PATH, 'utf-8'),
      );
      const auth = await authenticate({
        credentials,
        keyfilePath: OAUTH_KEYS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      google.options({ auth });
      this.isAuthenticated = true;
    }
    catch {
      throw new Error(
        'Credentials not found or invalid. Please authenticate first.',
      );
    }
  }

  async searchFiles(query: string): Promise<
    {
      id: string;
      mimeType: string;
      modifiedTime?: string;
      name: string;
      size?: string;
    }[]
  > {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
    const formattedQuery = `fullText contains '${escapedQuery}'`;

    const response = await this.drive.files.list({
      fields: 'files(id, name, mimeType, modifiedTime, size)',
      pageSize: 10,
      q: formattedQuery,
    });

    return response.data.files || [];
  }
}

// Create a singleton instance
const driveManager = new GoogleDriveManager();

// Tool definitions
const authenticateTool: Tool = {
  description: 'Authenticate with Google Drive',
  handler: async () => {
    await driveManager.authenticate();
    return 'Authentication successful';
  },
  id: 'authenticate',
  name: 'Authenticate',
  parameters: [],
  returnType: 'string',
};

const listFilesTool: Tool = {
  description: 'List files in Google Drive',
  handler: async (params: any) => {
    return await driveManager.listFiles(params.pageToken);
  },
  id: 'list_files',
  name: 'List Files',
  parameters: [
    {
      description: 'Token for the next page of results',
      name: 'pageToken',
      required: false,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const getFileTool: Tool = {
  description: 'Get a file from Google Drive by ID',
  handler: async (params: any) => {
    return await driveManager.getFile(params.fileId);
  },
  id: 'get_file',
  name: 'Get File',
  parameters: [
    {
      description: 'ID of the file to retrieve',
      name: 'fileId',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const searchFilesTool: Tool = {
  description: 'Search for files in Google Drive',
  handler: async (params: any) => {
    return await driveManager.searchFiles(params.query);
  },
  id: 'search_files',
  name: 'Search Files',
  parameters: [
    {
      description: 'Search query',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const tools = [authenticateTool, listFilesTool, getFileTool, searchFilesTool];

// Initialize credentials on load
driveManager.loadCredentials().catch(() => {
  console.warn(
    'Google Drive credentials not found. Please authenticate first.',
  );
});

export { tools };
