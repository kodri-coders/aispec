import { Tool } from '@aispec/tool-types';
import { promises as fs } from 'fs';
import path from 'path';

// Define the path to the memory file
const MEMORY_FILE_PATH = path.join(__dirname, 'memory.json');

// Type definitions
interface Entity {
  entityType: string;
  name: string;
  observations: string[];
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

interface Relation {
  from: string;
  relationType: string;
  to: string;
}

// The KnowledgeGraphManager class manages all operations on the knowledge graph
class KnowledgeGraphManager {
  async addObservations(
    observations: { contents: string[]; entityName: string }[],
  ): Promise<{ addedObservations: string[]; entityName: string }[]> {
    const graph = await this.loadGraph();
    const results = observations.map((o) => {
      const entity = graph.entities.find(e => e.name === o.entityName);
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`);
      }
      const newObservations = o.contents.filter(
        content => !entity.observations.includes(content),
      );
      entity.observations.push(...newObservations);
      return { addedObservations: newObservations, entityName: o.entityName };
    });
    await this.saveGraph(graph);
    return results;
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    const newEntities = entities.filter(
      e =>
        !graph.entities.some(
          existingEntity => existingEntity.name === e.name,
        ),
    );
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const newRelations = relations.filter(
      r =>
        !graph.relations.some(
          existingRelation =>
            existingRelation.from === r.from
            && existingRelation.to === r.to
            && existingRelation.relationType === r.relationType,
        ),
    );
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter(
      e => !entityNames.includes(e.name),
    );
    graph.relations = graph.relations.filter(
      r => !entityNames.includes(r.from) && !entityNames.includes(r.to),
    );
    await this.saveGraph(graph);
  }

  async deleteObservations(
    deletions: { entityName: string; observations: string[] }[],
  ): Promise<void> {
    const graph = await this.loadGraph();
    deletions.forEach((d) => {
      const entity = graph.entities.find(e => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter(
          o => !d.observations.includes(o),
        );
      }
    });
    await this.saveGraph(graph);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter(
      r =>
        !relations.some(
          delRelation =>
            r.from === delRelation.from
            && r.to === delRelation.to
            && r.relationType === delRelation.relationType,
        ),
    );
    await this.saveGraph(graph);
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const filteredEntities = graph.entities.filter(e =>
      names.includes(e.name),
    );
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    const filteredRelations = graph.relations.filter(
      r => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to),
    );
    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const filteredEntities = graph.entities.filter(
      e =>
        e.name.toLowerCase().includes(query.toLowerCase())
        || e.entityType.toLowerCase().includes(query.toLowerCase())
        || e.observations.some(o =>
          o.toLowerCase().includes(query.toLowerCase()),
        ),
    );
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    const filteredRelations = graph.relations.filter(
      r => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to),
    );
    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, 'utf-8');
      const lines = data.split('\n').filter(line => line.trim() !== '');
      return lines.reduce(
        (graph: KnowledgeGraph, line) => {
          const item = JSON.parse(line);
          if (item.type === 'entity') graph.entities.push(item as Entity);
          if (item.type === 'relation') graph.relations.push(item as Relation);
          return graph;
        },
        { entities: [], relations: [] },
      );
    }
    catch (error) {
      if (
        error instanceof Error
        && 'code' in error
        && (error as any).code === 'ENOENT'
      ) {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ type: 'entity', ...e })),
      ...graph.relations.map(r => JSON.stringify({ type: 'relation', ...r })),
    ];
    await fs.writeFile(MEMORY_FILE_PATH, lines.join('\n'));
  }
}

// Create a singleton instance
const knowledgeGraphManager = new KnowledgeGraphManager();

// Tool definitions
const createEntitiesTools: Tool = {
  description: 'Create multiple new entities in the knowledge graph',
  handler: async (params: any) => {
    return await knowledgeGraphManager.createEntities(params.entities);
  },
  id: 'create_entities',
  name: 'Create Entities',
  parameters: [
    {
      description: 'Array of entities to create',
      name: 'entities',
      required: true,
      schema: {
        properties: {
          entityType: { description: 'Entity type', type: 'string' },
          name: { description: 'Entity name', type: 'string' },
          observations: {
            description: 'Entity observations',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: ['name', 'entityType', 'observations'],
        type: 'object',
      },
      type: 'array',
    },
  ],
  returnType: 'object',
};

const createRelationsTool: Tool = {
  description:
    'Create multiple new relations between entities in the knowledge graph',
  handler: async (params: any) => {
    return await knowledgeGraphManager.createRelations(params.relations);
  },
  id: 'create_relations',
  name: 'Create Relations',
  parameters: [
    {
      description: 'Array of relations to create',
      name: 'relations',
      required: true,
      schema: {
        properties: {
          from: { description: 'Source entity name', type: 'string' },
          relationType: { description: 'Relation type', type: 'string' },
          to: { description: 'Target entity name', type: 'string' },
        },
        required: ['from', 'to', 'relationType'],
        type: 'object',
      },
      type: 'array',
    },
  ],
  returnType: 'object',
};

const addObservationsTool: Tool = {
  description: 'Add new observations to existing entities',
  handler: async (params: any) => {
    return await knowledgeGraphManager.addObservations(params.observations);
  },
  id: 'add_observations',
  name: 'Add Observations',
  parameters: [
    {
      description: 'Array of observations to add',
      name: 'observations',
      required: true,
      schema: {
        properties: {
          contents: {
            description: 'Observation contents',
            items: { type: 'string' },
            type: 'array',
          },
          entityName: { description: 'Entity name', type: 'string' },
        },
        required: ['entityName', 'contents'],
        type: 'object',
      },
      type: 'array',
    },
  ],
  returnType: 'object',
};

const deleteEntitiesTools: Tool = {
  description: 'Delete multiple entities and their relations',
  handler: async (params: any) => {
    await knowledgeGraphManager.deleteEntities(params.entityNames);
    return 'Entities deleted successfully';
  },
  id: 'delete_entities',
  name: 'Delete Entities',
  parameters: [
    {
      description: 'Array of entity names to delete',
      items: { type: 'string' },
      name: 'entityNames',
      required: true,
      type: 'array',
    },
  ],
  returnType: 'string',
};

const deleteObservationsTool: Tool = {
  description: 'Delete specific observations from entities',
  handler: async (params: any) => {
    await knowledgeGraphManager.deleteObservations(params.deletions);
    return 'Observations deleted successfully';
  },
  id: 'delete_observations',
  name: 'Delete Observations',
  parameters: [
    {
      description: 'Array of observation deletions',
      name: 'deletions',
      required: true,
      schema: {
        properties: {
          entityName: { description: 'Entity name', type: 'string' },
          observations: {
            description: 'Observations to delete',
            items: { type: 'string' },
            type: 'array',
          },
        },
        required: ['entityName', 'observations'],
        type: 'object',
      },
      type: 'array',
    },
  ],
  returnType: 'string',
};

const deleteRelationsTool: Tool = {
  description: 'Delete multiple relations',
  handler: async (params: any) => {
    await knowledgeGraphManager.deleteRelations(params.relations);
    return 'Relations deleted successfully';
  },
  id: 'delete_relations',
  name: 'Delete Relations',
  parameters: [
    {
      description: 'Array of relations to delete',
      name: 'relations',
      required: true,
      schema: {
        properties: {
          from: { description: 'Source entity name', type: 'string' },
          relationType: { description: 'Relation type', type: 'string' },
          to: { description: 'Target entity name', type: 'string' },
        },
        required: ['from', 'to', 'relationType'],
        type: 'object',
      },
      type: 'array',
    },
  ],
  returnType: 'string',
};

const readGraphTool: Tool = {
  description: 'Read the entire knowledge graph',
  handler: async () => {
    return await knowledgeGraphManager.readGraph();
  },
  id: 'read_graph',
  name: 'Read Graph',
  parameters: [],
  returnType: 'object',
};

const searchNodesTool: Tool = {
  description: 'Search for nodes in the knowledge graph',
  handler: async (params: any) => {
    return await knowledgeGraphManager.searchNodes(params.query);
  },
  id: 'search_nodes',
  name: 'Search Nodes',
  parameters: [
    {
      description:
        'Search query to match against entity names, types, and observations',
      name: 'query',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'object',
};

const openNodesTool: Tool = {
  description: 'Open specific nodes by their names',
  handler: async (params: any) => {
    return await knowledgeGraphManager.openNodes(params.names);
  },
  id: 'open_nodes',
  name: 'Open Nodes',
  parameters: [
    {
      description: 'Array of entity names to retrieve',
      items: { type: 'string' },
      name: 'names',
      required: true,
      type: 'array',
    },
  ],
  returnType: 'object',
};

const tools = [
  createEntitiesTools,
  createRelationsTool,
  addObservationsTool,
  deleteEntitiesTools,
  deleteObservationsTool,
  deleteRelationsTool,
  readGraphTool,
  searchNodesTool,
  openNodesTool,
];

export { tools };
