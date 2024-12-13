import { type XMLBaseConstructor } from './XMLBase';

interface IOutputConstructor extends XMLBaseConstructor {
  description: string;
  name: string;
  schema: string;
}

export class Output {
  description: string;
  name: string;
  schema: string;

  constructor(public output: IOutputConstructor) {
    this.name = output.name;
    this.description = output.description;
    this.schema = JSON.parse(output.schema);
  }
};
