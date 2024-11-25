import { Tool } from "../puppeteer/index.js";
import { Octokit } from "@octokit/rest";

const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
if (!GITHUB_PERSONAL_ACCESS_TOKEN) {
  throw new Error("GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set");
}

const octokit = new Octokit({ auth: GITHUB_PERSONAL_ACCESS_TOKEN });

const createOrUpdateFileTool: Tool = {
  id: 'github_create_or_update_file',
  name: 'Create or Update GitHub File',
  description: 'Create or update a single file in a GitHub repository',
  parameters: [
    {
      name: 'owner',
      type: 'string',
      description: 'Repository owner',
      required: true,
    },
    {
      name: 'repo',
      type: 'string',
      description: 'Repository name',
      required: true,
    },
    {
      name: 'path',
      type: 'string',
      description: 'Path to the file',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'File content',
      required: true,
    },
    {
      name: 'message',
      type: 'string',
      description: 'Commit message',
      required: true,
    },
    {
      name: 'branch',
      type: 'string',
      description: 'Branch name',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const { owner, repo, path, content, message, branch } = params;
    
    try {
      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message,
        content: Buffer.from(content).toString('base64'),
        branch,
      });
      return JSON.stringify(data);
    } catch (error) {
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  },
};

const searchRepositoriesTool: Tool = {
  id: 'github_search_repositories',
  name: 'Search GitHub Repositories',
  description: 'Search for GitHub repositories',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true,
    },
    {
      name: 'page',
      type: 'number',
      description: 'Page number',
      required: false,
      defaultValue: 1,
    },
    {
      name: 'per_page',
      type: 'number',
      description: 'Results per page',
      required: false,
      defaultValue: 30,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const { data } = await octokit.search.repos({
      q: params.query,
      page: params.page,
      per_page: params.per_page,
    });
    return JSON.stringify(data);
  },
};

const createRepositoryTool: Tool = {
  id: 'github_create_repository',
  name: 'Create GitHub Repository',
  description: 'Create a new GitHub repository',
  parameters: [
    {
      name: 'name',
      type: 'string',
      description: 'Repository name',
      required: true,
    },
    {
      name: 'description',
      type: 'string',
      description: 'Repository description',
      required: false,
    },
    {
      name: 'private',
      type: 'boolean',
      description: 'Whether the repository should be private',
      required: false,
      defaultValue: false,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      name: params.name,
      description: params.description,
      private: params.private,
      auto_init: true,
    });
    return JSON.stringify(data);
  },
};

const createIssueTool: Tool = {
  id: 'github_create_issue',
  name: 'Create GitHub Issue',
  description: 'Create a new issue in a GitHub repository',
  parameters: [
    {
      name: 'owner',
      type: 'string',
      description: 'Repository owner',
      required: true,
    },
    {
      name: 'repo',
      type: 'string',
      description: 'Repository name',
      required: true,
    },
    {
      name: 'title',
      type: 'string',
      description: 'Issue title',
      required: true,
    },
    {
      name: 'body',
      type: 'string',
      description: 'Issue body',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const { data } = await octokit.issues.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
    });
    return JSON.stringify(data);
  },
};

const createPullRequestTool: Tool = {
  id: 'github_create_pull_request',
  name: 'Create GitHub Pull Request',
  description: 'Create a new pull request in a GitHub repository',
  parameters: [
    {
      name: 'owner',
      type: 'string',
      description: 'Repository owner',
      required: true,
    },
    {
      name: 'repo',
      type: 'string',
      description: 'Repository name',
      required: true,
    },
    {
      name: 'title',
      type: 'string',
      description: 'Pull request title',
      required: true,
    },
    {
      name: 'body',
      type: 'string',
      description: 'Pull request description',
      required: true,
    },
    {
      name: 'head',
      type: 'string',
      description: 'The name of the branch where your changes are implemented',
      required: true,
    },
    {
      name: 'base',
      type: 'string',
      description: 'The name of the branch you want the changes pulled into',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const { data } = await octokit.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base,
    });
    return JSON.stringify(data);
  },
};

const tools = [
  createOrUpdateFileTool,
  searchRepositoriesTool,
  createRepositoryTool,
  createIssueTool,
  createPullRequestTool,
];

export { tools };
