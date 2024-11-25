import { Assistant } from '@aispec/lib/core/Assistant';
import { Tool, ToolParameters } from '@aispec/lib/types/tool';
import { z } from 'zod';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define a search tool
const searchTool: Tool = {
  id: 'search_tool',
  name: 'Web Search',
  description: 'Performs a web search and returns results',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'The search query',
      required: true,
    },
  ],
  returnType: 'array',
  handler: async (params: ToolParameters) => {
    console.log('Executing search tool with params:', params);
    const query = params.query as string;
    // In a real implementation, this would call an actual search API
    return [
      `Found article: "Best TypeScript Practices for ${query}"`,
      `Found article: "Advanced ${query} Guide"`,
      `Found article: "${query} Tips and Tricks"`,
    ];
  },
};

async function main() {
  try {
    // Create and configure assistant
    const xmlPath = path.join(__dirname, 'search_assistant.xml');
    const xmlContent = await fs.readFile(xmlPath, 'utf-8');
    const assistant = await Assistant.fromXML(xmlContent);
    assistant.addTool(searchTool);

    // Execute workflow
    console.log('Executing search workflow...');
    const result = await assistant.executeWorkflow('search_and_summarize', {
      query: 'TypeScript best practices',
    });

    console.log('Workflow result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
