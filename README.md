# Assistant Spec

A TypeScript framework for creating LLM assistants using XML-based configuration. This framework allows you to define assistants with inheritable skills and complex workflows using XML, while implementing the actual tools in TypeScript with Zod schema validation.

## Features

- XML-based assistant configuration
- XML-based skill definitions with inheritance
- TypeScript-based tool implementation with Zod schema validation
- Multi-step workflow support
- Self-prompting capabilities
- Modular and extensible architecture

## Pre-requisites

- [Node.js (v18 or later)](https://nodejs.org/en/download/package-manager)
- [pnpm](https://pnpm.io)

## Installation

```bash
pnpm install
```

## Usage

### 1. Define a Skill (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<skill id="search">
  <name>Search Skill</name>
  <description>A skill for performing searches</description>
  <workflows>
    <workflow id="web_search">
      <name>Web Search</name>
      <description>Perform a web search</description>
      <steps>
        <step id="search_step">
          <name>Search Step</name>
          <description>Perform the search</description>
          <tools>
            <tool ref="search_tool"/>
          </tools>
          <prompt>Searching for: ${query}</prompt>
        </step>
      </steps>
    </workflow>
  </workflows>
</skill>
```

### 2. Define an Assistant (XML)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<assistant id="search_assistant">
  <name>Search Assistant</name>
  <description>An assistant that helps with searching</description>
  <skills>
    <skill ref="search_skill.xml"/>
  </skills>
  <workflows>
    <workflow id="search_and_summarize">
      <name>Search and Summarize</name>
      <description>Search and summarize results</description>
      <steps>
        <step id="search">
          <name>Search</name>
          <description>Perform the search</description>
          <skills>
            <skill ref="search"/>
          </skills>
          <prompt>Please search for: ${query}</prompt>
        </step>
      </steps>
    </workflow>
  </workflows>
</assistant>
```

### 3. Implement Tools (TypeScript)

```typescript
import { Tool } from "assistant-spec";

const searchTool: Tool = {
  id: "search_tool",
  name: "Web Search",
  description: "Performs a web search",
  parameters: [
    {
      name: "query",
      type: "string",
      description: "The search query",
      required: true,
    },
  ],
  returnType: "array",
  handler: async (params: { query: string }) => {
    // Implement search logic
    return [`Result for ${params.query}`];
  },
};
```

### 4. Use the Assistant

```typescript
import { Assistant } from "assistant-spec";

async function main() {
  const assistant = await Assistant.fromXML("./search_assistant.xml");
  assistant.addTool(searchTool);

  const result = await assistant.executeWorkflow("search_and_summarize", {
    query: "TypeScript best practices",
  });

  console.log("Result:", result);
}
```

## Development

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Build the core project: `cd packages/core && pnpm build`
4. Run tests: `cd packages/core && pnpm test`

## License

MIT
