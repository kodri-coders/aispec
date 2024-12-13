import { Tool } from '@aispec/tool-types';
import fs from 'fs/promises';
import path from 'path';
import { Database } from 'sqlite3';
import { promisify } from 'util';

// Define the path to the SQLite database
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Type definitions
type QueryResult = Record<string, any>;

class SqliteManager {
  private db: Database;
  private insights: string[] = [];

  constructor() {
    // Ensure the directory exists
    fs.mkdir(path.dirname(DB_PATH), { recursive: true }).catch(() => {});

    this.db = new Database(DB_PATH);
    this.db.run = promisify(this.db.run.bind(this.db));
    this.db.all = promisify(this.db.all.bind(this.db));
    this.db.get = promisify(this.db.get.bind(this.db));
  }

  async addInsight(insight: string): Promise<void> {
    this.insights.push(insight);
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async describeTable(tableName: string): Promise<QueryResult[]> {
    return await this.executeQuery(`PRAGMA table_info(${tableName})`);
  }

  async getInsights(): Promise<string[]> {
    return this.insights;
  }

  async listTables(): Promise<string[]> {
    const results = await this.executeQuery(
      'SELECT name FROM sqlite_master WHERE type=\'table\'',
    );
    return results.map(row => row.name);
  }

  private async executeQuery(query: string): Promise<QueryResult[]> {
    try {
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        return await this.db.all(query);
      }
      else {
        const result = await this.db.run(query);
        return [{ changes: result.changes, lastID: result.lastID }];
      }
    }
    catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

// Create a singleton instance
const sqliteManager = new SqliteManager();

// Tool definitions
const readQueryTool: Tool = {
  description: 'Execute a SELECT query on the SQLite database',
  handler: async (params: any) => {
    const query = params.query.trim();
    if (!query.toUpperCase().startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed for read-query');
    }
    return await sqliteManager.executeQuery(query);
  },
  id: 'read_query',
  name: 'Read Query',
  parameters: [
    {
      description: 'SELECT SQL query to execute',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const writeQueryTool: Tool = {
  description:
    'Execute an INSERT, UPDATE, or DELETE query on the SQLite database',
  handler: async (params: any) => {
    const query = params.query.trim();
    if (query.toUpperCase().startsWith('SELECT')) {
      throw new Error('SELECT queries are not allowed for write-query');
    }
    return await sqliteManager.executeQuery(query);
  },
  id: 'write_query',
  name: 'Write Query',
  parameters: [
    {
      description: 'SQL query to execute (INSERT, UPDATE, or DELETE)',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const createTableTool: Tool = {
  description: 'Create a new table in the SQLite database',
  handler: async (params: any) => {
    const query = params.query.trim();
    if (!query.toUpperCase().startsWith('CREATE TABLE')) {
      throw new Error('Only CREATE TABLE statements are allowed');
    }
    await sqliteManager.executeQuery(query);
    return 'Table created successfully';
  },
  id: 'create_table',
  name: 'Create Table',
  parameters: [
    {
      description: 'CREATE TABLE SQL statement',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const listTablesTool: Tool = {
  description: 'List all tables in the SQLite database',
  handler: async () => {
    return await sqliteManager.listTables();
  },
  id: 'list_tables',
  name: 'List Tables',
  parameters: [],
  returnType: 'array',
};

const describeTableTool: Tool = {
  description: 'Get the schema information for a specific table',
  handler: async (params: any) => {
    return await sqliteManager.describeTable(params.tableName);
  },
  id: 'describe_table',
  name: 'Describe Table',
  parameters: [
    {
      description: 'Name of the table to describe',
      name: 'tableName',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const addInsightTool: Tool = {
  description: 'Add a business insight to the memo',
  handler: async (params: any) => {
    await sqliteManager.addInsight(params.insight);
    return 'Insight added successfully';
  },
  id: 'add_insight',
  name: 'Add Insight',
  parameters: [
    {
      description: 'Business insight discovered from data analysis',
      name: 'insight',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getInsightsTool: Tool = {
  description: 'Get all business insights from the memo',
  handler: async () => {
    return await sqliteManager.getInsights();
  },
  id: 'get_insights',
  name: 'Get Insights',
  parameters: [],
  returnType: 'array',
};

const tools = [
  readQueryTool,
  writeQueryTool,
  createTableTool,
  listTablesTool,
  describeTableTool,
  addInsightTool,
  getInsightsTool,
];

// Clean up on process exit
process.on('exit', () => {
  sqliteManager.close().catch(console.error);
});

export { tools };
