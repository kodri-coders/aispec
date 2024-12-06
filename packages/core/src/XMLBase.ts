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
  excludedTags: string[] = [];
  constructor(node: BaseNode) {
   if (node['@ref']) {
      let xml = XMLBase.loadXMLFile(node['@ref']);
      if(Array.isArray(xml)) {
        xml = xml[0];
      }
      if(Object.keys(xml).length === 1) {
        xml = xml[Object.keys(xml)[0]];
      }
      this.node = xml;
      if(typeof this.node !== 'object') {
        throw new Error('Invalid XML');
      }
      return;
    }
    if(typeof node !== 'object') {
      throw new Error('Invalid XML');
    }
    if(node['@ref']) {
      node = XMLBase.loadXMLFile(node['@ref']);
    }
    this.node = this.resolveRefs(node);
    
  
  }
  resolveRefs(node: BaseNode): any {
    // recursively resolve refs
    // check for any kind of object or array
    if(Array.isArray(node)) {
      return node.map((item: any) => this.resolveRefs(item));
    } else if(typeof node === 'object') {
      const newNode: any = {};
      if(node['@ref']) {
        node = this.resolveRefs(XMLBase.loadXMLFile(node['@ref']));
      }
      Object.keys(node).forEach((key: any) => {
        if(node[key]?.['@ref']) {
          newNode[key] = this.resolveRefs(XMLBase.loadXMLFile(node[key]['@ref']));
        } else {
          newNode[key] = this.resolveRefs(node[key]);
        }
      });
      return newNode;
    }
    return node;
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
  setNestedValue(v: string, obj: any, value: any) {
    const keys = v.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
  }
  
  mount() {
    const node = this.node;
    for (const key in this.mapping) {
      if (this.mapping.hasOwnProperty(key)) {
        const value = this.mapping[key] || key;
        if (typeof value === 'string') {
          this[key] = this.getNestedValue(value, node);
        } else if (Array.isArray(value)) {
          const objValue = this.getNestedValue(value[0], node);
          if (objValue === undefined) continue;
          if (Array.isArray(objValue)) {
            this[key] = objValue.map((item: any) => new value[1](item));
          } else {
            this[key] = new value[1](objValue);
          }
        }
      }
    }
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
      if(this.excludedTags.includes(key)) {
        return;
      }
      if (this.node[key]) {
        node[key] = this.node[key];
      }
    });
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
    const result = XMLBase.loadXML(xml);
    if(Array.isArray(result)) {
      return result[0];
    }
    return result;
  }
};
