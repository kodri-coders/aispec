import { Input } from './Input';
import { Prompt } from './Prompt';
import { XMLBase, type XMLBaseConstructor } from './XMLBase';
import { Assistant } from './Assistant';
import { Output } from './Output';

interface IStepConstructor extends XMLBaseConstructor {
  name: string;
  description: string;
  input: any;
  prompt: string;
  outputs: any;
  $ref?: string;
}

interface StepInterface {
  name: string;
  description: string;
  output: Output;
  prompt: Prompt;
  excludedTags: string[];
} 
export class Step extends XMLBase {
  name?: string;
  description?: string = '';
  output?: Output;
  prompt?: Prompt;
  excludedTags: string[] = ['model'];
  mapping: any= {
    id: "@id",
    name: 'name',
    description: 'description',
    input: ['input', Input],
    prompt: ['prompt', Prompt],
    output: ['output', Output],
    model: 'model'
  }
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
