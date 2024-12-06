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
  workflows?: Workflow[] = [];
  excludedTags: string[] = ['model'];
  skills?: Skill[] = [];
  mapping: any= {
    id: "@id",
    workflows: ['workflows.workflow', Workflow],
    skills: ['skills.skill', Skill],
    description: 'description',
    name: 'name'
  }
  constructor(
    public skill: ISkillConstructor,
  ) {
    super(skill);
    this.mount();
  }
};
