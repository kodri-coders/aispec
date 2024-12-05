import { Assistant } from './Assistant';
import { Workflow } from './Workflow';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface ISkillConstructor extends XMLBaseConstructor {
  '@id': string;
  name: string;
  description: string;
  workflows?: {
    workflow: any[];
  };
}

export class Skill extends XMLBase {
  name: string;
  description: string;
  workflows?: Workflow[] = [];

  constructor(
    public skill: ISkillConstructor,
    private parent?: Assistant,
  ) {
    super(skill);
    this.name = this.node.name;
    this.description = this.node.description;
    this.workflows = this.node.workflows?.workflow.map((workflow: any) => {
      return new Workflow(workflow, parent);
    });

    this.workflows?.forEach((workflow: any) => {
      this.parent?.workflows?.push(workflow);
    });
  }
};
