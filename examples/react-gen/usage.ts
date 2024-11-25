import { Assistant } from '@aispec/lib/core/Assistant';
import { Tool, ToolParameters } from '@aispec/lib/types/tool';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as dotenv from 'dotenv';
import { tools as filesystemTools } from '@aispec/lib/tools/filesystem/index';

// Load environment variables from project root
const projectRoot = path.join(__dirname, '../..');
dotenv.config({ path: path.join(projectRoot, '.env') });

// Define a file writer tool
const fileWriterTool: Tool = {
  id: 'file_writer',
  name: 'File Writer',
  description: 'Creates or updates files in the artifacts directory',
  parameters: [
    {
      name: 'filepath',
      type: 'string',
      description: 'The name of the file to create/update (relative to artifacts directory)',
      required: true,
    },
    {
      name: 'content',
      type: 'string',
      description: 'The content to write to the file. Make sure it is serialized in a single line for json',
      required: true,
    },
  ],
  returnType: 'string',
  handler: async (params: ToolParameters) => {
    const artifactsDir = path.join(__dirname, 'artifacts');
    const filePath = path.join(artifactsDir, params.filename as string);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, params.content as string);
    return `Created file: ${params.filename}`;
  },
};

async function main() {
  try {
    // Verify environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    console.log('Using AI model:', process.env.AI_MODEL || 'gpt-4');

    // Create and configure assistant
    const xmlPath = path.join(__dirname, 'react_assistant.xml');
    const xmlContent = await fs.readFile(xmlPath, 'utf-8');
    const assistant = await Assistant.fromXML(xmlContent);
    assistant.addTool(filesystemTools.writeFileTool)
    // Add filesystem tools
    // filesystemTools.forEach(tool => assistant.addTool(tool));
    // Execute workflow
    console.log('Generating React accordion component...');
    // const results = await assistant.executeWorkflow('design_component', {
    //   request: 'Create an accessible accordion component that can display multiple sections of content. Each section should have a header that can be clicked to expand/collapse the content. The component should support keyboard navigation and proper ARIA attributes.',
    // });
    const results = await assistant.executeWorkflow('generate_component', {
      request: 'Create an accessible accordion component that can display multiple sections of content. Each section should have a header that can be clicked to expand/collapse the content. The component should support keyboard navigation and proper ARIA attributes.',
    });
    // Log workflow results with filtered steps
    const filteredResults = results.map((step: any) => ({
      stepId: step.stepId,
      prompt: step.input.request,
      toolCalls: step.response.toolCalls,
      toolResults: step.response.toolResults,
      response: step.response.text
    }));
    console.log('Workflow results:', JSON.stringify(filteredResults, null, 2));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
