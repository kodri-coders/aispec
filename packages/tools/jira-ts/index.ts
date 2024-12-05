import { Tool } from "@aispec/tool-types";
import axios from "axios";

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
}

interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description: string;
    status: {
      name: string;
    };
    priority: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    reporter: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    labels: string[];
  };
}

interface JiraComment {
  id: string;
  author: {
    displayName: string;
    emailAddress: string;
  };
  body: string;
  created: string;
  updated: string;
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
      "base64",
    );
    this.client = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, "") + "/rest/api/3",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
  }

  private async makeRequest<T>(
    path: string,
    method = "GET",
    data?: any,
  ): Promise<T> {
    try {
      const response = await this.client.request({
        url: path,
        method,
        data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Jira API error: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue> {
    return this.makeRequest<JiraIssue>(`/issue/${issueKey}`);
  }

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const response = await this.makeRequest<{ issues: JiraIssue[] }>(
      "/search",
      "POST",
      {
        jql,
        maxResults: 50,
      },
    );
    return response.issues;
  }

  async getComments(issueKey: string): Promise<JiraComment[]> {
    const response = await this.makeRequest<{ comments: JiraComment[] }>(
      `/issue/${issueKey}/comment`,
    );
    return response.comments;
  }

  async addComment(issueKey: string, comment: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/comment`, "POST", {
      body: {
        type: "doc",
        version: 1,
        content: [
          { type: "paragraph", content: [{ type: "text", text: comment }] },
        ],
      },
    });
  }

  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    const response = await this.makeRequest<{ transitions: JiraTransition[] }>(
      `/issue/${issueKey}/transitions`,
    );
    return response.transitions;
  }

  async transitionIssue(issueKey: string, transitionId: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/transitions`, "POST", {
      transition: { id: transitionId },
    });
  }

  async assignIssue(issueKey: string, accountId: string): Promise<void> {
    await this.makeRequest(`/issue/${issueKey}/assignee`, "PUT", { accountId });
  }
}

// Create a singleton instance
let jiraManager: JiraManager | null = null;

// Tool definitions
const authenticateTool: Tool = {
  id: "authenticate",
  name: "Authenticate",
  description: "Authenticate with Jira using email and API token",
  parameters: [
    {
      name: "baseUrl",
      type: "string",
      description:
        "Jira instance URL (e.g., https://your-domain.atlassian.net)",
      required: true,
    },
    {
      name: "email",
      type: "string",
      description: "Jira account email",
      required: true,
    },
    {
      name: "apiToken",
      type: "string",
      description: "Jira API token",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    jiraManager = new JiraManager({
      baseUrl: params.baseUrl,
      email: params.email,
      apiToken: params.apiToken,
    });
    return "Authentication successful";
  },
};

const getIssueTool: Tool = {
  id: "get_issue",
  name: "Get Issue",
  description: "Get details of a specific Jira issue",
  parameters: [
    {
      name: "issueKey",
      type: "string",
      description: "Issue key (e.g., PROJECT-123)",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    return await jiraManager.getIssue(params.issueKey);
  },
};

const searchIssuesTool: Tool = {
  id: "search_issues",
  name: "Search Issues",
  description: "Search for Jira issues using JQL",
  parameters: [
    {
      name: "jql",
      type: "string",
      description: "JQL search query",
      required: true,
    },
  ],
  returnType: "array",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    return await jiraManager.searchIssues(params.jql);
  },
};

const getCommentsTool: Tool = {
  id: "get_comments",
  name: "Get Comments",
  description: "Get all comments on a Jira issue",
  parameters: [
    {
      name: "issueKey",
      type: "string",
      description: "Issue key (e.g., PROJECT-123)",
      required: true,
    },
  ],
  returnType: "array",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    return await jiraManager.getComments(params.issueKey);
  },
};

const addCommentTool: Tool = {
  id: "add_comment",
  name: "Add Comment",
  description: "Add a comment to a Jira issue",
  parameters: [
    {
      name: "issueKey",
      type: "string",
      description: "Issue key (e.g., PROJECT-123)",
      required: true,
    },
    {
      name: "comment",
      type: "string",
      description: "Comment text",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    await jiraManager.addComment(params.issueKey, params.comment);
    return "Comment added successfully";
  },
};

const getTransitionsTool: Tool = {
  id: "get_transitions",
  name: "Get Transitions",
  description: "Get available transitions for a Jira issue",
  parameters: [
    {
      name: "issueKey",
      type: "string",
      description: "Issue key (e.g., PROJECT-123)",
      required: true,
    },
  ],
  returnType: "array",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    return await jiraManager.getTransitions(params.issueKey);
  },
};

const transitionIssueTool: Tool = {
  id: "transition_issue",
  name: "Transition Issue",
  description: "Move a Jira issue to a different status",
  parameters: [
    {
      name: "issueKey",
      type: "string",
      description: "Issue key (e.g., PROJECT-123)",
      required: true,
    },
    {
      name: "transitionId",
      type: "string",
      description: "Transition ID",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    await jiraManager.transitionIssue(params.issueKey, params.transitionId);
    return "Issue transitioned successfully";
  },
};

const assignIssueTool: Tool = {
  id: "assign_issue",
  name: "Assign Issue",
  description: "Assign a Jira issue to a user",
  parameters: [
    {
      name: "issueKey",
      type: "string",
      description: "Issue key (e.g., PROJECT-123)",
      required: true,
    },
    {
      name: "accountId",
      type: "string",
      description: "Account ID of the assignee",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    if (!jiraManager) {
      throw new Error("Not authenticated. Please call authenticate first.");
    }
    await jiraManager.assignIssue(params.issueKey, params.accountId);
    return "Issue assigned successfully";
  },
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
