import { Tool } from '@aispec/tool-types';
import axios from 'axios';

interface JiraComment {
  author: {
    displayName: string;
    emailAddress: string;
  };
  body: string;
  created: string;
  id: string;
  updated: string;
}

interface JiraConfig {
  apiToken: string;
  baseUrl: string;
  email: string;
}

interface JiraIssue {
  fields: {
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    description: string;
    labels: string[];
    priority: {
      name: string;
    };
    reporter: {
      displayName: string;
      emailAddress: string;
    };
    status: {
      name: string;
    };
    summary: string;
    updated: string;
  };
  id: string;
  key: string;
}

interface JiraTransition {
  id: string;
  name: string;
  to: {
    name: string;
  };
}

class JiraManager {
  private client;

  constructor(config: JiraConfig) {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString(
      'base64',
    );
    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, '') + '/rest/api/3',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/comment`, 'POST', {
      body: {
        content: [
          { content: [{ text: comment, type: 'text' }], type: 'paragraph' },
        ],
        type: 'doc',
        version: 1,
      },
    });
  }

  async assignIssue(issueKey: string, accountId: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/assignee`, 'PUT', { accountId });
  }

  async getComments(issueKey: string): Promise<JiraComment[]> {
    const response = await this.makeRequest<{ comments: JiraComment[] }>(
      `/issue/${issueKey}/comment`,
    );
    return response.comments;
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.makeRequest<JiraIssue>(`/issue/${issueKey}`);
  }

  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    const response = await this.makeRequest<{ transitions: JiraTransition[] }>(
      `/issue/${issueKey}/transitions`,
    );
    return response.transitions;
  }

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const response = await this.makeRequest<{ issues: JiraIssue[] }>(
      '/search',
      'POST',
      {
        jql,
        maxResults: 50,
      },
    );
    return response.issues;
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/transitions`, 'POST', {
      transition: { id: transitionId },
    });
  }

  private async makeRequest<T>(
    path: string,
    method = 'GET',
    data?: any,
  ): Promise<T> {
    try {
      const response = await this.client.request({
        data,
        method,
        url: path,
      });
      return response.data;
    }
    catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Jira API error: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }
}

// Create a singleton instance
let jiraManager: JiraManager | null = null;

// Tool definitions
const authenticateTool: Tool = {
  description: 'Authenticate with Jira using email and API token',
  handler: async (params: any) => {
    jiraManager = new JiraManager({
      apiToken: params.apiToken,
      baseUrl: params.baseUrl,
      email: params.email,
    });
    return 'Authentication successful';
  },
  id: 'authenticate',
  name: 'Authenticate',
  parameters: [
    {
      description:
        'Jira instance URL (e.g., https://your-domain.atlassian.net)',
      name: 'baseUrl',
      required: true,
      type: 'string',
    },
    {
      description: 'Jira account email',
      name: 'email',
      required: true,
      type: 'string',
    },
    {
      description: 'Jira API token',
      name: 'apiToken',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getIssueTool: Tool = {
  description: 'Get details of a specific Jira issue',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await jiraManager.getIssue(params.issueKey);
  },
  id: 'get_issue',
  name: 'Get Issue',
  parameters: [
    {
      description: 'Issue key (e.g., PROJECT-123)',
      name: 'issueKey',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const searchIssuesTool: Tool = {
  description: 'Search for Jira issues using JQL',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await jiraManager.searchIssues(params.jql);
  },
  id: 'search_issues',
  name: 'Search Issues',
  parameters: [
    {
      description: 'JQL search query',
      name: 'jql',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const getCommentsTool: Tool = {
  description: 'Get all comments on a Jira issue',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await jiraManager.getComments(params.issueKey);
  },
  id: 'get_comments',
  name: 'Get Comments',
  parameters: [
    {
      description: 'Issue key (e.g., PROJECT-123)',
      name: 'issueKey',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const addCommentTool: Tool = {
  description: 'Add a comment to a Jira issue',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await jiraManager.addComment(params.issueKey, params.comment);
    return 'Comment added successfully';
  },
  id: 'add_comment',
  name: 'Add Comment',
  parameters: [
    {
      description: 'Issue key (e.g., PROJECT-123)',
      name: 'issueKey',
      required: true,
      type: 'string',
    },
    {
      description: 'Comment text',
      name: 'comment',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getTransitionsTool: Tool = {
  description: 'Get available transitions for a Jira issue',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await jiraManager.getTransitions(params.issueKey);
  },
  id: 'get_transitions',
  name: 'Get Transitions',
  parameters: [
    {
      description: 'Issue key (e.g., PROJECT-123)',
      name: 'issueKey',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const transitionIssueTool: Tool = {
  description: 'Move a Jira issue to a different status',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await jiraManager.transitionIssue(params.issueKey, params.transitionId);
    return 'Issue transitioned successfully';
  },
  id: 'transition_issue',
  name: 'Transition Issue',
  parameters: [
    {
      description: 'Issue key (e.g., PROJECT-123)',
      name: 'issueKey',
      required: true,
      type: 'string',
    },
    {
      description: 'Transition ID',
      name: 'transitionId',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const assignIssueTool: Tool = {
  description: 'Assign a Jira issue to a user',
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await jiraManager.assignIssue(params.issueKey, params.accountId);
    return 'Issue assigned successfully';
  },
  id: 'assign_issue',
  name: 'Assign Issue',
  parameters: [
    {
      description: 'Issue key (e.g., PROJECT-123)',
      name: 'issueKey',
      required: true,
      type: 'string',
    },
    {
      description: 'Account ID of the assignee',
      name: 'accountId',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = [
  authenticateTool,
  getIssueTool,
  searchIssuesTool,
  getCommentsTool,
  addCommentTool,
  getTransitionsTool,
  transitionIssueTool,
  assignIssueTool,
];

export { tools };
