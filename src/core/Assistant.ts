import { XMLParser } from 'fast-xml-parser';
import { Tool } from '@aispec/lib/types/tool';
import { Skill } from './Skill';
import { WorkflowEngine } from './WorkflowEngine';

export class Assistant {
  private id: string = '';
  private name: string = '';
  private description: string = '';
  private skills: Map<string, Skill>;
  private tools: Map<string, Tool>;
  private workflowEngine: WorkflowEngine;
  private skillXmls: Map<string, string> = new Map();

  constructor() {
    this.skills = new Map();
    this.tools = new Map();
    this.workflowEngine = new WorkflowEngine();
  }

  public static async fromXML(xmlContent: string): Promise<Assistant> {
    const parser = new XMLParser({ 
      ignoreAttributes: false,
      parseTagValue: false,
      parseAttributeValue: false,
      trimValues: true
    });
    const parsed = parser.parse(xmlContent);
    const assistant = new Assistant();

    assistant.id = parsed.assistant['@_id'];
    assistant.name = parsed.assistant.name;
    assistant.description = parsed.assistant.description;

    // Load skills and collect their XML
    if (parsed.assistant.skills) {
      if(!Array.isArray(parsed.assistant.skills.skill)){
        parsed.assistant.skills.skill = [parsed.assistant.skills.skill];
      }
      for (const skillRef of parsed.assistant.skills.skill) {
        const [skill, skillXml] = await Skill.loadSkillWithXml(skillRef['@_ref']);
        assistant.addSkill(skill);
        assistant.skillXmls.set(skill.getId(), skillXml);
      }
    }

    // Construct the full XML configuration with assistant and skills
    const fullXml = `${xmlContent}\n\n<!-- Referenced Skills -->\n${Array.from(assistant.skillXmls.values()).join('\n\n')}`;
    assistant.workflowEngine.setAssistantXml(fullXml);

    // Load workflows
    if (parsed.assistant.workflows) {
      if(!Array.isArray(parsed.assistant.workflows.workflow)){
        parsed.assistant.workflows.workflow = [parsed.assistant.workflows.workflow];
      }
      for (const workflow of parsed.assistant.workflows.workflow) {
        assistant.workflowEngine.addWorkflow(workflow['@_id'], workflow);
      }
    }

    return assistant;
  }

  public addSkill(skill: Skill): void {
    this.skills.set(skill.getId(), skill);
  }

  public addTool(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  public async executeWorkflow(workflowId: string, input: any): Promise<any> {
    // First check if any skill has this workflow
    for (const skill of this.skills.values()) {
      const workflow = skill.getWorkflow(workflowId);
      if (workflow) {
        this.workflowEngine.addWorkflow(workflowId, workflow);
        break;
      }
    }

    const context = {
      skills: this.skills,
      tools: this.tools,
      input,
    };

    return this.workflowEngine.execute(workflowId, context);
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }
}
