import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';

interface BaseNode {
  '@ref'?: string;
  [key: string]: any;
}

export interface XMLBaseConstructor {
  '@ref'?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@',
  isArray: (name) => ['skill', 'workflow', 'step'].includes(name),
});

export class XMLBase {
  node?: any;
  [key: string]: any; // Allows any string key to access properties of type any

  constructor(node: BaseNode) {
    if (node['@ref']) {
      this.node = XMLBase.loadXMLFile(node['@ref']);
      if (Array.isArray(this.node)) {
        this.node = this.node[0];
      }
      return;
    }
    this.node = node;
  }

  toString(): string {
    // reutrn xml
    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      format: true,
    });
    const node: any = {};
    Object.keys(this.node).forEach((key) => {
      console.log(key);
      if (this[key]) {
        node[key] = this.node[key];
      }
    });
    console.log({node})
    return builder.build(node);
  }

  static loadXML(xml: string): any {
    const parsed = parser.parse(xml);
    // get current constructor class and load xml into it
    const topElement = Object.keys(parsed)[0];
    // instantiate based on the class which extends XMLBase
    //@ts-ignore
    return parsed[topElement];
  }

  static loadXMLFile(xmlPath: string): any {
    const xml = readFileSync(xmlPath, 'utf-8');
    return XMLBase.loadXML(xml);
  }
};
