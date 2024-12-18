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
  node: IOutputConstructor;

  constructor(public output: IOutputConstructor) {
    this.name = output.name;
    this.description = output.description;
    this.node = output;
    try {
      if (typeof output.schema === 'object') {
        this.schema = JSON.parse(output.schema['#text']);
      }
      else {
        this.schema = JSON.parse(output.schema);
      }
    }
    catch (error) {
      console.error(error);
      throw new Error('Invalid output schema');
    }
  }
};
