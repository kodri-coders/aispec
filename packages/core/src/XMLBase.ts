import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { readFileSync } from 'fs';

export interface XMLBaseConstructor {
  '@ref'?: string;
}

interface BaseNode {
  '@ref'?: string;
  [key: string]: any;
}

const parser = new XMLParser({
  attributeNamePrefix: '@',
  ignoreAttributes: false,
  isArray: name => ['skill', 'step', 'workflow'].includes(name),
});

export class XMLBase {
  [key: string]: any; // Allows any string key to access properties of type any
  excludedTags: string[] = [];
  node?: any;
  constructor(node: BaseNode) {
    if (node['@ref']) {
      let xml = XMLBase.loadXMLFile(node['@ref']);
      if (Array.isArray(xml)) {
        xml = xml[0];
      }
      if (Object.keys(xml).length === 1) {
        xml = xml[Object.keys(xml)[0]!];
      }
      this.node = xml;
      if (typeof this.node !== 'object') {
        throw new Error('Invalid XML');
      }
      return;
    }
    if (typeof node !== 'object') {
      throw new Error('Invalid XML');
    }
    if (node['@ref']) {
      node = XMLBase.loadXMLFile(node['@ref']);
    }
    this.node = this.resolveRefs(node);
  }

  static loadXML(xml: string): any {
    const parsed = parser.parse(xml);
    // get current constructor class and load xml into it
    const topElement = Object.keys(parsed)[0];
    // instantiate based on the class which extends XMLBase
    // @ts-expect-error topElement is definitely a string, but TS doesn't know that
    return parsed[topElement];
  }

  static loadXMLFile(xmlPath: string): any {
    const xml = readFileSync(xmlPath, 'utf-8');
    const result = XMLBase.loadXML(xml);
    if (Array.isArray(result)) {
      return result[0];
    }
    return result;
  }

  getNestedValue(v: string, obj: any) {
    const keys = v.split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined) {
        return undefined;
      }
      current = current[key];
    }
    return current;
  }

  mount() {
    const node = this.node;
    for (const key in this.mapping) {
      if (Object.prototype.hasOwnProperty.call(this.mapping, key)) {
        const value = this.mapping[key] || key;
        if (typeof value === 'string') {
          this[key] = this.getNestedValue(value, node);
        }
        else if (Array.isArray(value)) {
          const objValue = this.getNestedValue(value[0], node);
          if (objValue === undefined) continue;
          if (Array.isArray(objValue)) {
            this[key] = objValue.map((item: any) => new value[1](item));
          }
          else {
            this[key] = new value[1](objValue);
          }
        }
      }
    }
  }

  resolveRefs(node: BaseNode): any {
    // recursively resolve refs
    // check for any kind of object or array
    if (Array.isArray(node)) {
      return node.map((item: any) => this.resolveRefs(item));
    }
    else if (typeof node === 'object') {
      const newNode: any = {};
      if (node['@ref']) {
        node = this.resolveRefs(XMLBase.loadXMLFile(node['@ref']));
      }
      Object.keys(node).forEach((key: any) => {
        if (node[key]?.['@ref']) {
          newNode[key] = this.resolveRefs(XMLBase.loadXMLFile(node[key]['@ref']));
        }
        else {
          newNode[key] = this.resolveRefs(node[key]);
        }
      });
      return newNode;
    }
    return node;
  }

  setNestedValue(v: string, obj: any, value: any) {
    const keys = v.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      // @ts-expect-error key is a string, but TS doesn't know that
      current = current[keys[i]];
    }
    // @ts-expect-error key is a string, but TS doesn't know that
    current[keys[keys.length - 1]] = value;
  }

  toString(): string {
    // reutrn xml
    const builder = new XMLBuilder({
      attributeNamePrefix: '@',
      format: true,
      ignoreAttributes: false,
    });
    const node: any = {};

    Object.keys(this.node).forEach((key) => {
      console.log(key);
      if (this.excludedTags.includes(key)) {
        return;
      }
      if (this.node[key]) {
        node[key] = this.node[key];
      }
    });
    return builder.build(node);
  }
};
