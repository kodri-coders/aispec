import { Skill } from './Skill';
import { Workflow } from './Workflow';
import { WorkflowRunner } from './WorkflowRunner';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface IAssistantConstructor extends XMLBaseConstructor {
  '@id'?: string;
  name?: string;
  description?: string;
  model?: any;
  skills?: {
    skill: any[];
  };
  workflows?: {
    workflow: any[];
  };
}

export class Assistant extends XMLBase {
  name?: string;
  description?: string;
  workflows?: Workflow[] = [];
  skills?: Skill[] = [];
  model?: any;
  excludedTags: string[] = ['model'];
  mapping: any= {
    id: "@id",
    skills: ['skills.skill', Skill],
    workflows:  ['workflows.workflow', Workflow],
    model: 'model',
    description: 'description',
    name: 'name'
  }
  constructor(assistant: IAssistantConstructor | XMLBase) {
    super(assistant);
    this.mount();
  }

  findWorkflow(workflowId: string): any {
    let targetWorkflow: Workflow | undefined;
    let containingSkill: Skill | undefined;

    // Check global workflows
    targetWorkflow = this.workflows?.find(
      (w) => w.workflow['@id'] === workflowId,
    );

    // If not found in global workflows, check skills
    if (!targetWorkflow) {
      this.skills?.forEach((skill) => {
        const found = skill.workflows?.find(
          (w) => w.workflow['@id'] === workflowId,
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
    return { workflow: targetWorkflow, skill: containingSkill };
  }

  loadWorkflow(workflowId: string, input?: any): any {
    // Find the workflow and its containing skill
    const { workflow: targetWorkflow, skill: containingSkill } =
      this.findWorkflow(workflowId);
    const xmlObj: any = {
      assistant: {
        name: this.name,
        description: this.description,
        model: this.model,
        skills: {
          skill: [],
        },
      },
    };
    // Add global skills
    if (this.skills) {
      xmlObj.assistant.skills.skill = this.skills
        .filter((s) => s !== containingSkill)
        .map((s) => ({ ...s.node, workflows: undefined }));
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
