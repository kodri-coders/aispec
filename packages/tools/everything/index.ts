import { Tool } from '@aispec/tool-types';

// Tiny image for testing
const MCP_TINY_IMAGE = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const echoTool: Tool = {
  description: 'Echoes back the input message',
  handler: async (params: any) => {
    return `Echo: ${params.message}`;
  },
  id: 'echo',
  name: 'Echo',
  parameters: [
    {
      description: 'Message to echo',
      name: 'message',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const addTool: Tool = {
  description: 'Adds two numbers together',
  handler: async (params: any) => {
    const sum = params.a + params.b;
    return `The sum of ${params.a} and ${params.b} is ${sum}.`;
  },
  id: 'add',
  name: 'Add Numbers',
  parameters: [
    {
      description: 'First number',
      name: 'a',
      required: true,
      type: 'number',
    },
    {
      description: 'Second number',
      name: 'b',
      required: true,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const longRunningOperationTool: Tool = {
  description: 'Demonstrates a long running operation with progress updates',
  handler: async (params: any) => {
    const { duration = 10, steps = 5 } = params;
    const stepDuration = duration / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration * 1000));
      console.log(`Progress: ${i}/${steps}`);
    }

    return `Long running operation completed. Duration: ${duration} seconds, Steps: ${steps}.`;
  },
  id: 'long_running_operation',
  name: 'Long Running Operation',
  parameters: [
    {
      defaultValue: 10,
      description: 'Duration of the operation in seconds',
      name: 'duration',
      required: false,
      type: 'number',
    },
    {
      defaultValue: 5,
      description: 'Number of steps in the operation',
      name: 'steps',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const getTinyImageTool: Tool = {
  description: 'Returns a tiny test image in base64 format',
  handler: async () => {
    return MCP_TINY_IMAGE;
  },
  id: 'get_tiny_image',
  name: 'Get Tiny Image',
  parameters: [],
  returnType: 'string',
};

const tools = [
  echoTool,
  addTool,
  longRunningOperationTool,
  getTinyImageTool,
];

export { tools };
