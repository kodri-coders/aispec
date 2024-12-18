import { Tool } from '@aispec/tool-types';
import { Octokit } from '@octokit/rest';

const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
if (!GITHUB_PERSONAL_ACCESS_TOKEN) {
  throw new Error('GITHUB_PERSONAL_ACCESS_TOKEN environment variable is not set');
}

const octokit = new Octokit({ auth: GITHUB_PERSONAL_ACCESS_TOKEN });

const createOrUpdateFileTool: Tool = {
  description: 'Create or update a single file in a GitHub repository',
  handler: async (params: any) => {
    const { branch, content, message, owner, path, repo } = params;

    try {
      const { data } = await octokit.repos.createOrUpdateFileContents({
        branch,
        content: Buffer.from(content).toString('base64'),
        message,
        owner,
        path,
        repo,
      });
      return JSON.stringify(data);
    }
    catch (error) {
      throw new Error(`Failed to create/update file: ${error.message}`);
    }
  },
  id: 'github_create_or_update_file',
  name: 'Create or Update GitHub File',
  parameters: [
    {
      description: 'Repository owner',
      name: 'owner',
      required: true,
      type: 'string',
    },
    {
      description: 'Repository name',
      name: 'repo',
      required: true,
      type: 'string',
    },
    {
      description: 'Path to the file',
      name: 'path',
      required: true,
      type: 'string',
    },
    {
      description: 'File content',
      name: 'content',
      required: true,
      type: 'string',
    },
    {
      description: 'Commit message',
      name: 'message',
      required: true,
      type: 'string',
    },
    {
      description: 'Branch name',
      name: 'branch',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const searchRepositoriesTool: Tool = {
  description: 'Search for GitHub repositories',
  handler: async (params: any) => {
    const { data } = await octokit.search.repos({
      page: params.page,
      per_page: params.per_page,
      q: params.query,
    });
    return JSON.stringify(data);
  },
  id: 'github_search_repositories',
  name: 'Search GitHub Repositories',
  parameters: [
    {
      description: 'Search query',
      name: 'query',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 1,
      description: 'Page number',
      name: 'page',
      required: false,
      type: 'number',
    },
    {
      defaultValue: 30,
      description: 'Results per page',
      name: 'per_page',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const createRepositoryTool: Tool = {
  description: 'Create a new GitHub repository',
  handler: async (params: any) => {
    const { data } = await octokit.repos.createForAuthenticatedUser({
      auto_init: true,
      description: params.description,
      name: params.name,
      private: params.private,
    });
    return JSON.stringify(data);
  },
  id: 'github_create_repository',
  name: 'Create GitHub Repository',
  parameters: [
    {
      description: 'Repository name',
      name: 'name',
      required: true,
      type: 'string',
    },
    {
      description: 'Repository description',
      name: 'description',
      required: false,
      type: 'string',
    },
    {
      defaultValue: false,
      description: 'Whether the repository should be private',
      name: 'private',
      required: false,
      type: 'boolean',
    },
  ],
  returnType: 'string',
};

const createIssueTool: Tool = {
  description: 'Create a new issue in a GitHub repository',
  handler: async (params: any) => {
    const { data } = await octokit.issues.create({
      body: params.body,
      owner: params.owner,
      repo: params.repo,
      title: params.title,
    });
    return JSON.stringify(data);
  },
  id: 'github_create_issue',
  name: 'Create GitHub Issue',
  parameters: [
    {
      description: 'Repository owner',
      name: 'owner',
      required: true,
      type: 'string',
    },
    {
      description: 'Repository name',
      name: 'repo',
      required: true,
      type: 'string',
    },
    {
      description: 'Issue title',
      name: 'title',
      required: true,
      type: 'string',
    },
    {
      description: 'Issue body',
      name: 'body',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const createPullRequestTool: Tool = {
  description: 'Create a new pull request in a GitHub repository',
  handler: async (params: any) => {
    const { data } = await octokit.pulls.create({
      base: params.base,
      body: params.body,
      head: params.head,
      owner: params.owner,
      repo: params.repo,
      title: params.title,
    });
    return JSON.stringify(data);
  },
  id: 'github_create_pull_request',
  name: 'Create GitHub Pull Request',
  parameters: [
    {
      description: 'Repository owner',
      name: 'owner',
      required: true,
      type: 'string',
    },
    {
      description: 'Repository name',
      name: 'repo',
      required: true,
      type: 'string',
    },
    {
      description: 'Pull request title',
      name: 'title',
      required: true,
      type: 'string',
    },
    {
      description: 'Pull request description',
      name: 'body',
      required: true,
      type: 'string',
    },
    {
      description: 'The name of the branch where your changes are implemented',
      name: 'head',
      required: true,
      type: 'string',
    },
    {
      description: 'The name of the branch you want the changes pulled into',
      name: 'base',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = [
  createOrUpdateFileTool,
  searchRepositoriesTool,
  createRepositoryTool,
  createIssueTool,
  createPullRequestTool,
];

export { tools };
