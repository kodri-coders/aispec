import { generateText } from 'ai';
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

  async generateText({
    prompt,
    systemPrompt,
  }: {
    prompt: string;
    systemPrompt: string;
  }): Promise<string> {
    const response = await generateText(
      this.prepareRequest({
        model: this.model,
        prompt,
        systemPrompt,
        tools: [],
      }));
    return response.text;
  }

  modelFactory(model: Model): LLMEngine {
    return new LLMEngine(model);
  }

  prepareRequest({
    model,
    prompt,
    systemPrompt,
    tools,
  }: {
    model: any;
    prompt: string;
    systemPrompt: string;
    tools: any;
  }): any {
    switch (model.name) {
      case 'gpt-3.5':
      case 'gpt-4':
      case 'gpt-4o':
        return {
          maxTokens: model.max_tokens,
          model: model.name,
          prompt,
          system: systemPrompt,
          temperature: model.temperature,
          tools,
        };
      case 'o1-mini':
      case 'o1-preview':
        return {
          messages: [
            {
              content: systemPrompt,
              role: 'user',
            },
            {
              content: prompt,
              role: 'user',
            },
          ],
          model: model.name,
          tools,
        };
      default:
        throw new Error('Model not supported');
    }
  }
}
