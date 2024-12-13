import { Tool } from '@aispec/tool-types';
import { simpleGit, SimpleGit } from 'simple-git';

class GitClient {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async add(files: string[]): Promise<string> {
    await this.git.add(files);
    return 'Files staged successfully';
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return `Changes committed successfully with hash ${result.commit}`;
  }

  async diffStaged(): Promise<string> {
    return this.git.diff(['--cached']);
  }

  async diffUnstaged(): Promise<string> {
    return this.git.diff();
  }

  async log(maxCount = 10): Promise<string> {
    const log = await this.git.log({ maxCount });
    return log.all.map(commit => (
      `Commit: ${commit.hash}\n`
      + `Author: ${commit.author_name} <${commit.author_email}>\n`
      + `Date: ${commit.date}\n`
      + `Message: ${commit.message}\n`
    )).join('\n');
  }

  async reset(): Promise<string> {
    await this.git.reset(['--mixed']);
    return 'All staged changes reset';
  }

  async status(): Promise<string> {
    const status = await this.git.status();
    return JSON.stringify(status, null, 2);
  }
}

const statusTool: Tool = {
  description: 'Shows the working tree status',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.status();
  },
  id: 'git_status',
  name: 'Git Status',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const diffUnstagedTool: Tool = {
  description: 'Shows changes in the working directory that are not yet staged',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.diffUnstaged();
  },
  id: 'git_diff_unstaged',
  name: 'Git Diff Unstaged',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const diffStagedTool: Tool = {
  description: 'Shows changes that are staged for commit',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.diffStaged();
  },
  id: 'git_diff_staged',
  name: 'Git Diff Staged',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const commitTool: Tool = {
  description: 'Records changes to the repository',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.commit(params.message);
  },
  id: 'git_commit',
  name: 'Git Commit',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
    {
      description: 'Commit message',
      name: 'message',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const addTool: Tool = {
  description: 'Adds file contents to the staging area',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.add(params.files);
  },
  id: 'git_add',
  name: 'Git Add',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
    {
      description: 'List of files to stage',
      name: 'files',
      required: true,
      type: 'array',
    },
  ],
  returnType: 'string',
};

const resetTool: Tool = {
  description: 'Unstages all staged changes',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.reset();
  },
  id: 'git_reset',
  name: 'Git Reset',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const logTool: Tool = {
  description: 'Shows the commit logs',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.log(params.max_count);
  },
  id: 'git_log',
  name: 'Git Log',
  parameters: [
    {
      description: 'Path to the Git repository',
      name: 'repo_path',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 10,
      description: 'Maximum number of commits to show',
      name: 'max_count',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const tools = [
  statusTool,
  diffUnstagedTool,
  diffStagedTool,
  commitTool,
  addTool,
  resetTool,
  logTool,
];

export { tools };
