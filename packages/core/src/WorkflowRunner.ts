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
    console.log('prompt', prompt);
    console.log('tools', tools);
    console.log('model', model);
    return new LLMEngine(model).generateText({
      prompt,
      systemPrompt,
    });
  }

  async generateResponse(prompt: string): Promise<any> {
    const step: Step = this.workflow.steps[this.currentStep];
    const model = step?.node.model || this.workflow?.node.model || this.assistant.node.model;
    const responseToolSchema = step?.output?.schema;
    if(!responseToolSchema) {
      throw new Error('Output schema not found');
    }
    const responseTool = {
      description: 'Response Tool',
      parameters: [responseToolSchema],
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
    const response = await this.callLLM(systemPrompt, prompt, [responseTool], model);
    this.history.push({ prompt, response, assistantConfig, model });
    this.generateLog({ context: step?.prompt?.variables, prompt, response, assistantConfig, model });
    return response;
  }

  generateLog({ context, prompt, response, assistantConfig, model }: any): any {
    this.logs.push(
      createLog(prompt, context, response, assistantConfig, model)
    )
  }
  toXML(node: any): string {
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      format: true,
    });
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
    if(step.node['@loop']){

      const loop = this.context[step.node['@loop']];
      const prompts = [];
      const responses = [];
      for (const item of loop) {
        const prompt = step.getPrompt({...this.context, [step.node['@as']]: item});
        const data = await this.generateResponse(prompt);
         prompts.push(prompt);
         responses.push(data);
        if(step.output.node.schema['@push']) {
          const contextVar = this.context[step.output.node.schema['@push']] || [];
          contextVar.push(data);
          this.setContext({
            ...this.context,
            [step.output.node.schema['@push']]: contextVar,
          });
        }
      }
      this.emit('step-finished', prompts, responses);
      
    }else{
      const prompt = step.getPrompt(this.context);
      const data = await this.generateResponse(prompt);
      this.setContext(data);
      this.emit('step-finished', prompt, data);
    }
  }
}
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

