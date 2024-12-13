import { z } from 'zod';

// Base schemas for common types
export const GitHubAuthorSchema = z.object({
  date: z.string(),
  email: z.string(),
  name: z.string(),
});

// Repository related schemas
export const GitHubOwnerSchema = z.object({
  avatar_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  node_id: z.string(),
  type: z.string(),
  url: z.string(),
});

export const GitHubRepositorySchema = z.object({
  clone_url: z.string(),
  created_at: z.string(),
  default_branch: z.string(),
  description: z.string().nullable(),
  fork: z.boolean(),
  full_name: z.string(),
  git_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  name: z.string(),
  node_id: z.string(),
  owner: GitHubOwnerSchema,
  private: z.boolean(),
  pushed_at: z.string(),
  ssh_url: z.string(),
  updated_at: z.string(),
  url: z.string(),
});

// File content schemas
export const GitHubFileContentSchema = z.object({
  content: z.string(),
  download_url: z.string(),
  encoding: z.string(),
  git_url: z.string(),
  html_url: z.string(),
  name: z.string(),
  path: z.string(),
  sha: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
});

export const GitHubDirectoryContentSchema = z.object({
  download_url: z.string().nullable(),
  git_url: z.string(),
  html_url: z.string(),
  name: z.string(),
  path: z.string(),
  sha: z.string(),
  size: z.number(),
  type: z.string(),
  url: z.string(),
});

export const GitHubContentSchema = z.union([
  GitHubFileContentSchema,
  z.array(GitHubDirectoryContentSchema),
]);

// Operation schemas
export const FileOperationSchema = z.object({
  content: z.string(),
  path: z.string(),
});

// Tree and commit schemas
export const GitHubTreeEntrySchema = z.object({
  mode: z.enum(['100644', '100755', '040000', '160000', '120000']),
  path: z.string(),
  sha: z.string(),
  size: z.number().optional(),
  type: z.enum(['blob', 'tree', 'commit']),
  url: z.string(),
});

export const GitHubTreeSchema = z.object({
  sha: z.string(),
  tree: z.array(GitHubTreeEntrySchema),
  truncated: z.boolean(),
  url: z.string(),
});

export const GitHubCommitSchema = z.object({
  author: GitHubAuthorSchema,
  committer: GitHubAuthorSchema,
  message: z.string(),
  node_id: z.string(),
  parents: z.array(z.object({
    sha: z.string(),
    url: z.string(),
  })),
  sha: z.string(),
  tree: z.object({
    sha: z.string(),
    url: z.string(),
  }),
  url: z.string(),
});

// Reference schema
export const GitHubReferenceSchema = z.object({
  node_id: z.string(),
  object: z.object({
    sha: z.string(),
    type: z.string(),
    url: z.string(),
  }),
  ref: z.string(),
  url: z.string(),
});

// Input schemas for operations
export const CreateRepositoryOptionsSchema = z.object({
  auto_init: z.boolean().optional(),
  description: z.string().optional(),
  name: z.string(),
  private: z.boolean().optional(),
});

export const CreateIssueOptionsSchema = z.object({
  assignees: z.array(z.string()).optional(),
  body: z.string().optional(),
  labels: z.array(z.string()).optional(),
  milestone: z.number().optional(),
  title: z.string(),
});

export const CreatePullRequestOptionsSchema = z.object({
  base: z.string(),
  body: z.string().optional(),
  draft: z.boolean().optional(),
  head: z.string(),
  maintainer_can_modify: z.boolean().optional(),
  title: z.string(),
});

export const CreateBranchOptionsSchema = z.object({
  ref: z.string(),
  sha: z.string(),
});

// Response schemas for operations
export const GitHubCreateUpdateFileResponseSchema = z.object({
  commit: z.object({
    author: GitHubAuthorSchema,
    committer: GitHubAuthorSchema,
    html_url: z.string(),
    message: z.string(),
    node_id: z.string(),
    parents: z.array(z.object({
      html_url: z.string(),
      sha: z.string(),
      url: z.string(),
    })),
    sha: z.string(),
    tree: z.object({
      sha: z.string(),
      url: z.string(),
    }),
    url: z.string(),
  }),
  content: GitHubFileContentSchema.nullable(),
});

export const GitHubSearchResponseSchema = z.object({
  incomplete_results: z.boolean(),
  items: z.array(GitHubRepositorySchema),
  total_count: z.number(),
});

// Fork related schemas
export const GitHubForkParentSchema = z.object({
  full_name: z.string(),
  html_url: z.string(),
  name: z.string(),
  owner: z.object({
    avatar_url: z.string(),
    id: z.number(),
    login: z.string(),
  }),
});

export const GitHubForkSchema = GitHubRepositorySchema.extend({
  parent: GitHubForkParentSchema,
  source: GitHubForkParentSchema,
});

// Issue related schemas
export const GitHubLabelSchema = z.object({
  color: z.string(),
  default: z.boolean(),
  description: z.string().optional(),
  id: z.number(),
  name: z.string(),
  node_id: z.string(),
  url: z.string(),
});

export const GitHubIssueAssigneeSchema = z.object({
  avatar_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  login: z.string(),
  url: z.string(),
});

export const GitHubMilestoneSchema = z.object({
  description: z.string(),
  html_url: z.string(),
  id: z.number(),
  labels_url: z.string(),
  node_id: z.string(),
  number: z.number(),
  state: z.string(),
  title: z.string(),
  url: z.string(),
});

export const GitHubIssueSchema = z.object({
  assignee: GitHubIssueAssigneeSchema.nullable(),
  assignees: z.array(GitHubIssueAssigneeSchema),
  body: z.string(),
  closed_at: z.string().nullable(),
  comments: z.number(),
  comments_url: z.string(),
  created_at: z.string(),
  events_url: z.string(),
  html_url: z.string(),
  id: z.number(),
  labels: z.array(GitHubLabelSchema),
  labels_url: z.string(),
  locked: z.boolean(),
  milestone: GitHubMilestoneSchema.nullable(),
  node_id: z.string(),
  number: z.number(),
  repository_url: z.string(),
  state: z.string(),
  title: z.string(),
  updated_at: z.string(),
  url: z.string(),
  user: GitHubIssueAssigneeSchema,
});

// Pull Request related schemas
export const GitHubPullRequestHeadSchema = z.object({
  label: z.string(),
  ref: z.string(),
  repo: GitHubRepositorySchema,
  sha: z.string(),
  user: GitHubIssueAssigneeSchema,
});

export const GitHubPullRequestSchema = z.object({
  assignee: GitHubIssueAssigneeSchema.nullable(),
  assignees: z.array(GitHubIssueAssigneeSchema),
  base: GitHubPullRequestHeadSchema,
  body: z.string(),
  closed_at: z.string().nullable(),
  created_at: z.string(),
  diff_url: z.string(),
  head: GitHubPullRequestHeadSchema,
  html_url: z.string(),
  id: z.number(),
  issue_url: z.string(),
  locked: z.boolean(),
  merge_commit_sha: z.string(),
  merged_at: z.string().nullable(),
  node_id: z.string(),
  number: z.number(),
  patch_url: z.string(),
  state: z.string(),
  title: z.string(),
  updated_at: z.string(),
  url: z.string(),
  user: GitHubIssueAssigneeSchema,
});

const RepoParamsSchema = z.object({
  owner: z.string().describe('Repository owner (username or organization)'),
  repo: z.string().describe('Repository name'),
});

export const CreateOrUpdateFileSchema = RepoParamsSchema.extend({
  branch: z.string().describe('Branch to create/update the file in'),
  content: z.string().describe('Content of the file'),
  message: z.string().describe('Commit message'),
  path: z.string().describe('Path where to create/update the file'),
  sha: z.string().optional()
    .describe('SHA of the file being replaced (required when updating existing files)'),
});

export const SearchRepositoriesSchema = z.object({
  page: z.number().optional().describe('Page number for pagination (default: 1)'),
  perPage: z.number().optional().describe('Number of results per page (default: 30, max: 100)'),
  query: z.string().describe('Search query (see GitHub search syntax)'),
});

export const CreateRepositorySchema = z.object({
  autoInit: z.boolean().optional().describe('Initialize with README.md'),
  description: z.string().optional().describe('Repository description'),
  name: z.string().describe('Repository name'),
  private: z.boolean().optional().describe('Whether the repository should be private'),
});

export const GetFileContentsSchema = RepoParamsSchema.extend({
  branch: z.string().optional().describe('Branch to get contents from'),
  path: z.string().describe('Path to the file or directory'),
});

export const PushFilesSchema = RepoParamsSchema.extend({
  branch: z.string().describe('Branch to push to (e.g., \'main\' or \'master\')'),
  files: z.array(z.object({
    content: z.string().describe('Content of the file'),
    path: z.string().describe('Path where to create the file'),
  })).describe('Array of files to push'),
  message: z.string().describe('Commit message'),
});

export const CreateIssueSchema = RepoParamsSchema.extend({
  assignees: z.array(z.string()).optional().describe('Array of usernames to assign'),
  body: z.string().optional().describe('Issue body/description'),
  labels: z.array(z.string()).optional().describe('Array of label names'),
  milestone: z.number().optional().describe('Milestone number to assign'),
  title: z.string().describe('Issue title'),
});

export const CreatePullRequestSchema = RepoParamsSchema.extend({
  base: z.string().describe('The name of the branch you want the changes pulled into'),
  body: z.string().optional().describe('Pull request body/description'),
  draft: z.boolean().optional().describe('Whether to create the pull request as a draft'),
  head: z.string().describe('The name of the branch where your changes are implemented'),
  maintainer_can_modify: z.boolean().optional()
    .describe('Whether maintainers can modify the pull request'),
  title: z.string().describe('Pull request title'),
});

export const ForkRepositorySchema = RepoParamsSchema.extend({
  organization: z.string().optional()
    .describe('Optional: organization to fork to (defaults to your personal account)'),
});

export const CreateBranchSchema = RepoParamsSchema.extend({
  branch: z.string().describe('Name for the new branch'),
  from_branch: z.string().optional()
    .describe('Optional: source branch to create from (defaults to the repository\'s default branch)'),
});

export type CreateBranchOptions = z.infer<typeof CreateBranchOptionsSchema>;
export type CreateIssueOptions = z.infer<typeof CreateIssueOptionsSchema>;
export type CreatePullRequestOptions = z.infer<typeof CreatePullRequestOptionsSchema>;
export type CreateRepositoryOptions = z.infer<typeof CreateRepositoryOptionsSchema>;
export type FileOperation = z.infer<typeof FileOperationSchema>;
// Export types
export type GitHubAuthor = z.infer<typeof GitHubAuthorSchema>;
export type GitHubCommit = z.infer<typeof GitHubCommitSchema>;
export type GitHubContent = z.infer<typeof GitHubContentSchema>;
export type GitHubCreateUpdateFileResponse = z.infer<typeof GitHubCreateUpdateFileResponseSchema>;
export type GitHubDirectoryContent = z.infer<typeof GitHubDirectoryContentSchema>;
export type GitHubFileContent = z.infer<typeof GitHubFileContentSchema>;
export type GitHubFork = z.infer<typeof GitHubForkSchema>;
export type GitHubIssue = z.infer<typeof GitHubIssueSchema>;
export type GitHubPullRequest = z.infer<typeof GitHubPullRequestSchema>;
export type GitHubReference = z.infer<typeof GitHubReferenceSchema>;
export type GitHubRepository = z.infer<typeof GitHubRepositorySchema>;
export type GitHubSearchResponse = z.infer<typeof GitHubSearchResponseSchema>;
export type GitHubTree = z.infer<typeof GitHubTreeSchema>;
