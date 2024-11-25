import { Tool } from '@aispec/lib/types/tool';
import { Skill } from './Skill';
import { PromptEngine, Message } from './PromptEngine';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface WorkflowContext {
  skills: Map<string, Skill>;
  tools: Map<string, Tool>;
  input?: any;
}

export class WorkflowEngine {
  private workflows: Map<string, any>;
  private promptEngine: PromptEngine;

  constructor(modelId?: string) {
    this.workflows = new Map();
    this.promptEngine = new PromptEngine(modelId || process.env.AI_MODEL);
  }

  public addWorkflow(id: string, workflow: any): void {
    this.workflows.set(id, workflow);
  }

  public setAssistantXml(xml: string): void {
    this.promptEngine.setAssistantXml(xml);
  }

  public async execute(workflowId: string, context: WorkflowContext): Promise<any[]> {
    const { skills, tools, input } = context;
    let result: any = input;
    const stepResults: any[] = [];

    // Find the workflow
    const targetWorkflow = this.workflows.get(workflowId);
    if (!targetWorkflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Execute each step in sequence
    if (!Array.isArray(targetWorkflow.steps.step)) {
      targetWorkflow.steps.step = [targetWorkflow.steps.step];
    }
    
    for (const step of targetWorkflow.steps.step) {
      // Prepare step context
      const stepContext = {
        input: result,
        tools: new Map<string, Tool>(),
        skills: new Map<string, Skill>(),
      };

      // Load step-specific tools
      if (step.tools) {
        if (!Array.isArray(step.tools.tool)) {
          step.tools.tool = [step.tools.tool];
        }
        for (const toolRef of step.tools.tool) {
          const tool = tools.get(toolRef['@_ref']);
          console.log(`Tool used ${toolRef['@_ref']}`)
          console.log(tools.entries())
          if (tool) {
            console.log(`Tool added ${tool.id}`)
            stepContext.tools.set(tool.id, tool);
          }else{
            throw new Error(`Tool ${toolRef['@_ref']} not found`)
          }
        }
      }

      // Load step-specific skills
      if (step.skills) {
        if (!Array.isArray(step.skills.skill)) {
          step.skills.skill = [step.skills.skill];
        }
        for (const skillRef of step.skills.skill) {
          const skill = skills.get(skillRef['@_ref']);
          if (skill) {
            stepContext.skills.set(skill.getId(), skill);
          }
        }
      }
      console.log(stepContext)
      // Execute step
      result = await this.executeStep(step, stepContext);
      stepResults.push(result);
    }

    return stepResults;
  }

  private async executeStep(step: any, context: { input: any; tools: Map<string, Tool>; skills: Map<string, Skill> }): Promise<any> {
    const { input, tools } = context;
    
    // Process the prompt with input variables
    const processedPrompt = this.processPrompt(step.prompt, input);

    // Add the prompt to the message history
    this.promptEngine.addMessage({
      role: 'user',
      content: processedPrompt,
    });

    // Generate response using the prompt engine
    const response = await this.promptEngine.generateResponse(tools);

    return {
      stepId: step['@_id'],
      input,
      response,
    };
  }

  private processPrompt(prompt: string, variables: any): string {
    return prompt.replace(/\${(.*?)}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
