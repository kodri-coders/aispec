import { Step } from './Step';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface IWorkflowConstructor extends XMLBaseConstructor {
  '@id': string;
  'description': string;
  'name': string;
  'steps': {
    step: {
      description: string;
      input: any;
      name: string;
      outputs: any;
      prompt: string;
    }[];
  };
}

export class Workflow extends XMLBase {
  description = '';
  override excludedTags: string[] = ['model'];
  mapping: any = {
    description: 'description',
    id: '@id',
    model: 'model',
    name: 'name',
    steps: ['steps.step', Step],
  };

  name = '';
  steps: Step[] = [];

  constructor(
    public workflow: IWorkflowConstructor,
  ) {
    super(workflow);
    this.mount();
  }

  run(input?: any): any {
    return this.steps.map((step: any) => step.runStep(input));
  }
};
