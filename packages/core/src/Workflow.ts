import { Assistant } from './Assistant';
import { Step } from './Step';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface IWorkflowConstructor extends XMLBaseConstructor {
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

export class Workflow extends XMLBase {
  name: string='';
  description: string='';
  steps: Step[] = [];
  excludedTags: string[] = ['model'];
  mapping: any= {
    id: "@id",
    name: 'name',
    description: 'description',
    steps: ['steps.step', Step],
    model: 'model'
  }
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
