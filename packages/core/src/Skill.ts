import { Workflow } from './Workflow';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface ISkillConstructor extends XMLBaseConstructor {
  '@id': string;
  'description': string;
  'name': string;
  'workflows'?: {
    workflow: any[];
  };
}

export class Skill extends XMLBase {
  override excludedTags: string[] = ['model'];
  mapping: any = {
    description: 'description',
    id: '@id',
    name: 'name',
    skills: ['skills.skill', Skill],
    workflows: ['workflows.workflow', Workflow],
  };

  skills?: Skill[] = [];
  workflows?: Workflow[] = [];

  constructor(
    public skill: ISkillConstructor,
  ) {
    super(skill);
    this.mount();
  }
};
