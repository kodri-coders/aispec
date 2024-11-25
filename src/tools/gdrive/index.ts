import { Tool } from "../puppeteer/index.js";
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CREDENTIALS_PATH = path.join(__dirname, '../../../.gdrive-server-credentials.json');
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
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async loadCredentials(): Promise<void> {
    try {
      await fs.access(CREDENTIALS_PATH);
      const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf-8'));
      const auth = await authenticate({
        keyfilePath: OAUTH_KEYS_PATH,
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
      });
      google.options({ auth });
      this.isAuthenticated = true;
    } catch (error) {
      throw new Error('Credentials not found or invalid. Please authenticate first.');
    }
  }

  async listFiles(pageToken?: string): Promise<{
    files: Array<{ id: string; name: string; mimeType: string }>;
    nextPageToken?: string;
  }> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const response = await this.drive.files.list({
      pageSize: 10,
      pageToken,
      fields: 'nextPageToken, files(id, name, mimeType)',
    });

    return {
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken,
    };
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
      fileId,
      fields: 'mimeType',
    });

    const mimeType = metadata.data.mimeType || 'application/octet-stream';

    // Handle Google Workspace files
    if (mimeType.startsWith('application/vnd.google-apps')) {
      let exportMimeType: string;
      switch (mimeType) {
        case 'application/vnd.google-apps.document':
          exportMimeType = 'text/markdown';
          break;
        case 'application/vnd.google-apps.spreadsheet':
          exportMimeType = 'text/csv';
          break;
        case 'application/vnd.google-apps.presentation':
          exportMimeType = 'text/plain';
          break;
        case 'application/vnd.google-apps.drawing':
          exportMimeType = 'image/png';
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
    const response = await this.drive.files.get({
      fileId,
      alt: 'media',
    }, {
      responseType: 'arraybuffer',
    });

    const content = Buffer.from(response.data as ArrayBuffer).toString(
      mimeType.startsWith('text/') || mimeType === 'application/json' ? 'utf-8' : 'base64'
    );

    return { content, mimeType };
  }

  async searchFiles(query: string): Promise<Array<{
    id: string;
    name: string;
    mimeType: string;
    modifiedTime?: string;
    size?: string;
  }>> {
    if (!this.isAuthenticated) {
      throw new Error('Not authenticated');
    }

    const escapedQuery = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const formattedQuery = `fullText contains '${escapedQuery}'`;

    const response = await this.drive.files.list({
      q: formattedQuery,
      pageSize: 10,
      fields: 'files(id, name, mimeType, modifiedTime, size)',
    });

    return response.data.files || [];
  }
}

// Create a singleton instance
const driveManager = new GoogleDriveManager();

// Tool definitions
const authenticateTool: Tool = {
  id: 'authenticate',
  name: 'Authenticate',
  description: 'Authenticate with Google Drive',
  parameters: [],
  returnType: 'string',
  handler: async () => {
    await driveManager.authenticate();
    return 'Authentication successful';
  },
};

const listFilesTool: Tool = {
  id: 'list_files',
  name: 'List Files',
  description: 'List files in Google Drive',
  parameters: [
    {
      name: 'pageToken',
      type: 'string',
      description: 'Token for the next page of results',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await driveManager.listFiles(params.pageToken);
  },
};

const getFileTool: Tool = {
  id: 'get_file',
  name: 'Get File',
  description: 'Get a file from Google Drive by ID',
  parameters: [
    {
      name: 'fileId',
      type: 'string',
      description: 'ID of the file to retrieve',
      required: true,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await driveManager.getFile(params.fileId);
  },
};

const searchFilesTool: Tool = {
  id: 'search_files',
  name: 'Search Files',
  description: 'Search for files in Google Drive',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true,
    }
  ],
  returnType: 'array',
  handler: async (params: any) => {
    return await driveManager.searchFiles(params.query);
  },
};

const tools = [
  authenticateTool,
  listFilesTool,
  getFileTool,
  searchFilesTool,
];

// Initialize credentials on load
driveManager.loadCredentials().catch(() => {
  console.warn('Google Drive credentials not found. Please authenticate first.');
});

export { tools };
