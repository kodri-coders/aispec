export class Prompt {
  private prompt: string;
  public variables: string[];

  constructor(prompt: string) {
    this.prompt = prompt;
    this.variables = this.extractVariables(prompt);
  }

  private extractVariables(prompt: string): string[] {
    const variables = prompt.match(/\$\{(.+?)\}/g);
    return variables || [];
  }

  interpolate(data: any): string {
    return this.prompt.replace(/\${(.+?)}/g, (match, key) => {
      let value = '()';
      key.split('.').forEach((keyPart: string) => {
        value = data[keyPart];
      });
      return value;
    });
  }
};
