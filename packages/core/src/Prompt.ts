export class Prompt {
  public variables: string[];
  private prompt: string;

  constructor(prompt: string) {
    this.prompt = prompt;
    this.variables = this.extractVariables(prompt);
  }

  extractVariables(prompt?: string): string[] {
    const variables = (prompt || this.prompt).match(/\$\{(.+?)\}/g);
    return (variables || []).map(variable => variable.replace(/\${|}/g, ''));
  }

  interpolate(data: any): string {
    return this.prompt.replace(/\${(.+?)}/g, (_, key) => {
      let value = '()';
      key.split('.').forEach((keyPart: string) => {
        value = data[keyPart];
      });
      return value;
    });
  }
};
