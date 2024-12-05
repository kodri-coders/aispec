import { Tool } from "@aispec/tool-types";
import Parser from "tree-sitter";
import { readFile, readdir } from "fs/promises";
import { join, extname, resolve } from "path";
import { tmpdir } from "os";
import { promisify } from "util";
import { glob } from "glob";

// Import language parsers
import JavaScript from "tree-sitter-javascript";
import TypeScript from "tree-sitter-typescript";
import Python from "tree-sitter-python";
import Rust from "tree-sitter-rust";
import Go from "tree-sitter-go";
import Java from "tree-sitter-java";
import CPP from "tree-sitter-cpp";
import Ruby from "tree-sitter-ruby";

interface ParseResult {
  ast: string;
  nodeTypes: string[];
  nodeCount: number;
}

interface QueryResult {
  matches: Array<{
    pattern: string;
    capture: string;
    text: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
  }>;
}

interface SearchResult {
  file: string;
  matches: Array<{
    pattern: string;
    capture: string;
    text: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
  }>;
}

class TreeSitterManager {
  private parser: Parser;
  private languageParsers: Map<string, any>;
  private globPromise = promisify(glob);

  constructor() {
    this.parser = new Parser();
    this.languageParsers = new Map([
      [".js", JavaScript],
      [".ts", TypeScript.typescript],
      [".tsx", TypeScript.tsx],
      [".py", Python],
      [".rs", Rust],
      [".go", Go],
      [".java", Java],
      [".cpp", CPP],
      [".hpp", CPP],
      [".h", CPP],
      [".rb", Ruby],
    ]);
  }

  private getLanguageForFile(filepath: string): any {
    const ext = extname(filepath).toLowerCase();
    const language = this.languageParsers.get(ext);
    if (!language) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
    return language;
  }

  private formatNode(node: Parser.SyntaxNode, indent = ""): string {
    const children = [];
    let cursor = node.walk();
    let hasChildren = cursor.gotoFirstChild();

    while (hasChildren) {
      children.push(this.formatNode(cursor.currentNode(), indent + "  "));
      hasChildren = cursor.gotoNextSibling();
    }

    const nodeInfo = [
      `${indent}${node.type}`,
      node.startPosition.row !== node.endPosition.row
        ? ` (${node.startPosition.row},${node.startPosition.column}) - (${node.endPosition.row},${node.endPosition.column})`
        : ` (${node.startPosition.column}-${node.endPosition.column})`,
    ];

    if (node.isNamed()) {
      nodeInfo.push(" [named]");
    }

    return (
      nodeInfo.join("") + (children.length ? "\n" + children.join("\n") : "")
    );
  }

  private collectNodeTypes(
    node: Parser.SyntaxNode,
    types = new Set<string>(),
  ): Set<string> {
    types.add(node.type);
    let cursor = node.walk();
    let hasChildren = cursor.gotoFirstChild();

    while (hasChildren) {
      this.collectNodeTypes(cursor.currentNode(), types);
      hasChildren = cursor.gotoNextSibling();
    }

    return types;
  }

  async parseFile(filepath: string): Promise<ParseResult> {
    try {
      const language = this.getLanguageForFile(filepath);
      this.parser.setLanguage(language);

      const code = await readFile(filepath, "utf-8");
      const tree = this.parser.parse(code);
      const rootNode = tree.rootNode;

      return {
        ast: this.formatNode(rootNode),
        nodeTypes: Array.from(this.collectNodeTypes(rootNode)),
        nodeCount: this.countNodes(rootNode),
      };
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  async parseCode(code: string, language: string): Promise<ParseResult> {
    try {
      const parser = this.languageParsers.get("." + language.toLowerCase());
      if (!parser) {
        throw new Error(`Unsupported language: ${language}`);
      }

      this.parser.setLanguage(parser);
      const tree = this.parser.parse(code);
      const rootNode = tree.rootNode;

      return {
        ast: this.formatNode(rootNode),
        nodeTypes: Array.from(this.collectNodeTypes(rootNode)),
        nodeCount: this.countNodes(rootNode),
      };
    } catch (error) {
      throw new Error(`Failed to parse code: ${error.message}`);
    }
  }

  private countNodes(node: Parser.SyntaxNode): number {
    let count = 1;
    let cursor = node.walk();
    let hasChildren = cursor.gotoFirstChild();

    while (hasChildren) {
      count += this.countNodes(cursor.currentNode());
      hasChildren = cursor.gotoNextSibling();
    }

    return count;
  }

  async queryFile(filepath: string, query: string): Promise<QueryResult> {
    try {
      const language = this.getLanguageForFile(filepath);
      this.parser.setLanguage(language);

      const code = await readFile(filepath, "utf-8");
      const tree = this.parser.parse(code);

      const treeSitterQuery = language.query(query);
      const matches = treeSitterQuery.matches(tree.rootNode);

      return {
        matches: matches.map((match) => ({
          pattern: match.pattern.toString(),
          capture: match.capture,
          text: match.node.text,
          startPosition: match.node.startPosition,
          endPosition: match.node.endPosition,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to query file: ${error.message}`);
    }
  }

  async queryCode(
    code: string,
    language: string,
    query: string,
  ): Promise<QueryResult> {
    try {
      const parser = this.languageParsers.get("." + language.toLowerCase());
      if (!parser) {
        throw new Error(`Unsupported language: ${language}`);
      }

      this.parser.setLanguage(parser);
      const tree = this.parser.parse(code);

      const treeSitterQuery = parser.query(query);
      const matches = treeSitterQuery.matches(tree.rootNode);

      return {
        matches: matches.map((match) => ({
          pattern: match.pattern.toString(),
          capture: match.capture,
          text: match.node.text,
          startPosition: match.node.startPosition,
          endPosition: match.node.endPosition,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to query code: ${error.message}`);
    }
  }

  private async findFiles(
    directories: string[],
    patterns: string[],
  ): Promise<string[]> {
    const allFiles: string[] = [];

    for (const dir of directories) {
      for (const pattern of patterns) {
        const files = await this.globPromise(pattern, {
          cwd: dir,
          absolute: true,
          nodir: true,
          ignore: [
            "**/node_modules/**",
            "**/dist/**",
            "**/build/**",
            "**/.git/**",
          ],
        });
        allFiles.push(...files);
      }
    }

    return Array.from(new Set(allFiles));
  }

  async searchCodebase(
    directories: string[],
    query: string,
    filePatterns: string[] = ["**/*.{js,ts,tsx,py,rs,go,java,cpp,hpp,h,rb}"],
  ): Promise<SearchResult[]> {
    try {
      const files = await this.findFiles(directories, filePatterns);
      const results: SearchResult[] = [];

      for (const file of files) {
        try {
          const language = this.getLanguageForFile(file);
          this.parser.setLanguage(language);

          const code = await readFile(file, "utf-8");
          const tree = this.parser.parse(code);

          const treeSitterQuery = language.query(query);
          const matches = treeSitterQuery.matches(tree.rootNode);

          if (matches.length > 0) {
            results.push({
              file,
              matches: matches.map((match) => ({
                pattern: match.pattern.toString(),
                capture: match.capture,
                text: match.node.text,
                startPosition: match.node.startPosition,
                endPosition: match.node.endPosition,
              })),
            });
          }
        } catch (error) {
          console.warn(`Failed to process file ${file}: ${error.message}`);
          continue;
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to search codebase: ${error.message}`);
    }
  }
}

// Create a singleton instance
const treeSitterManager = new TreeSitterManager();

// Tool definitions
const parseFileTool: Tool = {
  id: "parse_file",
  name: "Parse File",
  description: "Parse a file using TreeSitter and return its AST",
  parameters: [
    {
      name: "filepath",
      type: "string",
      description: "Path to the file to parse",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await treeSitterManager.parseFile(params.filepath);
  },
};

const parseCodeTool: Tool = {
  id: "parse_code",
  name: "Parse Code",
  description: "Parse a code snippet using TreeSitter and return its AST",
  parameters: [
    {
      name: "code",
      type: "string",
      description: "Code to parse",
      required: true,
    },
    {
      name: "language",
      type: "string",
      description:
        "Programming language of the code (js, ts, py, rs, go, java, cpp, rb)",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await treeSitterManager.parseCode(params.code, params.language);
  },
};

const queryFileTool: Tool = {
  id: "query_file",
  name: "Query File",
  description: "Query a file using TreeSitter query syntax",
  parameters: [
    {
      name: "filepath",
      type: "string",
      description: "Path to the file to query",
      required: true,
    },
    {
      name: "query",
      type: "string",
      description: "TreeSitter query pattern",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await treeSitterManager.queryFile(params.filepath, params.query);
  },
};

const queryCodeTool: Tool = {
  id: "query_code",
  name: "Query Code",
  description: "Query a code snippet using TreeSitter query syntax",
  parameters: [
    {
      name: "code",
      type: "string",
      description: "Code to query",
      required: true,
    },
    {
      name: "language",
      type: "string",
      description:
        "Programming language of the code (js, ts, py, rs, go, java, cpp, rb)",
      required: true,
    },
    {
      name: "query",
      type: "string",
      description: "TreeSitter query pattern",
      required: true,
    },
  ],
  returnType: "object",
  handler: async (params: any) => {
    return await treeSitterManager.queryCode(
      params.code,
      params.language,
      params.query,
    );
  },
};

const searchCodebaseTool: Tool = {
  id: "search_codebase",
  name: "Search Codebase",
  description:
    "Search through multiple files in directories using TreeSitter query patterns",
  parameters: [
    {
      name: "directories",
      type: "array",
      description: "List of directory paths to search in",
      required: true,
    },
    {
      name: "query",
      type: "string",
      description: "TreeSitter query pattern",
      required: true,
    },
    {
      name: "filePatterns",
      type: "array",
      description:
        'Glob patterns for files to include (e.g., ["**/*.ts", "**/*.py"])',
      required: false,
    },
  ],
  returnType: "array",
  handler: async (params: any) => {
    return await treeSitterManager.searchCodebase(
      params.directories,
      params.query,
      params.filePatterns,
    );
  },
};

const tools = [
  parseFileTool,
  parseCodeTool,
  queryFileTool,
  queryCodeTool,
  searchCodebaseTool,
];

export { tools };
