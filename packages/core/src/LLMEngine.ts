import { generateText, tool } from 'ai';
interface Model {
  name: string;
  temperature: number;
  max_tokens: number;
}
export class LLMEngine {
  model: Model;
  constructor(model: Model){
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
          tools,
          model: model.name,
          temperature: model.temperature,
          maxTokens: model.max_tokens,
        };
      case 'o1-mini':
      case 'o1-preview':
        return {
          messages: [
            {
              role: 'user',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          tools,
          model: model.name,
        };
      default:
        throw new Error('Model not supported');
    }
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
        systemPrompt,
        prompt,
        tools: [],
        model: this.model,
      }));
    return response.text;
  }
}