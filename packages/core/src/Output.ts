import { type XMLBaseConstructor } from './XMLBase';

interface IOutputConstructor extends XMLBaseConstructor {
  name: string;
  description: string;
  schema: string;
}

export class Output {
  name: string;
  description: string;
  schema: string;

  constructor(public output: IOutputConstructor) {
    this.name = output.name;
    this.description = output.description;
    this.schema = JSON.parse(output.schema);
  }
};
