import { XMLBuilder } from 'fast-xml-parser';
import { Step } from 'Step';
import { EventEmitter } from 'stream';

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

  callLLM(systemPrompt: string, prompt: string, tools: any, model: any): any {
    console.log('prompt', prompt);
    console.log('tools', tools);
    console.log('model', model);
    return new LLMEngine(model).generateText({
      prompt,
      systemPrompt,
    });
  }

  generateLog({ assistantConfig, context, model, prompt, response }: any): any {
    this.logs.push(
      `Prompt:
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


`,
    );
  }

  generateResponse(prompt: string): any {
    const step: Step = this.workflow.steps[this.currentStep];
    const model = step?.node.model || this.workflow?.node.model || this.assistant.node.model;
    const responseToolSchema = step?.output?.schema;
    if (!responseToolSchema) {
      throw new Error('Output schema not found');
    }
    const responseTool = {
      description: 'Response Tool',
      execute: async (params: any) => {
        this.setContext(params);
        this.emit('step-finished', prompt, params);
        return true;
      },
      parameters: [responseToolSchema],
    };
    const systemPrompt = this.toXML(this.assistant.node);
    const assistantConfig = {
      name: this.assistant.name,
      skills: this.assistant?.skills?.map((s: any) => s.node['@id']),
    };
    const response = this.callLLM(systemPrompt, prompt, [responseTool], model);
    this.history.push({ assistantConfig, model, prompt, response });
    this.generateLog({ assistantConfig, context: step?.prompt?.variables, model, prompt, response });
    return response;
  }

  next(): void {
    this.currentStep++;
    if (this.currentStep >= this.workflow.steps.length) {
      this.emit('workflow-finished', this.workflow);
      this.finished = true;
      return;
    }
    const step = this.workflow.steps[this.currentStep];
    const prompt = step.getPrompt(this.context);
    const data = this.generateResponse(prompt);
    this.setContext(data);
    this.emit('step-finished', prompt, data);
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

  toXML(node: any): string {
    const builder = new XMLBuilder({
      attributeNamePrefix: '@',
      format: true,
      ignoreAttributes: false,
    });
    return builder.build(node);
  }
}
