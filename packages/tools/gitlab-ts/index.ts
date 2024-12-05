import { Tool } from "@aispec/tool-types";
import axios from 'axios';

interface GitLabConfig {
  baseUrl: string;
  token: string;
}

interface MergeRequest {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  author: {
    name: string;
    username: string;
  };
  source_branch: string;
  target_branch: string;
  web_url: string;
}

interface Issue {
  id: number;
  iid: number;
  title: string;
  description: string;
  state: string;
  created_at: string;
  updated_at: string;
  author: {
    name: string;
    username: string;
  };
  assignees: Array<{
    name: string;
    username: string;
  }>;
  labels: string[];
  web_url: string;
}

interface Pipeline {
  id: number;
  status: string;
  ref: string;
  sha: string;
  created_at: string;
  updated_at: string;
  web_url: string;
}

class GitLabManager {
  private client;

  constructor(config: GitLabConfig) {
    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, '') + '/api/v4',
      headers: {
        'PRIVATE-TOKEN': config.token,
        'Content-Type': 'application/json',
      },
    });
  }

  private async makeRequest<T>(path: string, method = 'GET', data?: any): Promise<T> {
    try {
      const response = await this.client.request({
        url: path,
        method,
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GitLab API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getMergeRequest(projectId: string | number, mrIid: number): Promise<MergeRequest> {
    return this.makeRequest<MergeRequest>(`/projects/${projectId}/merge_requests/${mrIid}`);
  }

  async listMergeRequests(projectId: string | number, state = 'opened'): Promise<MergeRequest[]> {
    return this.makeRequest<MergeRequest[]>(`/projects/${projectId}/merge_requests?state=${state}`);
  }

  async getIssue(projectId: string | number, issueIid: number): Promise<Issue> {
    return this.makeRequest<Issue>(`/projects/${projectId}/issues/${issueIid}`);
  }

  async listIssues(projectId: string | number, state = 'opened'): Promise<Issue[]> {
    return this.makeRequest<Issue[]>(`/projects/${projectId}/issues?state=${state}`);
  }

  async getPipeline(projectId: string | number, pipelineId: number): Promise<Pipeline> {
    return this.makeRequest<Pipeline>(`/projects/${projectId}/pipelines/${pipelineId}`);
  }

  async listPipelines(projectId: string | number): Promise<Pipeline[]> {
    return this.makeRequest<Pipeline[]>(`/projects/${projectId}/pipelines`);
  }

  async createMergeRequestComment(
    projectId: string | number,
    mrIid: number,
    comment: string
  ): Promise<void> {
    await this.makeRequest(
      `/projects/${projectId}/merge_requests/${mrIid}/notes`,
      'POST',
      { body: comment }
    );
  }

  async createIssueComment(
    projectId: string | number,
    issueIid: number,
    comment: string
  ): Promise<void> {
    await this.makeRequest(
      `/projects/${projectId}/issues/${issueIid}/notes`,
      'POST',
      { body: comment }
    );
  }
}

// Create a singleton instance
let gitlabManager: GitLabManager | null = null;

// Tool definitions
const authenticateTool: Tool = {
  id: 'authenticate',
  name: 'Authenticate',
  description: 'Authenticate with GitLab using a personal access token',
  parameters: [
    {
      name: 'baseUrl',
      type: 'string',
      description: 'GitLab instance URL (e.g., https://gitlab.com)',
      required: true,
    },
    {
      name: 'token',
      type: 'string',
      description: 'GitLab personal access token',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    gitlabManager = new GitLabManager({
      baseUrl: params.baseUrl,
      token: params.token,
    });
    return 'Authentication successful';
  },
};

const getMergeRequestTool: Tool = {
  id: 'get_merge_request',
  name: 'Get Merge Request',
  description: 'Get details of a specific merge request',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'mrIid',
      type: 'number',
      description: 'Merge request internal ID',
      required: true,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.getMergeRequest(params.projectId, params.mrIid);
  },
};

const listMergeRequestsTool: Tool = {
  id: 'list_merge_requests',
  name: 'List Merge Requests',
  description: 'List merge requests in a project',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'state',
      type: 'string',
      description: 'State of merge requests (opened, closed, merged, all)',
      required: false,
    }
  ],
  returnType: 'array',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.listMergeRequests(params.projectId, params.state);
  },
};

const getIssueTool: Tool = {
  id: 'get_issue',
  name: 'Get Issue',
  description: 'Get details of a specific issue',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'issueIid',
      type: 'number',
      description: 'Issue internal ID',
      required: true,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.getIssue(params.projectId, params.issueIid);
  },
};

const listIssuesTool: Tool = {
  id: 'list_issues',
  name: 'List Issues',
  description: 'List issues in a project',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'state',
      type: 'string',
      description: 'State of issues (opened, closed, all)',
      required: false,
    }
  ],
  returnType: 'array',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.listIssues(params.projectId, params.state);
  },
};

const getPipelineTool: Tool = {
  id: 'get_pipeline',
  name: 'Get Pipeline',
  description: 'Get details of a specific pipeline',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'pipelineId',
      type: 'number',
      description: 'Pipeline ID',
      required: true,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.getPipeline(params.projectId, params.pipelineId);
  },
};

const listPipelinesTool: Tool = {
  id: 'list_pipelines',
  name: 'List Pipelines',
  description: 'List pipelines in a project',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    }
  ],
  returnType: 'array',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    return await gitlabManager.listPipelines(params.projectId);
  },
};

const createMergeRequestCommentTool: Tool = {
  id: 'create_mr_comment',
  name: 'Create Merge Request Comment',
  description: 'Add a comment to a merge request',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'mrIid',
      type: 'number',
      description: 'Merge request internal ID',
      required: true,
    },
    {
      name: 'comment',
      type: 'string',
      description: 'Comment text',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await gitlabManager.createMergeRequestComment(params.projectId, params.mrIid, params.comment);
    return 'Comment created successfully';
  },
};

const createIssueCommentTool: Tool = {
  id: 'create_issue_comment',
  name: 'Create Issue Comment',
  description: 'Add a comment to an issue',
  parameters: [
    {
      name: 'projectId',
      type: 'string',
      description: 'Project ID or URL-encoded path',
      required: true,
    },
    {
      name: 'issueIid',
      type: 'number',
      description: 'Issue internal ID',
      required: true,
    },
    {
      name: 'comment',
      type: 'string',
      description: 'Comment text',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    if (!gitlabManager) {
      throw new Error('Not authenticated. Please call authenticate first.');
    }
    await gitlabManager.createIssueComment(params.projectId, params.issueIid, params.comment);
    return 'Comment created successfully';
  },
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
