import { type XMLBaseConstructor } from './XMLBase';

interface IInputConstructor extends XMLBaseConstructor {
  name: string;
  description: string;
  schema: string;
}

export class Input {
  name: string;
  description: string;
  schema: string;

  constructor(public input: IInputConstructor) {
    this.name = input.name;
    this.description = input.description;
    this.schema = JSON.parse(input.schema);
  }
};
