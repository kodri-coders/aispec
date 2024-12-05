import { nullLiteral } from '@babel/types';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import fs from 'fs';
import { EventEmitter } from 'stream';
import { generateText, tool } from 'ai';
import { z } from 'zod';

interface XMLBase {
  "@ref"?: string;
}

interface IAssistantConstructor extends XMLBase {
  '@id'?: string;
  name?: string;
  description?: string;
  skills?: {
    skill: any[];
  };
  workflows?: {
    workflow: any[];
  };
}

interface ISkillConstructor extends XMLBase {
  '@id': string;
  name: string;
  description: string;
  workflows?: {
    workflow: any[];
  };
}

interface IWorkflowConstructor extends XMLBase {
  '@id': string;
  name: string;
  description: string;
  steps: {
    step: {
      name: string;
      description: string;
      input: any;
      prompt: string;
      outputs: any;
    }[];
  };
}

interface IStepConstructor extends XMLBase {
  name: string;
  description: string;
  input: any;
  prompt: string;
  outputs: any;
  $ref?: string;
}

interface IInputConstructor extends XMLBase {
  name: string;
  description: string;
  schema: string;
}

interface IOutputConstructor extends XMLBase {
  name: string;
  description: string;
  schema: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  isArray: (name) => ['skill', 'workflow', 'step'].includes(name)
});
interface BaseNode {
  '@ref'?: string;
  [key: string]: any
}
class XMLBase {
  node?: any
  [key: string]: any; // Allows any string key to access properties of type any

  constructor(
    node: BaseNode,
  ) {

    if(node['@ref']){
      this.node = XMLBase.loadXMLFile(node['@ref']);
      if(Array.isArray(this.node)){
        this.node = this.node[0];
      }
      return
    }
    this.node = node;
  }
  toString(): string {
    // reutrn xml
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      format: true,
    });
    const node: any = {};
    Object.keys(this.node).forEach(key => {
      if (this[key]) {
        node[key] = this.node[key];
      }
    });
    return builder.build(node);
  }
  static loadXML(xml: string): any {
    const parsed = parser.parse(xml);
    // get current constructor class and load xml into it
    const topElement = Object.keys(parsed)[0];
    // instantiate based on the class which extends XMLBase
    //@ts-ignore
    return parsed[topElement]
  }
  static loadXMLFile(xmlPath: string): any {
    const xml = fs.readFileSync(xmlPath, 'utf-8');
    return XMLBase.loadXML(xml);
  }
}

export class Assistant extends XMLBase {
  name?: string;
  description?: string;
  workflows?: Workflow[] = [];
  skills?: Skill[] = [];

  constructor(assistant: IAssistantConstructor | XMLBase) {
    super(assistant);
    this.name = this.node.name;
    this.description = this.node.description;
    this.model = this.node.model;

    this.skills = this.node.skills?.skill.map((skill: any) => {
      return new Skill(skill, this);
    });
    
    this.workflows = this.node.workflows?.workflow.map((workflow: any) => {
      return new Workflow(workflow);
    });

  }
  findWorkflow(workflowId: string):any {
    let targetWorkflow: Workflow | undefined;
    let containingSkill: Skill | undefined;

    // Check global workflows
    targetWorkflow = this.workflows?.find(w => w.workflow['@id'] === workflowId);

    // If not found in global workflows, check skills
    if (!targetWorkflow) {
      this.skills?.forEach(skill => {
        const found = skill.workflows?.find(w => w.workflow['@id'] === workflowId);
        if (found) {
          targetWorkflow = found;
          containingSkill = skill;
        }
      });
    }

    if (!targetWorkflow) {
      throw new Error(`Workflow with id ${workflowId} not found`);
    }
    return {workflow: targetWorkflow, skill: containingSkill}
  }
  loadWorkflow(workflowId: string, input?: any): any {
    // Find the workflow and its containing skill
    const {workflow: targetWorkflow, skill: containingSkill} = this.findWorkflow(workflowId);
    const xmlObj: any = {
    assistant: {
      name: this.name,
      description: this.description,
      skills: {
        skill: []
      }
    }
  };

  // Add global skills
  if (this.skills) {
    xmlObj.assistant.skills.skill = this.skills
      .filter(s => s !== containingSkill)
      .map(s => ({ name: s.name, description: s.description }));
  }
  if(targetWorkflow) {
    xmlObj.assistant.workflows = {
      workflow: [targetWorkflow]
    }
  }
  // Add the skill containing the workflow
  if (containingSkill) {
    xmlObj.assistant.skills.skill.push(containingSkill.node);
  }

    return new WorkflowRunner(new Assistant(xmlObj), targetWorkflow)
  }
}
class WorkflowRunner extends EventEmitter{

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
  onFinish(){
    return new Promise((resolve, reject) => {
      if(this.finished) {
        resolve(this.workflow);
        return
      }
      this.on('workflow-finished', (workflow: any) => {
        console.log('return workflow')
        resolve(workflow);

      });
    });
  }
  setContext(context: any) {
    this.context = { ...this.context, ...context};
  }
  start(input?: any): void {
    this.setContext(input);
    this.next()
  }
  callLLM(systemPrompt: string, prompt: string, tools: any, model: any): any {
    console.log('prompt', prompt)
    console.log('tools', tools)
    console.log('model', model)
  }
  generateResponse(prompt: string): any {
    const step = this.workflow.steps[this.currentStep];
    const model = step.model || this.workflow.model || this.assistant.model;
    const toolSchema = step.output.schema;
    const responseTool = {
      description: step.output.description || step.output.name,
      parameters: [
        toolSchema
      ],
      execute: async (params: any) => {
        this.setContext(params);
        this.emit('step-finished', prompt, params);
        return true;
      },
    };
    const systemPrompt = this.toXML(this.assistant.node)
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
    if(this.currentStep >= this.workflow.steps.length) {
      this.emit('workflow-finished', this.workflow);
      this.finished = true;
      return 
    }
    const step = this.workflow.steps[this.currentStep];
    const prompt = step.getPrompt(this.context);
    const data = this.generateResponse(prompt);
    this.history.push({prompt, data});
    this.setContext(data);
    console.log({context: this.context})
    this.emit('step-finished', prompt, data);
  }



}
class Skill extends XMLBase {
  name: string ;
  description: string;
  workflows?: Workflow[] = [];
  constructor(public skill: ISkillConstructor, private parent?: Assistant) {
    super(skill);
    this.name = this.node.name;
    this.description = this.node.description;
    this.workflows = this.node.workflows?.workflow.map((workflow: any) => {
      return new Workflow(workflow, parent);
    });
    
    this.workflows?.forEach((workflow: any) => {
      this.parent?.workflows?.push(workflow);
    })
  }

}

class Workflow extends XMLBase {
  name: string;
  description: string;
  steps: Step[] = [];
  constructor(public workflow: IWorkflowConstructor, private parent?: Assistant) {
    super(workflow);
    this.name = this.node.name;
    this.description = this.node.description;
    this.steps = this.node.steps.step.map((step: any) => {
      return new Step(step, parent);
    });
  }
  run(input?: any): any {
    return this.steps.map((step: any) => step.runStep(input));
  }

}

class Step extends XMLBase {
  name: string;
  description: string;
  input: Input;
  prompt?: Prompt;
  output: Output;
  constructor(public step: IStepConstructor, private parent?: Assistant) {
    super(step);
    this.name = this.node.name;
    this.description = this.node.description;
    this.input = this.node.input && new Input(this.node.input);
    this.prompt = this.node.prompt && new Prompt(this.node.prompt);
    this.output = this.node.output && new Output(this.node.output);
  }
  getPrompt(input?: any): any {
    return this.prompt?.interpolate(input);
  }
}

class Prompt {
  private prompt: string;
  public variables: string[];
  constructor(prompt: string) {
    this.prompt = prompt;
    this.variables = this.extractVariables(prompt);
  }
  private extractVariables(prompt: string): string[] {
    const variables = prompt.match(/\$\{(.+?)\}/g);
    return variables || [];
  }
  interpolate(data: any): string {
    return this.prompt.replace(/\${(.+?)}/g, (match, key) => {
      let value = '()';
      key.split('.').forEach((keyPart: string) => {
        value = data[keyPart];
      });
      return value;
    });
  }
}

class Input {
  name: string;
  description: string;
  schema: string;
  constructor(public input: IInputConstructor) {
    this.name = input.name;
    this.description = input.description;
    this.schema = JSON.parse(input.schema);
  }
}

class Output {
  name: string;
  description: string;
  schema: string;
  constructor(public output: IOutputConstructor) {
    this.name = output.name;
    this.description = output.description;
    this.schema = JSON.parse(output.schema);
  }
}
