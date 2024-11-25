import { XMLParser } from 'fast-xml-parser';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from '@aispec/lib/types/tool';

export class Skill {
  private id: string = '';
  private name: string = '';
  private description: string = '';
  private dependencies: Map<string, Skill>;
  private workflows: Map<string, any>;

  constructor() {
    this.dependencies = new Map();
    this.workflows = new Map();
  }

  public static async loadSkillWithXml(skillPath: string): Promise<[Skill, string]> {
    const resolvedPath = path.resolve(process.cwd(), skillPath);
    let xmlContent = await fs.readFile(resolvedPath, 'utf-8');
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xmlContent);
    const skill = new Skill();

    skill.id = parsed.skill['@_id'];
    skill.name = parsed.skill.name;
    skill.description = parsed.skill.description;

    // Load dependencies
    if (parsed.skill.dependencies) {
      if (!Array.isArray(parsed.skill.dependencies.skill)) {
        parsed.skill.dependencies.skill = [parsed.skill.dependencies.skill];
      }
      for (const depRef of parsed.skill.dependencies.skill) {
        const [dep, depXml] = await Skill.loadSkillWithXml(depRef['@_ref']);
        skill.addDependency(dep);
        xmlContent = `${xmlContent}\n\n<!-- Dependency: ${dep.getId()} -->\n${depXml}`;
      }
    }

    // Load workflows
    if (parsed.skill.workflows) {
      if (!Array.isArray(parsed.skill.workflows.workflow)) {
        parsed.skill.workflows.workflow = [parsed.skill.workflows.workflow];
      }
      for (const workflow of parsed.skill.workflows.workflow) {
        skill.addWorkflow(workflow['@_id'], workflow);
      }
    }

    return [skill, xmlContent];
  }

  public static async loadSkill(skillPath: string): Promise<Skill> {
    const [skill] = await Skill.loadSkillWithXml(skillPath);
    return skill;
  }

  public addDependency(skill: Skill): void {
    this.dependencies.set(skill.getId(), skill);
  }

  public addWorkflow(id: string, workflow: any): void {
    this.workflows.set(id, workflow);
  }

  public getWorkflow(workflowId: string): any {
    if (this.workflows.has(workflowId)) {
      return this.workflows.get(workflowId);
    }

    // Check dependencies
    for (const dep of this.dependencies.values()) {
      const workflow = dep.getWorkflow(workflowId);
      if (workflow) {
        return workflow;
      }
    }

    return null;
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

  public getDependencies(): Map<string, Skill> {
    return this.dependencies;
  }
}
