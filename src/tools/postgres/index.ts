import { Pool } from "pg";
import { Tool } from "../puppeteer/index.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const queryTool: Tool = {
  id: 'postgres_query',
  name: 'PostgreSQL Query',
  description: 'Run a read-only SQL query',
  parameters: [
    {
      name: 'sql',
      type: 'string',
      description: 'SQL query to execute (must be read-only)',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const client = await pool.connect();
    try {
      await client.query("BEGIN TRANSACTION READ ONLY");
      const result = await client.query(params.sql);
      await client.query("ROLLBACK");
      return JSON.stringify(result.rows, null, 2);
    } finally {
      client.release();
    }
  },
};

const tools = [queryTool];

export { tools };
