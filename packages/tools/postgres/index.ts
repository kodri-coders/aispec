import { Tool } from '@aispec/tool-types';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const queryTool: Tool = {
  description: 'Run a read-only SQL query',
  handler: async (params: any) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN TRANSACTION READ ONLY');
      const result = await client.query(params.sql);
      await client.query('ROLLBACK');
      return JSON.stringify(result.rows, null, 2);
    }
    finally {
      client.release();
    }
  },
  id: 'postgres_query',
  name: 'PostgreSQL Query',
  parameters: [
    {
      description: 'SQL query to execute (must be read-only)',
      name: 'sql',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = [queryTool];

export { tools };
