import { openai } from '@ai-sdk/openai';
import { generateText, jsonSchema, tool } from 'ai';
// load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

interface Model {
  max_tokens: number;
  name: string;
  temperature: number;
}
export class LLMEngine {
  model: Model;
  constructor(model: Model) {
    this.model = model;
  }

  modelFactory(model: Model): LLMEngine {
    return new LLMEngine(model);
  }

  prepareRequest({
    systemPrompt,
    prompt,
    tools,
    model,
  }: {
    systemPrompt: string;
    prompt: string;
    tools: any;
    model: any;
  }): any {
    switch (model.name) {
      case 'gpt-4':
      case 'gpt-4o':
      case 'gpt-3.5':
        return {
          system: systemPrompt,
          prompt,
          tools: tools.map((t: any) => tool({
            ...t,
            parameters: jsonSchema(t.parameters[0]),
          })),
          model: openai(model.name),
          temperature: model.temperature,
          maxTokens: model.max_tokens,
        };
      case 'o1-mini':
      case 'o1-preview':
        return {
          messages: [
            {
              role: 'user',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: `${prompt}
              You must respond in a JSON format with the following structure:
              ${JSON.stringify(tools[0].parameters[0], null, 2)}
              Do not wrap the JSON in any additional text or \`\`\` blocks.
              `,
            },

          ],
          model: openai(model.name),
        };
      default:
        throw new Error('Model not supported');
    }
  }

  handleResponse(response: any, responseTool?: any): any {
    switch (this.model.name) {
      case 'gpt-4':
      case 'gpt-4o':
      case 'gpt-3.5':
        return { text: response.text, tools: response.toolCalls };
      case 'o1-mini':
      case 'o1-preview':
        responseTool.execute(JSON.parse(response.text));
        return {
          text: '',
          tools: [responseTool],
        };
      default:
        throw new Error('Model not supported');
    }
  }

  async generateText({
    prompt,
    tools,
    systemPrompt,
  }: {
    prompt: string;
    systemPrompt: string;
    tools: any[];
  }): Promise<{ text: string; tools: any }> {
    const response = await generateText(
      this.prepareRequest({
        systemPrompt,
        prompt,
        tools,
        model: this.model,
      }));
    return this.handleResponse(response, tools[0]);
  }
}
