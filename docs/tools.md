# Available Tools

## src/tools/brave-search/index.ts

### Brave Web Search
- ID: `brave_web_search`
- Description: Performs a web search using the Brave Search API. Best for general queries, news, articles, and online content.

### Brave Local Search
- ID: `brave_local_search`
- Description: Searches for local businesses and places. Best for location-based queries like restaurants, services, etc.

---

## src/tools/everything/index.ts

### Echo
- ID: `echo`
- Description: Echoes back the input message

### Add Numbers
- ID: `add`
- Description: Adds two numbers together

### Long Running Operation
- ID: `long_running_operation`
- Description: Demonstrates a long running operation with progress updates

### Get Tiny Image
- ID: `get_tiny_image`
- Description: Returns a tiny test image in base64 format

---

## src/tools/fetch-ts/index.ts

### Fetch URL
- ID: `fetch_url`
- Description: Fetches a URL from the internet and extracts its contents as markdown. Respects robots.txt and includes proper user agent identification.

---

## src/tools/filesystem/index.ts

### Read File
- ID: `fs_read_file`
- Description: Read the contents of a file

---

## src/tools/gdrive/index.ts

### Authenticate
- ID: `authenticate`
- Description: Authenticate with Google Drive

### List Files
- ID: `list_files`
- Description: List files in Google Drive

### Get File
- ID: `get_file`
- Description: Get a file from Google Drive by ID

### Search Files
- ID: `search_files`
- Description: Search for files in Google Drive

---

## src/tools/git/index.ts

### Git Status
- ID: `git_status`
- Description: Shows the working tree status

### Git Diff Unstaged
- ID: `git_diff_unstaged`
- Description: Shows changes in the working directory that are not yet staged

### Git Diff Staged
- ID: `git_diff_staged`
- Description: Shows changes that are staged for commit

### Git Commit
- ID: `git_commit`
- Description: Records changes to the repository

### Git Add
- ID: `git_add`
- Description: Adds file contents to the staging area

### Git Reset
- ID: `git_reset`
- Description: Unstages all staged changes

### Git Log
- ID: `git_log`
- Description: Shows the commit logs

---

## src/tools/github/index.ts

### Create or Update GitHub File
- ID: `github_create_or_update_file`
- Description: Create or update a single file in a GitHub repository

### Search GitHub Repositories
- ID: `github_search_repositories`
- Description: Search for GitHub repositories

### Create GitHub Repository
- ID: `github_create_repository`
- Description: Create a new GitHub repository

### Create GitHub Issue
- ID: `github_create_issue`
- Description: Create a new issue in a GitHub repository

### Create GitHub Pull Request
- ID: `github_create_pull_request`
- Description: Create a new pull request in a GitHub repository

---

## src/tools/gitlab-ts/index.ts

### Authenticate
- ID: `authenticate`
- Description: Authenticate with GitLab using a personal access token

### Get Merge Request
- ID: `get_merge_request`
- Description: Get details of a specific merge request

### List Merge Requests
- ID: `list_merge_requests`
- Description: List merge requests in a project

### Get Issue
- ID: `get_issue`
- Description: Get details of a specific issue

### List Issues
- ID: `list_issues`
- Description: List issues in a project

### Get Pipeline
- ID: `get_pipeline`
- Description: Get details of a specific pipeline

### List Pipelines
- ID: `list_pipelines`
- Description: List pipelines in a project

### Create Merge Request Comment
- ID: `create_mr_comment`
- Description: Add a comment to a merge request

### Create Issue Comment
- ID: `create_issue_comment`
- Description: Add a comment to an issue

---

## src/tools/google-maps/index.ts

### Google Maps Geocode
- ID: `maps_geocode`
- Description: Convert an address to coordinates

### Google Maps Reverse Geocode
- ID: `maps_reverse_geocode`
- Description: Convert coordinates to an address

### Google Maps Search Places
- ID: `maps_search_places`
- Description: Search for places by text query

### Google Maps Place Details
- ID: `maps_place_details`
- Description: Get detailed information about a place

### Google Maps Distance Matrix
- ID: `maps_distance_matrix`
- Description: Calculate travel distance and time between points

### Google Maps Elevation
- ID: `maps_elevation`
- Description: Get elevation data for locations

### Google Maps Directions
- ID: `maps_directions`
- Description: Get directions between two points

---

## src/tools/jira-ts/index.ts

### Authenticate
- ID: `authenticate`
- Description: Authenticate with Jira using email and API token

### Get Issue
- ID: `get_issue`
- Description: Get details of a specific Jira issue

### Search Issues
- ID: `search_issues`
- Description: Search for Jira issues using JQL

### Get Comments
- ID: `get_comments`
- Description: Get all comments on a Jira issue

### Add Comment
- ID: `add_comment`
- Description: Add a comment to a Jira issue

### Get Transitions
- ID: `get_transitions`
- Description: Get available transitions for a Jira issue

### Transition Issue
- ID: `transition_issue`
- Description: Move a Jira issue to a different status

### Assign Issue
- ID: `assign_issue`
- Description: Assign a Jira issue to a user

---

## src/tools/memory/index.ts

### Create Entities
- ID: `create_entities`
- Description: Create multiple new entities in the knowledge graph

### Create Relations
- ID: `create_relations`
- Description: Create multiple new relations between entities in the knowledge graph

### Add Observations
- ID: `add_observations`
- Description: Add new observations to existing entities

### Delete Entities
- ID: `delete_entities`
- Description: Delete multiple entities and their relations

### Delete Observations
- ID: `delete_observations`
- Description: Delete specific observations from entities

### Delete Relations
- ID: `delete_relations`
- Description: Delete multiple relations

### Read Graph
- ID: `read_graph`
- Description: Read the entire knowledge graph

### Search Nodes
- ID: `search_nodes`
- Description: Search for nodes in the knowledge graph

### Open Nodes
- ID: `open_nodes`
- Description: Open specific nodes by their names

---

## src/tools/postgres/index.ts

### PostgreSQL Query
- ID: `postgres_query`
- Description: Run a read-only SQL query

---

## src/tools/puppeteer/index.ts

### Puppeteer Navigate
- ID: `puppeteer_navigate`
- Description: Navigate to a URL

### Puppeteer Screenshot
- ID: `puppeteer_screenshot`
- Description: Take a screenshot of the current page or a specific element

### Puppeteer Click
- ID: `puppeteer_click`
- Description: Click an element on the page

### Puppeteer Fill
- ID: `puppeteer_fill`
- Description: Fill out an input field

### Puppeteer Evaluate
- ID: `puppeteer_evaluate`
- Description: Execute JavaScript in the browser console

---

## src/tools/python-runner/index.ts

### Run Python Code
- ID: `run_code`
- Description: Execute Python code and return the output

### Run Python Code with Input
- ID: `run_code_with_input`
- Description: Execute Python code with input data

### Run Interactive Python Code
- ID: `run_interactive_code`
- Description: Execute Python code that requires multiple user inputs

### Install Python Package
- ID: `install_package`
- Description: Install a Python package using pip

---

## src/tools/sentry-ts/index.ts

### Authenticate
- ID: `authenticate`
- Description: Authenticate with Sentry using an auth token

### Get Issue
- ID: `get_issue`
- Description: Retrieve and analyze a Sentry issue by ID or URL

---

## src/tools/slack/index.ts

### Slack Post Message
- ID: `slack_post_message`
- Description: Post a new message to a Slack channel

### Slack Reply to Thread
- ID: `slack_reply_to_thread`
- Description: Reply to a specific message thread in Slack

### Slack Add Reaction
- ID: `slack_add_reaction`
- Description: Add a reaction emoji to a message

### Slack Get Channel History
- ID: `slack_get_channel_history`
- Description: Get recent messages from a channel

### Slack Get Thread Replies
- ID: `slack_get_thread_replies`
- Description: Get replies to a thread

### Slack Get Users
- ID: `slack_get_users`
- Description: Get list of users in the workspace

### Slack Get User Profile
- ID: `slack_get_user_profile`
- Description: Get a user\s profile information

---

## src/tools/sqlite-ts/index.ts

### Read Query
- ID: `read_query`
- Description: Execute a SELECT query on the SQLite database

### Write Query
- ID: `write_query`
- Description: Execute an INSERT, UPDATE, or DELETE query on the SQLite database

### Create Table
- ID: `create_table`
- Description: Create a new table in the SQLite database

### List Tables
- ID: `list_tables`
- Description: List all tables in the SQLite database

### Describe Table
- ID: `describe_table`
- Description: Get the schema information for a specific table

### Add Insight
- ID: `add_insight`
- Description: Add a business insight to the memo

### Get Insights
- ID: `get_insights`
- Description: Get all business insights from the memo

---

## src/tools/src/fetch-ts/index.ts

### Fetch URL
- ID: `fetch_url`
- Description: Fetches a URL from the internet and extracts its contents as markdown. Respects robots.txt and includes proper user agent identification.

---

## src/tools/treesitter/index.ts

### Parse File
- ID: `parse_file`
- Description: Parse a file using TreeSitter and return its AST

### Parse Code
- ID: `parse_code`
- Description: Parse a code snippet using TreeSitter and return its AST

### Query File
- ID: `query_file`
- Description: Query a file using TreeSitter query syntax

### Query Code
- ID: `query_code`
- Description: Query a code snippet using TreeSitter query syntax

### Search Codebase
- ID: `search_codebase`
- Description: Search through multiple files in directories using TreeSitter query patterns

---

## src/tools/typescript-runner/index.ts

### Run TypeScript Code
- ID: `run_code`
- Description: Execute TypeScript code and return the output

### Run TypeScript Code with Input
- ID: `run_code_with_input`
- Description: Execute TypeScript code with input data

### Run Interactive TypeScript Code
- ID: `run_interactive_code`
- Description: Execute TypeScript code that requires multiple user inputs

### Install NPM Package
- ID: `install_package`
- Description: Install an NPM package

---
