import { Input } from './Input';
import { Output } from './Output';
import { Prompt } from './Prompt';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';

interface IStepConstructor extends XMLBaseConstructor {
  $ref?: string;
  description: string;
  input: any;
  name: string;
  outputs: any;
  prompt: string;
}

// interface StepInterface {
//   name: string;
//   description: string;
//   output: Output;
//   prompt: Prompt;
//   excludedTags: string[];
// }

export class Step extends XMLBase {
  description?: string = '';
  override excludedTags: string[] = ['model'];
  mapping: any = {
    description: 'description',
    id: '@id',
    input: ['input', Input],
    model: 'model',
    name: 'name',
    output: ['output', Output],
    prompt: ['prompt', Prompt],
  };

  name?: string;
  output?: Output;
  prompt?: Prompt;

  constructor(
    public step: IStepConstructor,
  ) {
    super(step);
    this.mount();
  }

  getPrompt(input?: any): any {
    return this.prompt?.interpolate(input);
  }
};
