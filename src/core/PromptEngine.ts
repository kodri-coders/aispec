import { z } from 'zod';
import { generateText, tool } from 'ai';
import { Tool } from '@aispec/lib/types/tool';
import { createOpenAI } from '@ai-sdk/openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const loadModel = (modelId: string) => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict',
  });
  
  return openai(modelId, {
    structuredOutputs: true,
  });
};

export class PromptEngine {
  private modelId: string;
  private messageHistory: Message[];
  private assistantXml: string = '';

  constructor(modelId?: string) {
    this.modelId = modelId || process.env.AI_MODEL || 'gpt-4o';
    this.messageHistory = [];
  }

  public addMessage(message: Message): void {
    this.messageHistory.push(message);
  }

  public setAssistantXml(xml: string) {
    this.assistantXml = xml;
  }

  public async generateResponse(tools: Map<string, Tool>): Promise<any> {
    const aiTools = Object.fromEntries(
      Array.from(tools.entries()).map(([id, tool]) => [
        id,
        this.convertToolToAITool(tool)
      ])
    );
    console.log(`Calling AI with tools: ${tools.size}`, this.messageHistory[this.messageHistory.length - 1]);
    const result = await generateText({
      model: loadModel(this.modelId),
      system: `You are an AI assistant defined by the following XML configuration:\n\n${this.assistantXml}\n\nFollow the workflows and use the provided tools as defined in the XML configuration.`,
      tools: aiTools,
      messages: this.messageHistory,
      maxSteps: 20,
      toolChoice: 'required',
    });

    return result;
  }

  private convertToolToAITool(t: Tool): ReturnType<any> {
    const parameterSchema = z.object(
      Object.fromEntries(
        t.parameters.map(param => [
          param.name,
          this.convertParameterType(param.type).describe(param.description)
        ])
      )
    );

    return tool({
      description: t.description,
      parameters: parameterSchema,
      execute: async (params) => {
        return await t.handler(params);
      },
    });
  }

  private convertParameterType(type: string): z.ZodType {
    switch (type) {
      case 'string':
        return z.string();
      case 'number':
        return z.number();
      case 'boolean':
        return z.boolean();
      case 'array':
        return z.array(z.any());
      case 'object':
        return z.record(z.any());
      default:
        return z.any();
    }
  }
}
