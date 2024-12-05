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
  name: string;
  description: string;
  steps: Step[] = [];

  constructor(
    public workflow: IWorkflowConstructor,
    private parent?: Assistant,
  ) {
    super(workflow);
    this.name = this.node.name;
    this.description = this.node.description;
    this.steps = this.node.steps.step.map((step: any) => {
      return new Step(step, parent);
    });
  }

  run(input?: any): any {
    return this.steps.map((step: any) => step.runStep(input));
  }
};
