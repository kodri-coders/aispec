import { XMLBuilder } from 'fast-xml-parser';
import { EventEmitter } from 'node:events';
import { Step } from 'Step';

import { Assistant } from './Assistant';
import { LLMEngine } from './LLMEngine';

export class WorkflowRunner extends EventEmitter {
  assistant: Assistant;
  context: any;
  currentStep = -1;
  finished = false;
  history: any[] = [];
  logs: any[] = [];
  workflow: any;
  constructor(assistant: Assistant, workflow: any) {
    super();
    this.assistant = assistant;
    this.workflow = workflow;
  }

  onFinish() {
    return new Promise((resolve) => {
      if (this.finished) {
        resolve(this.workflow);
        return;
      }
      this.on('workflow-finished', (workflow: any) => {
        console.log('return workflow');
        resolve(workflow);
      });
    });
  }

  setContext(context: any) {
    this.context = { ...this.context, ...context };
  }

  start(input?: any): void {
    this.setContext(input);
    this.next();
  }

  async callLLM(systemPrompt: string, prompt: string, tools: any, model: any): Promise<any> {
    return new LLMEngine(model).generateText({
      prompt,
      systemPrompt,
      tools,
    });
  }

  async generateResponse(prompt: string, push?: string): Promise<any> {
    const step: Step = this.workflow.steps[this.currentStep];
    const model = step?.node.model || this.workflow?.node.model || this.assistant.node.model;
    const responseToolSchema = step?.output?.schema;
    if (!responseToolSchema) {
      throw new Error('Output schema not found');
    }
    const responseTool = {
      description: 'Response Tool',
      parameters: [responseToolSchema],
      execute: async (params: any) => {
        if (push) {
          const contextVar = this.context[push] || [];
          contextVar.push(params);
          this.setContext({
            ...this.context,
            [push]: contextVar,
          });
        }
        else {
          this.setContext(params);
        }
        return true;
      },
    };
    const systemPrompt = this.toXML(this.assistant.node);
    const assistantConfig = {
      name: this.assistant.name,
      skills: this.assistant?.skills?.map((s: any) => s.node['@id']),
    };
    const response = await this.callLLM(systemPrompt, prompt, [responseTool], model);
    this.history.push({ prompt, response, assistantConfig, model });
    this.generateLog({ context: step?.prompt?.variables, prompt, response, assistantConfig, model });
    return response;
  }

  generateLog({ context, prompt, response, assistantConfig, model }: any): any {
    this.logs.push(
      createLog(prompt, context, JSON.stringify(response, null, 2), assistantConfig, model),
    );
  }

  toXML(node: any): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      format: true,
    });
    console.log(JSON.stringify(node));
    return builder.build(node);
  }

  async next(): Promise<void> {
    this.currentStep++;
    if (this.currentStep >= this.workflow.steps.length) {
      this.emit('workflow-finished', this.workflow);
      this.finished = true;
      return;
    }
    const step = this.workflow.steps[this.currentStep];
    if (step.node['@loop']) {
      const loop = this.context[step.node['@loop']];
      const prompts = [];
      const responses = [];
      for (const item of loop) {
        const prompt = step.getPrompt({ ...this.context, [step.node['@as']]: item });
        const data = await this.generateResponse(prompt, step.output.node.schema['@push']);
        prompts.push(prompt);
        responses.push(data);
      }
      this.emit('step-finished', prompts, responses);
    }
    else {
      const prompt = step.getPrompt(this.context);
      const data = await this.generateResponse(prompt);
      this.emit('step-finished', prompt, data);
    }
  }
}
/**
 *
 * @param prompt
 * @param context
 * @param response
 * @param assistantConfig
 * @param model
 */
function createLog(prompt: any, context: any, response: any, assistantConfig: any, model: any): any {
  return `Prompt:
${prompt}
Context:
${JSON.stringify(context, null, 2)}
Response:
${JSON.stringify(response, null, 2)}
Assistant Config:
${JSON.stringify(assistantConfig, null, 2)}
Model:
${JSON.stringify(model, null, 2)}
------------------------------------------


`;
}
