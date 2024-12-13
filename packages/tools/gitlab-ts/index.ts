import { Tool } from '@aispec/tool-types';
import axios from 'axios';

interface GitLabConfig {
  baseUrl: string;
  token: string;
}

interface Issue {
  assignees: {
    name: string;
    username: string;
  }[];
  author: {
    name: string;
    username: string;
  };
  created_at: string;
  description: string;
  id: number;
  iid: number;
  labels: string[];
  state: string;
  title: string;
  updated_at: string;
  web_url: string;
}

interface MergeRequest {
  author: {
    name: string;
    username: string;
  };
  created_at: string;
  description: string;
  id: number;
  iid: number;
  source_branch: string;
  state: string;
  target_branch: string;
  title: string;
  updated_at: string;
  web_url: string;
}

interface Pipeline {
  created_at: string;
  id: number;
  ref: string;
  sha: string;
  status: string;
  updated_at: string;
  web_url: string;
}

class GitLabManager {
  private client;

  constructor(config: GitLabConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, '') + '/api/v4',
      headers: {
        'Content-Type': 'application/json',
        'PRIVATE-TOKEN': config.token,
      },
    });
  }

  async createIssueComment(
    projectId: number | string,
    issueIid: number,
    comment: string,
  ): Promise<void> {
    await this.makeRequest(
      `/projects/${projectId}/issues/${issueIid}/notes`,
      'POST',
      { body: comment },
    );
  }

  async createMergeRequestComment(
    projectId: number | string,
    mrIid: number,
    comment: string,
  ): Promise<void> {
    await this.makeRequest(
      `/projects/${projectId}/merge_requests/${mrIid}/notes`,
      'POST',
      { body: comment },
    );
  }

  async getIssue(projectId: number | string, issueIid: number): Promise<Issue> {
    return this.makeRequest<Issue>(`/projects/${projectId}/issues/${issueIid}`);
  }

  async getMergeRequest(projectId: number | string, mrIid: number): Promise<MergeRequest> {
    return this.makeRequest<MergeRequest>(`/projects/${projectId}/merge_requests/${mrIid}`);
  }

  async getPipeline(projectId: number | string, pipelineId: number): Promise<Pipeline> {
    return this.makeRequest<Pipeline>(`/projects/${projectId}/pipelines/${pipelineId}`);
  }

  async listIssues(projectId: number | string, state = 'opened'): Promise<Issue[]> {
    return this.makeRequest<Issue[]>(`/projects/${projectId}/issues?state=${state}`);
  }

  async listMergeRequests(projectId: number | string, state = 'opened'): Promise<MergeRequest[]> {
    return this.makeRequest<MergeRequest[]>(`/projects/${projectId}/merge_requests?state=${state}`);
  }

  async listPipelines(projectId: number | string): Promise<Pipeline[]> {
    return this.makeRequest<Pipeline[]>(`/projects/${projectId}/pipelines`);
  }

  private async makeRequest<T>(path: string, method = 'GET', data?: any): Promise<T> {
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
        throw new Error(`GitLab API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}

// Create a singleton instance
let gitlabManager: GitLabManager | null = null;

// Tool definitions
const authenticateTool: Tool = {
  description: 'Authenticate with GitLab using a personal access token',
  handler: async (params: any) => {
    gitlabManager = new GitLabManager({
      baseUrl: params.baseUrl,
      token: params.token,
    });
    return 'Authentication successful';
  },
  id: 'authenticate',
  name: 'Authenticate',
  parameters: [
    {
      description: 'GitLab instance URL (e.g., https://gitlab.com)',
      name: 'baseUrl',
      required: true,
      type: 'string',
    },
    {
      description: 'GitLab personal access token',
      name: 'token',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getMergeRequestTool: Tool = {
  description: 'Get details of a specific merge request',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.getMergeRequest(params.projectId, params.mrIid);
  },
  id: 'get_merge_request',
  name: 'Get Merge Request',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'Merge request internal ID',
      name: 'mrIid',
      required: true,
      type: 'number',
    },
  ],
  returnType: 'object',
};

const listMergeRequestsTool: Tool = {
  description: 'List merge requests in a project',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.listMergeRequests(params.projectId, params.state);
  },
  id: 'list_merge_requests',
  name: 'List Merge Requests',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'State of merge requests (opened, closed, merged, all)',
      name: 'state',
      required: false,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const getIssueTool: Tool = {
  description: 'Get details of a specific issue',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.getIssue(params.projectId, params.issueIid);
  },
  id: 'get_issue',
  name: 'Get Issue',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'Issue internal ID',
      name: 'issueIid',
      required: true,
      type: 'number',
    },
  ],
  returnType: 'object',
};

const listIssuesTool: Tool = {
  description: 'List issues in a project',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.listIssues(params.projectId, params.state);
  },
  id: 'list_issues',
  name: 'List Issues',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'State of issues (opened, closed, all)',
      name: 'state',
      required: false,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const getPipelineTool: Tool = {
  description: 'Get details of a specific pipeline',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.getPipeline(params.projectId, params.pipelineId);
  },
  id: 'get_pipeline',
  name: 'Get Pipeline',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'Pipeline ID',
      name: 'pipelineId',
      required: true,
      type: 'number',
    },
  ],
  returnType: 'object',
};

const listPipelinesTool: Tool = {
  description: 'List pipelines in a project',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.listPipelines(params.projectId);
  },
  id: 'list_pipelines',
  name: 'List Pipelines',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'array',
};

const createMergeRequestCommentTool: Tool = {
  description: 'Add a comment to a merge request',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await gitlabManager.createMergeRequestComment(params.projectId, params.mrIid, params.comment);
    return 'Comment created successfully';
  },
  id: 'create_mr_comment',
  name: 'Create Merge Request Comment',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'Merge request internal ID',
      name: 'mrIid',
      required: true,
      type: 'number',
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

const createIssueCommentTool: Tool = {
  description: 'Add a comment to an issue',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await gitlabManager.createIssueComment(params.projectId, params.issueIid, params.comment);
    return 'Comment created successfully';
  },
  id: 'create_issue_comment',
  name: 'Create Issue Comment',
  parameters: [
    {
      description: 'Project ID or URL-encoded path',
      name: 'projectId',
      required: true,
      type: 'string',
    },
    {
      description: 'Issue internal ID',
      name: 'issueIid',
      required: true,
      type: 'number',
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

const tools = [
  authenticateTool,
  getMergeRequestTool,
  listMergeRequestsTool,
  getIssueTool,
  listIssuesTool,
  getPipelineTool,
  listPipelinesTool,
  createMergeRequestCommentTool,
  createIssueCommentTool,
];

export { tools };
