import { Tool } from "../puppeteer/index.js";
import { simpleGit, SimpleGit } from 'simple-git';

class GitClient {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async status(): Promise<string> {
    const status = await this.git.status();
    return JSON.stringify(status, null, 2);
  }

  async diffUnstaged(): Promise<string> {
    return this.git.diff();
  }

  async diffStaged(): Promise<string> {
    return this.git.diff(['--cached']);
  }

  async commit(message: string): Promise<string> {
    const result = await this.git.commit(message);
    return `Changes committed successfully with hash ${result.commit}`;
  }

  async add(files: string[]): Promise<string> {
    await this.git.add(files);
    return "Files staged successfully";
  }

  async reset(): Promise<string> {
    await this.git.reset(['--mixed']);
    return "All staged changes reset";
  }

  async log(maxCount: number = 10): Promise<string> {
    const log = await this.git.log({ maxCount });
    return log.all.map(commit => (
      `Commit: ${commit.hash}\n` +
      `Author: ${commit.author_name} <${commit.author_email}>\n` +
      `Date: ${commit.date}\n` +
      `Message: ${commit.message}\n`
    )).join('\n');
  }
}

const statusTool: Tool = {
  id: 'git_status',
  name: 'Git Status',
  description: 'Shows the working tree status',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.status();
  },
};

const diffUnstagedTool: Tool = {
  id: 'git_diff_unstaged',
  name: 'Git Diff Unstaged',
  description: 'Shows changes in the working directory that are not yet staged',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.diffUnstaged();
  },
};

const diffStagedTool: Tool = {
  id: 'git_diff_staged',
  name: 'Git Diff Staged',
  description: 'Shows changes that are staged for commit',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.diffStaged();
  },
};

const commitTool: Tool = {
  id: 'git_commit',
  name: 'Git Commit',
  description: 'Records changes to the repository',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    },
    {
      name: 'message',
      type: 'string',
      description: 'Commit message',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.commit(params.message);
  },
};

const addTool: Tool = {
  id: 'git_add',
  name: 'Git Add',
  description: 'Adds file contents to the staging area',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    },
    {
      name: 'files',
      type: 'array',
      description: 'List of files to stage',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.add(params.files);
  },
};

const resetTool: Tool = {
  id: 'git_reset',
  name: 'Git Reset',
  description: 'Unstages all staged changes',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.reset();
  },
};

const logTool: Tool = {
  id: 'git_log',
  name: 'Git Log',
  description: 'Shows the commit logs',
  parameters: [
    {
      name: 'repo_path',
      type: 'string',
      description: 'Path to the Git repository',
      required: true,
    },
    {
      name: 'max_count',
      type: 'number',
      description: 'Maximum number of commits to show',
      required: false,
      defaultValue: 10,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const git = new GitClient(params.repo_path);
    return await git.log(params.max_count);
  },
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
