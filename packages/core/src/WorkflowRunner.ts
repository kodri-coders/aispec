import { EventEmitter } from 'stream';
import { Assistant } from './Assistant';
import { XMLBuilder } from 'fast-xml-parser';
import { LLMEngine } from './LLMEngine';

export class WorkflowRunner extends EventEmitter {
  currentStep: number = -1;
  workflow: any;
  finished: boolean = false;
  context: any;
  history: any[] = [];
  assistant: Assistant;

  constructor(assistant: Assistant, workflow: any) {
    super();
    this.assistant = assistant;
    this.workflow = workflow;
  }

  onFinish() {
    return new Promise((resolve, reject) => {
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

  callLLM(systemPrompt: string, prompt: string, tools: any, model: any): any {
    console.log('prompt', prompt);
    console.log('tools', tools);
    console.log('model', model);
    return new LLMEngine(model).generateText({
      prompt,
      systemPrompt,
    });
  }

  generateResponse(prompt: string): any {
    const step = this.workflow.steps[this.currentStep];
    const model = step.node.model || this.workflow.node.model || this.assistant.node.model;
    const toolSchema = step.output.schema;
    const responseTool = {
      description: 'Response Tool',
      parameters: [toolSchema],
      execute: async (params: any) => {
        this.setContext(params);
        this.emit('step-finished', prompt, params);
        return true;
      },
    };
    const systemPrompt = this.toXML(this.assistant.node);
    const assistantConfig = {
      name: this.assistant.name,
      skills: this.assistant?.skills?.map((s: any) => s.node['@id']),
    }
    const response = this.callLLM(systemPrompt, prompt, [responseTool], model);
    this.history.push({ prompt, response, assistantConfig, model });
    return response;
  }

  toXML(node: any): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      format: true,
    });
    return builder.build(node);
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
}
