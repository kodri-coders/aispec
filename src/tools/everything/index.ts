import { Tool } from "../puppeteer/index.js";

// Tiny image for testing
const MCP_TINY_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

const echoTool: Tool = {
  id: 'echo',
  name: 'Echo',
  description: 'Echoes back the input message',
  parameters: [
    {
      name: 'message',
      type: 'string',
      description: 'Message to echo',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    return `Echo: ${params.message}`;
  },
};

const addTool: Tool = {
  id: 'add',
  name: 'Add Numbers',
  description: 'Adds two numbers together',
  parameters: [
    {
      name: 'a',
      type: 'number',
      description: 'First number',
      required: true,
    },
    {
      name: 'b',
      type: 'number',
      description: 'Second number',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const sum = params.a + params.b;
    return `The sum of ${params.a} and ${params.b} is ${sum}.`;
  },
};

const longRunningOperationTool: Tool = {
  id: 'long_running_operation',
  name: 'Long Running Operation',
  description: 'Demonstrates a long running operation with progress updates',
  parameters: [
    {
      name: 'duration',
      type: 'number',
      description: 'Duration of the operation in seconds',
      required: false,
      defaultValue: 10,
    },
    {
      name: 'steps',
      type: 'number',
      description: 'Number of steps in the operation',
      required: false,
      defaultValue: 5,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const { duration = 10, steps = 5 } = params;
    const stepDuration = duration / steps;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDuration * 1000));
      console.log(`Progress: ${i}/${steps}`);
    }

    return `Long running operation completed. Duration: ${duration} seconds, Steps: ${steps}.`;
  },
};

const getTinyImageTool: Tool = {
  id: 'get_tiny_image',
  name: 'Get Tiny Image',
  description: 'Returns a tiny test image in base64 format',
  parameters: [],
  returnType: 'string',
  handler: async () => {
    return MCP_TINY_IMAGE;
  },
};

const tools = [
  echoTool,
  addTool,
  longRunningOperationTool,
  getTinyImageTool,
];

export { tools };
