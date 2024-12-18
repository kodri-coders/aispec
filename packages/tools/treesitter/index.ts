import { Tool } from '@aispec/tool-types';
import { readFile } from 'fs/promises';
import { glob } from 'glob';
import { extname } from 'path';
import Parser from 'tree-sitter';
import CPP from 'tree-sitter-cpp';
import Go from 'tree-sitter-go';
import Java from 'tree-sitter-java';
// Import language parsers
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';
import Ruby from 'tree-sitter-ruby';
import Rust from 'tree-sitter-rust';
import TypeScript from 'tree-sitter-typescript';
import { promisify } from 'util';

interface ParseResult {
  ast: string;
  nodeCount: number;
  nodeTypes: string[];
}

interface QueryResult {
  matches: {
    capture: string;
    endPosition: { column: number; row: number };
    pattern: string;
    startPosition: { column: number; row: number };
    text: string;
  }[];
}

interface SearchResult {
  file: string;
  matches: {
    capture: string;
    endPosition: { column: number; row: number };
    pattern: string;
    startPosition: { column: number; row: number };
    text: string;
  }[];
}

class TreeSitterManager {
  private globPromise = promisify(glob);
  private languageParsers: Map<string, any>;
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    this.languageParsers = new Map([
      ['.cpp', CPP],
      ['.go', Go],
      ['.h', CPP],
      ['.hpp', CPP],
      ['.java', Java],
      ['.js', JavaScript],
      ['.py', Python],
      ['.rb', Ruby],
      ['.rs', Rust],
      ['.ts', TypeScript.typescript],
      ['.tsx', TypeScript.tsx],
    ]);
  }

  async parseCode(code: string, language: string): Promise<ParseResult> {
    try {
      const parser = this.languageParsers.get('.' + language.toLowerCase());
      if (!parser) {
        throw new Error(`Unsupported language: ${language}`);
      }

      this.parser.setLanguage(parser);
      const tree = this.parser.parse(code);
      const rootNode = tree.rootNode;

      return {
        ast: this.formatNode(rootNode),
        nodeCount: this.countNodes(rootNode),
        nodeTypes: Array.from(this.collectNodeTypes(rootNode)),
      };
    }
    catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  async parseFile(filepath: string): Promise<ParseResult> {
    try {
      const language = this.getLanguageForFile(filepath);
      this.parser.setLanguage(language);

      const code = await readFile(filepath, 'utf-8');
      const tree = this.parser.parse(code);
      const rootNode = tree.rootNode;

      return {
        ast: this.formatNode(rootNode),
        nodeCount: this.countNodes(rootNode),
        nodeTypes: Array.from(this.collectNodeTypes(rootNode)),
      };
    }
    catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  async queryCode(
    code: string,
    language: string,
    query: string,
  ): Promise<QueryResult> {
    try {
      const parser = this.languageParsers.get('.' + language.toLowerCase());
      if (!parser) {
        throw new Error(`Unsupported language: ${language}`);
      }

      this.parser.setLanguage(parser);
      const tree = this.parser.parse(code);

      const treeSitterQuery = parser.query(query);
      const matches = treeSitterQuery.matches(tree.rootNode);

      return {
        matches: matches.map(match => ({
          capture: match.capture,
          endPosition: match.node.endPosition,
          pattern: match.pattern.toString(),
          startPosition: match.node.startPosition,
          text: match.node.text,
        })),
      };
    }
    catch (error) {
      throw new Error(`Failed to query code: ${error.message}`);
    }
  }

  async queryFile(filepath: string, query: string): Promise<QueryResult> {
    try {
      const language = this.getLanguageForFile(filepath);
      this.parser.setLanguage(language);

      const code = await readFile(filepath, 'utf-8');
      const tree = this.parser.parse(code);

      const treeSitterQuery = language.query(query);
      const matches = treeSitterQuery.matches(tree.rootNode);

      return {
        matches: matches.map(match => ({
          capture: match.capture,
          endPosition: match.node.endPosition,
          pattern: match.pattern.toString(),
          startPosition: match.node.startPosition,
          text: match.node.text,
        })),
      };
    }
    catch (error) {
      throw new Error(`Failed to query file: ${error.message}`);
    }
  }

  async searchCodebase(
    directories: string[],
    query: string,
    filePatterns: string[] = ['**/*.{js,ts,tsx,py,rs,go,java,cpp,hpp,h,rb}'],
  ): Promise<SearchResult[]> {
    try {
      const files = await this.findFiles(directories, filePatterns);
      const results: SearchResult[] = [];

      for (const file of files) {
        try {
          const language = this.getLanguageForFile(file);
          this.parser.setLanguage(language);

          const code = await readFile(file, 'utf-8');
          const tree = this.parser.parse(code);

          const treeSitterQuery = language.query(query);
          const matches = treeSitterQuery.matches(tree.rootNode);

          if (matches.length > 0) {
            results.push({
              file,
              matches: matches.map(match => ({
                capture: match.capture,
                endPosition: match.node.endPosition,
                pattern: match.pattern.toString(),
                startPosition: match.node.startPosition,
                text: match.node.text,
              })),
            });
          }
        }
        catch (error) {
          console.warn(`Failed to process file ${file}: ${error.message}`);
          continue;
        }
      }

      return results;
    }
    catch (error) {
      throw new Error(`Failed to search codebase: ${error.message}`);
    }
  }

  private collectNodeTypes(
    node: Parser.SyntaxNode,
    types = new Set<string>(),
  ): Set<string> {
    types.add(node.type);
    const cursor = node.walk();
    let hasChildren = cursor.gotoFirstChild();

    while (hasChildren) {
      this.collectNodeTypes(cursor.currentNode, types);
      hasChildren = cursor.gotoNextSibling();
    }

    return types;
  }

  private countNodes(node: Parser.SyntaxNode): number {
    let count = 1;
    const cursor = node.walk();
    let hasChildren = cursor.gotoFirstChild();

    while (hasChildren) {
      count += this.countNodes(cursor.currentNode);
      hasChildren = cursor.gotoNextSibling();
    }

    return count;
  }

  private async findFiles(
    directories: string[],
    patterns: string[],
  ): Promise<string[]> {
    const allFiles: string[] = [];

    for (const dir of directories) {
      for (const pattern of patterns) {
        const files = await this.globPromise(pattern, {
          absolute: true,
          cwd: dir,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
          ],
          nodir: true,
        });
        allFiles.push(...(files as string[]));
      }
    }

    return Array.from(new Set(allFiles));
  }

  private formatNode(node: Parser.SyntaxNode, indent = ''): string {
    const children = [];
    const cursor = node.walk();
    let hasChildren = cursor.gotoFirstChild();

    while (hasChildren) {
      children.push(this.formatNode(cursor.currentNode, indent + '  '));
      hasChildren = cursor.gotoNextSibling();
    }

    const nodeInfo = [
      `${indent}${node.type}`,
      node.startPosition.row !== node.endPosition.row
        ? ` (${node.startPosition.row},${node.startPosition.column}) - (${node.endPosition.row},${node.endPosition.column})`
        : ` (${node.startPosition.column}-${node.endPosition.column})`,
    ];

    if (node.isNamed) {
      nodeInfo.push(' [named]');
    }

    return (
      nodeInfo.join('') + (children.length ? '\n' + children.join('\n') : '')
    );
  }

  private getLanguageForFile(filepath: string): any {
    const ext = extname(filepath).toLowerCase();
    const language = this.languageParsers.get(ext);
    if (!language) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
    return language;
  }
}

// Create a singleton instance
const treeSitterManager = new TreeSitterManager();

// Tool definitions
const parseFileTool: Tool = {
  description: 'Parse a file using TreeSitter and return its AST',
  handler: async (params: any) => {
    return await treeSitterManager.parseFile(params.filepath);
  },
  id: 'parse_file',
  name: 'Parse File',
  parameters: [
    {
      description: 'Path to the file to parse',
      name: 'filepath',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const parseCodeTool: Tool = {
  description: 'Parse a code snippet using TreeSitter and return its AST',
  handler: async (params: any) => {
    return await treeSitterManager.parseCode(params.code, params.language);
  },
  id: 'parse_code',
  name: 'Parse Code',
  parameters: [
    {
      description: 'Code to parse',
      name: 'code',
      required: true,
      type: 'string',
    },
    {
      description:
        'Programming language of the code (js, ts, py, rs, go, java, cpp, rb)',
      name: 'language',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const queryFileTool: Tool = {
  description: 'Query a file using TreeSitter query syntax',
  handler: async (params: any) => {
    return await treeSitterManager.queryFile(params.filepath, params.query);
  },
  id: 'query_file',
  name: 'Query File',
  parameters: [
    {
      description: 'Path to the file to query',
      name: 'filepath',
      required: true,
      type: 'string',
    },
    {
      description: 'TreeSitter query pattern',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const queryCodeTool: Tool = {
  description: 'Query a code snippet using TreeSitter query syntax',
  handler: async (params: any) => {
    return await treeSitterManager.queryCode(
      params.code,
      params.language,
      params.query,
    );
  },
  id: 'query_code',
  name: 'Query Code',
  parameters: [
    {
      description: 'Code to query',
      name: 'code',
      required: true,
      type: 'string',
    },
    {
      description:
        'Programming language of the code (js, ts, py, rs, go, java, cpp, rb)',
      name: 'language',
      required: true,
      type: 'string',
    },
    {
      description: 'TreeSitter query pattern',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const searchCodebaseTool: Tool = {
  description:
    'Search through multiple files in directories using TreeSitter query patterns',
  handler: async (params: any) => {
    return await treeSitterManager.searchCodebase(
      params.directories,
      params.query,
      params.filePatterns,
    );
  },
  id: 'search_codebase',
  name: 'Search Codebase',
  parameters: [
    {
      description: 'List of directory paths to search in',
      name: 'directories',
      required: true,
      type: 'array',
    },
    {
      description: 'TreeSitter query pattern',
      name: 'query',
      required: true,
      type: 'string',
    },
    {
      description:
        'Glob patterns for files to include (e.g., ["**/*.ts", "**/*.py"])',
      name: 'filePatterns',
      required: false,
      type: 'array',
    },
  ],
  returnType: 'array',
};

const tools = [
  parseFileTool,
  parseCodeTool,
  queryFileTool,
  queryCodeTool,
  searchCodebaseTool,
];

export { tools };
