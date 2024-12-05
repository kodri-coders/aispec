import { EventEmitter } from 'stream';
import { Assistant } from './Assistant';
import { XMLBuilder } from 'fast-xml-parser';

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
  }

  generateResponse(prompt: string): any {
    const step = this.workflow.steps[this.currentStep];
    const model = step.model || this.workflow.model || this.assistant.model;
    const toolSchema = step.output.schema;
    const responseTool = {
      description: step.output.description || step.output.name,
      parameters: [toolSchema],
      execute: async (params: any) => {
        this.setContext(params);
        this.emit('step-finished', prompt, params);
        return true;
      },
    };
    const systemPrompt = this.toXML(this.assistant.node);
    this.callLLM(systemPrompt, prompt, [responseTool], model);
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
    this.history.push({ prompt, data });
    this.setContext(data);
    console.log({ context: this.context });
    this.emit('step-finished', prompt, data);
  }
}
