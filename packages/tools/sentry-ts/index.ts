import { Tool } from '@aispec/tool-types';
import axios from 'axios';
import { URL } from 'url';

const SENTRY_API_BASE = 'https://sentry.io/api/0/';

interface SentryIssueData {
  count: number;
  firstSeen: string;
  issueId: string;
  lastSeen: string;
  level: string;
  stacktrace: string;
  status: string;
  title: string;
}

class SentryManager {
  private client;

  constructor(authToken: string) {
    this.client = axios.create({
      baseURL: SENTRY_API_BASE,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  formatIssueData(data: SentryIssueData): string {
    return `
Sentry Issue: ${data.title}
Issue ID: ${data.issueId}
Status: ${data.status}
Level: ${data.level}
First Seen: ${data.firstSeen}
Last Seen: ${data.lastSeen}
Event Count: ${data.count}

${data.stacktrace}
    `.trim();
  }

  async getSentryIssue(issueIdOrUrl: string): Promise<SentryIssueData> {
    try {
      const issueId = this.extractIssueId(issueIdOrUrl);

      // Get issue data
      const issueResponse = await this.client.get(`issues/${issueId}/`);
      if (issueResponse.status === 401) {
        throw new Error('Unauthorized. Please check your Sentry authentication token.');
      }
      const issueData = issueResponse.data;

      // Get issue hashes
      const hashesResponse = await this.client.get(`issues/${issueId}/hashes/`);
      const hashes = hashesResponse.data;

      if (!hashes || !hashes.length) {
        throw new Error('No Sentry events found for this issue');
      }

      const latestEvent = hashes[0].latestEvent;
      const stacktrace = this.createStacktrace(latestEvent);

      return {
        count: issueData.count,
        firstSeen: issueData.firstSeen,
        issueId: issueId,
        lastSeen: issueData.lastSeen,
        level: issueData.level,
        stacktrace: stacktrace,
        status: issueData.status,
        title: issueData.title,
      };
    }
    catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Error fetching Sentry issue: ${error.message}`);
      }
      throw error;
    }
  }

  private createStacktrace(latestEvent: any): string {
    const stacktraces: string[] = [];

    for (const entry of latestEvent.entries || []) {
      if (entry.type !== 'exception') continue;

      for (const exception of entry.data.values) {
        const exceptionType = exception.type || 'Unknown';
        const exceptionValue = exception.value || '';
        const stacktrace = exception.stacktrace;

        let stacktraceText = `Exception: ${exceptionType}: ${exceptionValue}\n\n`;

        if (stacktrace) {
          stacktraceText += 'Stacktrace:\n';
          for (const frame of stacktrace.frames || []) {
            const filename = frame.filename || 'Unknown';
            const lineno = frame.lineNo || '?';
            const func = frame.function || 'Unknown';

            stacktraceText += `${filename}:${lineno} in ${func}\n`;

            if (frame.context) {
              for (const [, line] of frame.context) {
                stacktraceText += `    ${line}\n`;
              }
            }

            stacktraceText += '\n';
          }
        }

        stacktraces.push(stacktraceText);
      }
    }

    return stacktraces.length ? stacktraces.join('\n') : 'No stacktrace found';
  }

  private extractIssueId(issueIdOrUrl: string): string {
    if (!issueIdOrUrl) {
      throw new Error('Missing issue_id_or_url argument');
    }

    if (issueIdOrUrl.startsWith('http://') || issueIdOrUrl.startsWith('https://')) {
      const parsedUrl = new URL(issueIdOrUrl);
      if (!parsedUrl.hostname || !parsedUrl.hostname.endsWith('.sentry.io')) {
        throw new Error('Invalid Sentry URL. Must be a URL ending with .sentry.io');
      }

      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2 || pathParts[0] !== 'issues') {
        throw new Error('Invalid Sentry issue URL. Path must contain \'/issues/{issue_id}\'');
      }

      issueIdOrUrl = pathParts[pathParts.length - 1];
    }

    if (!/^\d+$/.test(issueIdOrUrl)) {
      throw new Error('Invalid Sentry issue ID. Must be a numeric value.');
    }

    return issueIdOrUrl;
  }
}

// Create a singleton instance with an empty token
// Token will be set when the authenticate tool is called
let sentryManager: null | SentryManager = null;

// Tool definitions
const authenticateTool: Tool = {
  description: 'Authenticate with Sentry using an auth token',
  handler: async (params: any) => {
    sentryManager = new SentryManager(params.authToken);
    return 'Authentication successful';
  },
  id: 'authenticate',
  name: 'Authenticate',
  parameters: [
    {
      description: 'Sentry authentication token',
      name: 'authToken',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getIssueTool: Tool = {
  description: 'Retrieve and analyze a Sentry issue by ID or URL',
  handler: async (params: any) => {
    if (!sentryManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    const issueData = await sentryManager.getSentryIssue(params.issueIdOrUrl);
    return {
      data: issueData,
      formatted: sentryManager.formatIssueData(issueData),
    };
  },
  id: 'get_issue',
  name: 'Get Issue',
  parameters: [
    {
      description: 'Sentry issue ID or URL to analyze',
      name: 'issueIdOrUrl',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const tools = [
  authenticateTool,
  getIssueTool,
];

export { tools };
