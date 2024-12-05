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

export class Step extends XMLBase {
  name: string;
  description: string;
  input: Input;
  output: Output;
  prompt?: Prompt;

  constructor(
    public step: IStepConstructor,
    private parent?: Assistant,
  ) {
    super(step);
    this.name = this.node.name;
    this.description = this.node.description;
    this.input = this.node.input && new Input(this.node.input);
    this.prompt = this.node.prompt && new Prompt(this.node.prompt);
    this.output = this.node.output && new Output(this.node.output);
  }

  getPrompt(input?: any): any {
    return this.prompt?.interpolate(input);
  }
};
