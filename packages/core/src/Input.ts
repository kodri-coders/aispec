import { type XMLBaseConstructor } from './XMLBase';

interface IInputConstructor extends XMLBaseConstructor {
  description: string;
  name: string;
  schema: string;
}

export class Input {
  description: string;
  name: string;
  schema: string;

  constructor(public input: IInputConstructor) {
    this.name = input.name;
    this.description = input.description;
    this.schema = JSON.parse(input.schema);
  }
};
