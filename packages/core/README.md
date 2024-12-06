# Assistant Specification Core Package

This package provides a powerful framework for building AI-driven workflows and assistants. It implements a flexible XML-based configuration system that allows you to define complex AI assistant behaviors, workflows, and skills.

## Core Components

### Assistant (`Assistant.ts`)
The central class that represents an AI assistant. It manages:
- Multiple workflows and skills
- Model configurations
- XML-based configuration loading
- Workflow discovery and execution

### WorkflowRunner (`WorkflowRunner.ts`)
Handles the execution of workflows:
- Step-by-step workflow progression
- Context management
- Event emission for workflow state changes
- LLM integration for generating responses
- XML configuration parsing

### LLMEngine (`LLMEngine.ts`)
Manages interactions with Language Learning Models:
- Supports multiple model types (GPT-4, GPT-3.5, O1-mini, O1-preview)
- Handles model-specific request formatting
- Manages model parameters (temperature, max tokens)
- Processes prompts and generates responses

### Core Classes
- `Skill.ts`: Defines reusable capabilities that can be attached to assistants
- `Workflow.ts`: Defines sequences of steps to accomplish specific tasks
- `Step.ts`: Individual actions within a workflow
- `Prompt.ts`: Template management for AI interactions
- `Input.ts` & `Output.ts`: Data handling for workflow steps
- `XMLBase.ts`: Base class for XML configuration parsing

## Architecture

The package follows a modular architecture:

1. **Configuration Layer** (XML-based)
   - Assistants, skills, and workflows are defined in XML
   - Allows for declarative behavior specification
   - Supports inheritance and composition

2. **Execution Layer**
   - WorkflowRunner orchestrates step execution
   - Event-driven architecture for workflow progression
   - Context management across steps

3. **AI Integration Layer**
   - LLMEngine abstracts different AI model interactions
   - Standardized prompt handling
   - Model-specific request formatting

## Usage

### Creating an Assistant

```typescript
const assistant = new Assistant({
  name: "MyAssistant",
  description: "A helpful AI assistant",
  model: {
    name: "gpt-4",
    temperature: 0.7,
    max_tokens: 1000
  }
});
```

### Defining Workflows

Workflows are defined in XML format and can be loaded into the assistant:

```xml
<workflow id="example-workflow">
  <steps>
    <step>
      <prompt>...</prompt>
      <output>...</output>
    </step>
  </steps>
</workflow>
```

### Running Workflows

```typescript
const runner = assistant.loadWorkflow("example-workflow");
runner.start(initialContext);
runner.onFinish().then(result => {
  console.log("Workflow completed:", result);
});
```

## Event System

The framework uses an event-driven architecture:
- `step-finished`: Emitted when a workflow step completes
- `workflow-finished`: Emitted when the entire workflow completes

## Model Support

Supported AI models:
- GPT-4
- GPT-4o
- GPT-3.5
- O1-mini
- O1-preview

Each model can be configured with specific parameters like temperature and token limits.

## XML Configuration

The package uses XML for configuration, allowing for:
- Hierarchical organization of components
- Clear separation of concerns
- Reusable skills and workflows
- Declarative behavior specification

## Dependencies

- `fast-xml-parser`: XML parsing and building
- `ai`: AI model integration
- `stream`: Event handling

## Best Practices

1. **Modular Design**
   - Break down complex tasks into reusable skills
   - Create focused, single-purpose workflows
   - Use XML configuration for behavior definition

2. **Error Handling**
   - Implement proper error handling in workflows
   - Use event listeners for workflow monitoring
   - Validate XML configurations

3. **Context Management**
   - Maintain clean context separation between steps
   - Use proper scoping for workflow variables
   - Clear context when workflows complete

## Contributing

When contributing to this package:
1. Follow the existing XML schema for configurations
2. Maintain backward compatibility
3. Add appropriate tests for new features
4. Document any new components or features
5. Follow TypeScript best practices
