# XML Schema Technical Specification

## Overview

This document provides a comprehensive technical specification for the XML schemas used in the AI Assistant Framework. The framework uses XML configuration files to define assistants, skills, workflows, and memory management.

## Schema Files

1. [assistant.xsd](#assistant-schema): Defines the structure for assistant configurations
2. [skill.xsd](#skill-schema): Defines the structure for skill configurations
3. [memory.xsd](#memory-schema): Defines the structure for memory storage
4. [step_memory.xsd](#step-memory-schema): Defines the structure for step-specific memory operations

## Schema Specifications

### Assistant Schema

The assistant schema (`assistant.xsd`) defines the structure for configuring AI assistants.

#### Root Element: `assistant`

**Attributes:**
- `id` (required, string): Unique identifier for the assistant
- `version` (optional, string): Version of the assistant configuration

**Child Elements:**
1. `name` (required)
   - Type: string
   - Description: Human-readable name of the assistant

2. `description` (required)
   - Type: string
   - Description: Detailed description of the assistant's purpose and capabilities

3. `skills` (optional)
   - Type: complex
   - Description: Collection of skill references
   - Child Elements:
     - `skill` (0..∞)
       - Attributes:
         - `ref` (required, string): Reference to a skill configuration file

4. `workflows` (required)
   - Type: complex
   - Description: Collection of workflow definitions
   - Child Elements:
     - `workflow` (1..∞)
       - Attributes:
         - `id` (required, string): Unique identifier for the workflow
       - Child Elements:
         - `steps` (required)
           - Type: complex
           - Child Elements:
             - `step` (1..∞)
               - Attributes:
                 - `id` (required, string): Unique identifier for the step
               - Child Elements:
                 - `prompt` (required, string): The prompt template for the step
                 - `tools` (optional): Collection of tool references
                 - `skills` (optional): Collection of skill references
                 - `step_memory` (optional): Memory configuration for the step

### Skill Schema

The skill schema (`skill.xsd`) defines the structure for configuring reusable skills.

#### Root Element: `skill`

**Attributes:**
- `id` (required, string): Unique identifier for the skill
- `version` (optional, string): Version of the skill configuration

**Child Elements:**
1. `name` (required)
   - Type: string
   - Description: Human-readable name of the skill

2. `description` (required)
   - Type: string
   - Description: Detailed description of the skill's purpose and capabilities

3. `dependencies` (optional)
   - Type: complex
   - Description: Collection of skill dependencies
   - Child Elements:
     - `skill` (0..∞)
       - Attributes:
         - `ref` (required, string): Reference to a dependent skill configuration file

4. `tools` (optional)
   - Type: complex
   - Description: Collection of tool references
   - Child Elements:
     - `tool` (0..∞)
       - Attributes:
         - `ref` (required, string): Reference to a tool configuration

5. `workflows` (required)
   - Type: complex
   - Description: Collection of workflow definitions
   - Child Elements:
     - `workflow` (1..∞)
       - Structure identical to assistant workflows

### Memory Schema

The memory schema (`memory.xsd`) defines the structure for storing and managing memories.

#### Root Element: `memory`

**Attributes:**
- `id` (required, string): Unique identifier for the memory (UUID)
- `type` (required, string): Type classification of the memory

**Child Elements:**
1. `context` (required)
   - Type: string
   - Description: Contextual information about the memory's creation or purpose

2. `content` (required)
   - Type: string
   - Description: The actual content of the memory

3. `timestamp` (required)
   - Type: dateTime
   - Description: When the memory was created or last modified

4. `tags` (optional)
   - Type: complex
   - Description: Collection of tags for categorizing and filtering memories
   - Child Elements:
     - `tag` (0..∞)
       - Type: string
       - Description: Individual tag value

5. `metadata` (optional)
   - Type: complex
   - Description: Additional structured metadata about the memory
   - Child Elements:
     - `key` (0..∞)
       - Attributes:
         - `name` (required, string): Metadata key name
       - Type: string
       - Description: Metadata value

### Step Memory Schema

The step memory schema (`step_memory.xsd`) defines the structure for configuring memory operations within workflow steps.

#### Root Element: `step_memory`

**Child Elements:**
1. `store` (0..∞)
   - Type: complex
   - Description: Configuration for storing new memories
   - Attributes:
     - `type` (required, string): Type classification for the stored memory
   - Child Elements:
     - `instruction` (required)
       - Type: string
       - Description: Instructions for what to store and how to process it
     - `tags` (optional)
       - Type: complex
       - Child Elements:
         - `tag` (0..∞)
           - Type: string
           - Description: Tags to apply to the stored memory

2. `recall` (0..∞)
   - Type: complex
   - Description: Configuration for recalling existing memories
   - Attributes:
     - `var` (required, string): Variable name to store the recalled memories
   - Child Elements:
     - `query` (required)
       - Type: string
       - Description: Search query for finding relevant memories
     - `filter` (optional)
       - Type: complex
       - Child Elements:
         - `tag` (0..∞)
           - Type: string
           - Description: Tags to filter memories by

### Workflow Control Flow

The framework now supports advanced workflow control flow features including looping and step rewinding.

#### Workflow Looping

Workflows can be configured to loop until a specific condition is met using the `loop_condition` element:

```xml
<workflow id="review_code">
  <loop_condition>
    <check>all_issues_resolved</check>
    <max_iterations>5</max_iterations>
    <exit_condition>critical_error_found</exit_condition>
  </loop_condition>
  <steps>
    <!-- workflow steps -->
  </steps>
</workflow>
```

**Loop Condition Elements:**
- `check` (required): Expression or variable to evaluate for continuing the loop
- `max_iterations` (optional): Maximum number of loop iterations to prevent infinite loops
- `exit_condition` (optional): Condition that will force an early exit from the loop

#### Step Rewinding

Individual steps can be configured to rewind to a previous step based on conditions:

```xml
<step id="validate_solution">
  <prompt>Validate the current solution</prompt>
  <rewind>
    <condition>validation_failed</condition>
    <target_step>design_solution</target_step>
    <clear_memory>false</clear_memory>
  </rewind>
</step>
```

**Rewind Elements:**
- `condition` (required): Expression or variable to evaluate for triggering the rewind
- `target_step` (required): ID of the step to rewind to
- `clear_memory` (optional): Boolean indicating whether to clear step memories when rewinding

### Implementation Details

1. Loop Execution
   - The workflow engine evaluates the `check` condition before each iteration
   - Loops continue until the check condition is false or max_iterations is reached
   - The `exit_condition` is evaluated at the end of each iteration
   - Loop state is maintained in workflow memory

2. Rewind Execution
   - The `condition` is evaluated at the end of the step
   - If true, execution returns to the `target_step`
   - Memory handling is controlled by `clear_memory`
   - Rewind operations are logged for debugging

### Usage Example

Here's a complete example of a workflow using both looping and rewinding:

```xml
<workflow id="optimize_code">
  <loop_condition>
    <check>performance_target_not_met</check>
    <max_iterations>3</max_iterations>
    <exit_condition>critical_error</exit_condition>
  </loop_condition>
  <steps>
    <step id="analyze_performance">
      <prompt>Analyze current performance metrics</prompt>
    </step>
    <step id="identify_bottlenecks">
      <prompt>Identify performance bottlenecks</prompt>
    </step>
    <step id="implement_optimizations">
      <prompt>Implement performance optimizations</prompt>
    </step>
    <step id="validate_changes">
      <prompt>Validate optimization changes</prompt>
      <rewind>
        <condition>validation_failed</condition>
        <target_step>identify_bottlenecks</target_step>
        <clear_memory>false</clear_memory>
      </rewind>
    </step>
  </steps>
</workflow>
```

### Best Practices

1. Loop Design
   - Set appropriate `max_iterations` to prevent infinite loops
   - Use clear and specific check conditions
   - Implement proper exit conditions for error cases
   - Store loop state in workflow memory

2. Rewind Usage
   - Use rewinding sparingly to avoid circular execution
   - Clear memory selectively to maintain relevant context
   - Document rewind conditions and targets
   - Consider impact on workflow state

3. Error Handling
   - Implement proper error handling for loop conditions
   - Handle rewind failures gracefully
   - Log all control flow decisions
   - Maintain execution audit trail

4. Memory Management
   - Clear unnecessary memories during long loops
   - Preserve essential context during rewinds
   - Track memory usage in loop iterations
   - Implement memory cleanup strategies

## Usage Examples

### Assistant Configuration Example
```xml
<assistant id="tech_lead">
  <name>Tech Lead Assistant</name>
  <description>Coordinates development tasks</description>
  <skills>
    <skill ref="task_coordination_skill.xml" />
  </skills>
  <workflows>
    <workflow id="coordinate_project">
      <steps>
        <step id="analyze_requirements">
          <prompt>Analyze requirements: ${requirements}</prompt>
          <step_memory>
            <store type="requirements">
              <instruction>Store requirements analysis</instruction>
              <tags>
                <tag>requirements</tag>
                <tag>analysis</tag>
              </tags>
            </store>
          </step_memory>
        </step>
      </steps>
    </workflow>
  </workflows>
</assistant>
```

### Skill Configuration Example
```xml
<skill id="task_coordination">
  <name>Task Coordination</name>
  <description>Manages task breakdown and assignment</description>
  <dependencies>
    <skill ref="project_management_skill.xml" />
  </dependencies>
  <tools>
    <tool ref="jira_tool" />
  </tools>
  <workflows>
    <workflow id="break_down_tasks">
      <steps>
        <step id="create_subtasks">
          <prompt>Create subtasks for: ${task}</prompt>
        </step>
      </steps>
    </workflow>
  </workflows>
</skill>
```

### Memory Storage Example
```xml
<memory id="550e8400-e29b-41d4-a716-446655440000" type="requirements">
  <context>Initial project requirements analysis</context>
  <content>The system needs user authentication...</content>
  <timestamp>2024-02-26T12:00:00Z</timestamp>
  <tags>
    <tag>requirements</tag>
    <tag>analysis</tag>
  </tags>
  <metadata>
    <key name="priority">high</key>
    <key name="status">approved</key>
  </metadata>
</memory>
```

### Step Memory Configuration Example
```xml
<step_memory>
  <store type="decision">
    <instruction>Store the architectural decision</instruction>
    <tags>
      <tag>architecture</tag>
      <tag>decision</tag>
    </tags>
  </store>
  <recall var="previous_decisions">
    <query>Find relevant architectural decisions</query>
    <filter>
      <tag>architecture</tag>
    </filter>
  </recall>
</step_memory>
```

## Implementation Notes

1. Memory Management
   - Memories are stored with UUIDs for unique identification
   - Timestamps enable temporal tracking and ordering
   - Tag-based filtering supports efficient memory retrieval
   - Metadata provides extensible storage for additional properties

2. Workflow Integration
   - Steps can store and recall memories dynamically
   - Memory context flows between workflow steps
   - Skills can access and modify shared memory space

3. Tool Integration
   - Tools are referenced by ID in skill configurations
   - Multiple tools can be used within a single skill
   - Tool configurations are separate from skill definitions

4. XML Validation
   - All XML files must validate against their respective schemas
   - Schema validation ensures configuration consistency
   - Version attributes enable schema evolution

## Best Practices

1. Memory Storage
   - Use descriptive type classifications
   - Include relevant context information
   - Apply consistent tagging conventions
   - Keep content focused and atomic

2. Memory Recall
   - Use specific queries for better relevance
   - Apply appropriate tag filters
   - Consider temporal aspects in queries
   - Handle missing or empty results

3. Workflow Design
   - Break complex tasks into manageable steps
   - Use appropriate skill abstractions
   - Maintain clear step dependencies
   - Document memory requirements

4. Configuration Management
   - Use semantic versioning for schemas
   - Document schema changes
   - Maintain backward compatibility
   - Test configuration changes

## Security Considerations

1. Memory Storage
   - Sanitize stored content
   - Validate memory types
   - Control metadata access
   - Implement memory isolation

2. Tool Integration
   - Validate tool references
   - Control tool permissions
   - Monitor tool usage
   - Audit tool actions

3. XML Processing
   - Validate XML input
   - Prevent XXE attacks
   - Control schema access
   - Sanitize output

## Performance Considerations

1. Memory Management
   - Implement efficient storage
   - Optimize memory searches
   - Consider memory cleanup
   - Cache frequent queries

2. Workflow Execution
   - Minimize step dependencies
   - Optimize memory access
   - Implement parallel execution
   - Monitor resource usage

## Future Enhancements

1. Schema Extensions
   - Add versioning support
   - Enhance metadata capabilities
   - Support complex queries
   - Add validation rules

2. Memory Features
   - Implement memory expiration
   - Add memory compression
   - Support binary content
   - Add memory analytics

3. Tool Integration
   - Add tool versioning
   - Enhance tool discovery
   - Support tool composition
   - Add tool metrics

4. Workflow Capabilities
   - Add conditional execution
   - Support parallel steps
   - Add error recovery
   - Enhance monitoring
