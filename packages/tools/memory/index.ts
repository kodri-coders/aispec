import { Tool } from "@aispec/tool-types";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define the path to the memory file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_FILE_PATH = path.join(__dirname, 'memory.json');

// Type definitions
interface Entity {
  name: string;
  entityType: string;
  observations: string[];
}

interface Relation {
  from: string;
  to: string;
  relationType: string;
}

interface KnowledgeGraph {
  entities: Entity[];
  relations: Relation[];
}

// The KnowledgeGraphManager class manages all operations on the knowledge graph
class KnowledgeGraphManager {
  private async loadGraph(): Promise<KnowledgeGraph> {
    try {
      const data = await fs.readFile(MEMORY_FILE_PATH, "utf-8");
      const lines = data.split("\n").filter(line => line.trim() !== "");
      return lines.reduce((graph: KnowledgeGraph, line) => {
        const item = JSON.parse(line);
        if (item.type === "entity") graph.entities.push(item as Entity);
        if (item.type === "relation") graph.relations.push(item as Relation);
        return graph;
      }, { entities: [], relations: [] });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as any).code === "ENOENT") {
        return { entities: [], relations: [] };
      }
      throw error;
    }
  }

  private async saveGraph(graph: KnowledgeGraph): Promise<void> {
    const lines = [
      ...graph.entities.map(e => JSON.stringify({ type: "entity", ...e })),
      ...graph.relations.map(r => JSON.stringify({ type: "relation", ...r })),
    ];
    await fs.writeFile(MEMORY_FILE_PATH, lines.join("\n"));
  }

  async createEntities(entities: Entity[]): Promise<Entity[]> {
    const graph = await this.loadGraph();
    const newEntities = entities.filter(e => !graph.entities.some(existingEntity => existingEntity.name === e.name));
    graph.entities.push(...newEntities);
    await this.saveGraph(graph);
    return newEntities;
  }

  async createRelations(relations: Relation[]): Promise<Relation[]> {
    const graph = await this.loadGraph();
    const newRelations = relations.filter(r => !graph.relations.some(existingRelation => 
      existingRelation.from === r.from && 
      existingRelation.to === r.to && 
      existingRelation.relationType === r.relationType
    ));
    graph.relations.push(...newRelations);
    await this.saveGraph(graph);
    return newRelations;
  }

  async addObservations(observations: { entityName: string; contents: string[] }[]): Promise<{ entityName: string; addedObservations: string[] }[]> {
    const graph = await this.loadGraph();
    const results = observations.map(o => {
      const entity = graph.entities.find(e => e.name === o.entityName);
      if (!entity) {
        throw new Error(`Entity with name ${o.entityName} not found`);
      }
      const newObservations = o.contents.filter(content => !entity.observations.includes(content));
      entity.observations.push(...newObservations);
      return { entityName: o.entityName, addedObservations: newObservations };
    });
    await this.saveGraph(graph);
    return results;
  }

  async deleteEntities(entityNames: string[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.entities = graph.entities.filter(e => !entityNames.includes(e.name));
    graph.relations = graph.relations.filter(r => !entityNames.includes(r.from) && !entityNames.includes(r.to));
    await this.saveGraph(graph);
  }

  async deleteObservations(deletions: { entityName: string; observations: string[] }[]): Promise<void> {
    const graph = await this.loadGraph();
    deletions.forEach(d => {
      const entity = graph.entities.find(e => e.name === d.entityName);
      if (entity) {
        entity.observations = entity.observations.filter(o => !d.observations.includes(o));
      }
    });
    await this.saveGraph(graph);
  }

  async deleteRelations(relations: Relation[]): Promise<void> {
    const graph = await this.loadGraph();
    graph.relations = graph.relations.filter(r => !relations.some(delRelation => 
      r.from === delRelation.from && 
      r.to === delRelation.to && 
      r.relationType === delRelation.relationType
    ));
    await this.saveGraph(graph);
  }

  async readGraph(): Promise<KnowledgeGraph> {
    return this.loadGraph();
  }

  async searchNodes(query: string): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const filteredEntities = graph.entities.filter(e => 
      e.name.toLowerCase().includes(query.toLowerCase()) ||
      e.entityType.toLowerCase().includes(query.toLowerCase()) ||
      e.observations.some(o => o.toLowerCase().includes(query.toLowerCase()))
    );
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }

  async openNodes(names: string[]): Promise<KnowledgeGraph> {
    const graph = await this.loadGraph();
    const filteredEntities = graph.entities.filter(e => names.includes(e.name));
    const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
    const filteredRelations = graph.relations.filter(r => 
      filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to)
    );
    return {
      entities: filteredEntities,
      relations: filteredRelations,
    };
  }
}

// Create a singleton instance
const knowledgeGraphManager = new KnowledgeGraphManager();

// Tool definitions
const createEntitiesTools: Tool = {
  id: 'create_entities',
  name: 'Create Entities',
  description: 'Create multiple new entities in the knowledge graph',
  parameters: [
    {
      name: 'entities',
      type: 'array',
      description: 'Array of entities to create',
      required: true,
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Entity name' },
          entityType: { type: 'string', description: 'Entity type' },
          observations: { type: 'array', items: { type: 'string' }, description: 'Entity observations' }
        },
        required: ['name', 'entityType', 'observations']
      }
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await knowledgeGraphManager.createEntities(params.entities);
  },
};

const createRelationsTool: Tool = {
  id: 'create_relations',
  name: 'Create Relations',
  description: 'Create multiple new relations between entities in the knowledge graph',
  parameters: [
    {
      name: 'relations',
      type: 'array',
      description: 'Array of relations to create',
      required: true,
      schema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source entity name' },
          to: { type: 'string', description: 'Target entity name' },
          relationType: { type: 'string', description: 'Relation type' }
        },
        required: ['from', 'to', 'relationType']
      }
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await knowledgeGraphManager.createRelations(params.relations);
  },
};

const addObservationsTool: Tool = {
  id: 'add_observations',
  name: 'Add Observations',
  description: 'Add new observations to existing entities',
  parameters: [
    {
      name: 'observations',
      type: 'array',
      description: 'Array of observations to add',
      required: true,
      schema: {
        type: 'object',
        properties: {
          entityName: { type: 'string', description: 'Entity name' },
          contents: { type: 'array', items: { type: 'string' }, description: 'Observation contents' }
        },
        required: ['entityName', 'contents']
      }
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await knowledgeGraphManager.addObservations(params.observations);
  },
};

const deleteEntitiesTools: Tool = {
  id: 'delete_entities',
  name: 'Delete Entities',
  description: 'Delete multiple entities and their relations',
  parameters: [
    {
      name: 'entityNames',
      type: 'array',
      description: 'Array of entity names to delete',
      required: true,
      items: { type: 'string' }
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    await knowledgeGraphManager.deleteEntities(params.entityNames);
    return 'Entities deleted successfully';
  },
};

const deleteObservationsTool: Tool = {
  id: 'delete_observations',
  name: 'Delete Observations',
  description: 'Delete specific observations from entities',
  parameters: [
    {
      name: 'deletions',
      type: 'array',
      description: 'Array of observation deletions',
      required: true,
      schema: {
        type: 'object',
        properties: {
          entityName: { type: 'string', description: 'Entity name' },
          observations: { type: 'array', items: { type: 'string' }, description: 'Observations to delete' }
        },
        required: ['entityName', 'observations']
      }
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    await knowledgeGraphManager.deleteObservations(params.deletions);
    return 'Observations deleted successfully';
  },
};

const deleteRelationsTool: Tool = {
  id: 'delete_relations',
  name: 'Delete Relations',
  description: 'Delete multiple relations',
  parameters: [
    {
      name: 'relations',
      type: 'array',
      description: 'Array of relations to delete',
      required: true,
      schema: {
        type: 'object',
        properties: {
          from: { type: 'string', description: 'Source entity name' },
          to: { type: 'string', description: 'Target entity name' },
          relationType: { type: 'string', description: 'Relation type' }
        },
        required: ['from', 'to', 'relationType']
      }
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    await knowledgeGraphManager.deleteRelations(params.relations);
    return 'Relations deleted successfully';
  },
};

const readGraphTool: Tool = {
  id: 'read_graph',
  name: 'Read Graph',
  description: 'Read the entire knowledge graph',
  parameters: [],
  returnType: 'object',
  handler: async () => {
    return await knowledgeGraphManager.readGraph();
  },
};

const searchNodesTool: Tool = {
  id: 'search_nodes',
  name: 'Search Nodes',
  description: 'Search for nodes in the knowledge graph',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Search query to match against entity names, types, and observations',
      required: true,
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await knowledgeGraphManager.searchNodes(params.query);
  },
};

const openNodesTool: Tool = {
  id: 'open_nodes',
  name: 'Open Nodes',
  description: 'Open specific nodes by their names',
  parameters: [
    {
      name: 'names',
      type: 'array',
      description: 'Array of entity names to retrieve',
      required: true,
      items: { type: 'string' }
    }
  ],
  returnType: 'object',
  handler: async (params: any) => {
    return await knowledgeGraphManager.openNodes(params.names);
  },
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
