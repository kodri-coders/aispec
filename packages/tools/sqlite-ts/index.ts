import { Tool } from "@aispec/tool-types";
import { Database } from "sqlite3";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

// Define the path to the SQLite database
const DB_PATH = path.join(__dirname, "database.sqlite");

// Type definitions
interface QueryResult {
  [key: string]: any;
}

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

  private async executeQuery(query: string): Promise<QueryResult[]> {
    try {
      if (query.trim().toUpperCase().startsWith("SELECT")) {
        return await this.db.all(query);
      } else {
        const result = await this.db.run(query);
        return [{ changes: result.changes, lastID: result.lastID }];
      }
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  async listTables(): Promise<string[]> {
    const results = await this.executeQuery(
      "SELECT name FROM sqlite_master WHERE type='table'",
    );
    return results.map((row) => row.name);
  }

  async describeTable(tableName: string): Promise<QueryResult[]> {
    return await this.executeQuery(`PRAGMA table_info(${tableName})`);
  }

  async addInsight(insight: string): Promise<void> {
    this.insights.push(insight);
  }

  async getInsights(): Promise<string[]> {
    return this.insights;
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

// Create a singleton instance
const sqliteManager = new SqliteManager();

// Tool definitions
const readQueryTool: Tool = {
  id: "read_query",
  name: "Read Query",
  description: "Execute a SELECT query on the SQLite database",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "SELECT SQL query to execute",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    const query = params.query.trim();
    if (!query.toUpperCase().startsWith("SELECT")) {
      throw new Error("Only SELECT queries are allowed for read-query");
    }
    return await sqliteManager.executeQuery(query);
  },
};

const writeQueryTool: Tool = {
  id: "write_query",
  name: "Write Query",
  description:
    "Execute an INSERT, UPDATE, or DELETE query on the SQLite database",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "SQL query to execute (INSERT, UPDATE, or DELETE)",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    const query = params.query.trim();
    if (query.toUpperCase().startsWith("SELECT")) {
      throw new Error("SELECT queries are not allowed for write-query");
    }
    return await sqliteManager.executeQuery(query);
  },
};

const createTableTool: Tool = {
  id: "create_table",
  name: "Create Table",
  description: "Create a new table in the SQLite database",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "CREATE TABLE SQL statement",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const query = params.query.trim();
    if (!query.toUpperCase().startsWith("CREATE TABLE")) {
      throw new Error("Only CREATE TABLE statements are allowed");
    }
    await sqliteManager.executeQuery(query);
    return "Table created successfully";
  },
};

const listTablesTool: Tool = {
  id: "list_tables",
  name: "List Tables",
  description: "List all tables in the SQLite database",
  parameters: [],
  returnType: "array",
  handler: async () => {
    return await sqliteManager.listTables();
  },
};

const describeTableTool: Tool = {
  id: "describe_table",
  name: "Describe Table",
  description: "Get the schema information for a specific table",
  parameters: [
    {
      name: "tableName",
      type: "string",
      description: "Name of the table to describe",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await sqliteManager.describeTable(params.tableName);
  },
};

const addInsightTool: Tool = {
  id: "add_insight",
  name: "Add Insight",
  description: "Add a business insight to the memo",
  parameters: [
    {
      name: "insight",
      type: "string",
      description: "Business insight discovered from data analysis",
      required: true,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    await sqliteManager.addInsight(params.insight);
    return "Insight added successfully";
  },
};

const getInsightsTool: Tool = {
  id: "get_insights",
  name: "Get Insights",
  description: "Get all business insights from the memo",
  parameters: [],
  returnType: "array",
  handler: async () => {
    return await sqliteManager.getInsights();
  },
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
process.on("exit", () => {
  sqliteManager.close().catch(console.error);
});

export { tools };
