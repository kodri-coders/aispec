import { Skill } from './Skill';
import { Workflow } from './Workflow';
import { WorkflowRunner } from './WorkflowRunner';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface IAssistantConstructor extends XMLBaseConstructor {
  '@id'?: string;
  'description'?: string;
  'model'?: any;
  'name'?: string;
  'skills'?: {
    skill: any[];
  };
  'workflows'?: {
    workflow: any[];
  };
}

export class Assistant extends XMLBase {
  description?: string;
  override excludedTags: string[] = ['model'];
  mapping: any = {
    description: 'description',
    id: '@id',
    model: 'model',
    name: 'name',
    skills: ['skills.skill', Skill],
    workflows: ['workflows.workflow', Workflow],
  };

  model?: any;
  name?: string;
  skills?: Skill[] = [];
  workflows?: Workflow[] = [];

  constructor(assistant: IAssistantConstructor | XMLBase) {
    super(assistant);
    this.mount();
  }

  findWorkflow(workflowId: string): any {
    let targetWorkflow: undefined | Workflow;
    let containingSkill: Skill | undefined;

    // Check global workflows
    targetWorkflow = this.workflows?.find(
      w => w.workflow['@id'] === workflowId,
    );

    // If not found in global workflows, check skills
    if (!targetWorkflow) {
      this.skills?.forEach((skill) => {
        const found = skill.workflows?.find(
          w => w.workflow['@id'] === workflowId,
        );
        if (found) {
          targetWorkflow = found;
          containingSkill = skill;
        }
      });
    }

    if (!targetWorkflow) {
      throw new Error(`Workflow with id ${workflowId} not found`);
    }
    return { skill: containingSkill, workflow: targetWorkflow };
  }

  loadWorkflow(workflowId: string): any {
    // Find the workflow and its containing skill
    const { skill: containingSkill, workflow: targetWorkflow } = this
      .findWorkflow(workflowId);
    const xmlObj: any = {
      assistant: {
        description: this.description,
        model: this.model,
        name: this.name,
        skills: {
          skill: [],
        },
      },
    };
    // Add global skills
    if (this.skills) {
      xmlObj.assistant.skills.skill = this.skills
        .filter(s => s !== containingSkill)
        .map(s => ({ ...s.node, workflows: undefined }));
    }
    if (targetWorkflow && !containingSkill) {
      xmlObj.assistant.workflows = {
        workflow: [targetWorkflow],
      };
    }
    // Add the skill containing the workflow
    if (containingSkill) {
      xmlObj.assistant.skills.skill.push(containingSkill.node);
    }

    return new WorkflowRunner(new Assistant(xmlObj.assistant), targetWorkflow);
  }
}
