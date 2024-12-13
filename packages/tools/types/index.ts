import { z } from 'zod';

export interface Tool {
  description: string;
  handler: (params: any) => Promise<any>;
  id: string;
  name: string;
  parameters: ToolParameter[];
  returnType: 'array' | 'boolean' | 'number' | 'object' | 'string';
}

export interface ToolParameter {
  // TODO: Figure out if the following properties are needed
  defaultValue?: any;
  description: string;
  items?: any;
  name: string;
  required?: boolean;
  schema?: any;
  type: 'array' | 'boolean' | 'number' | 'object' | 'string';
}

export type ToolParameters = Record<string, any>;

export const ToolParameterSchema = z.object({
  description: z.string(),
  name: z.string(),
  required: z.boolean().default(false),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
});

export const ToolSchema = z.object({
  description: z.string(),
  handler: z.function().args(z.record(z.any())).returns(z.promise(z.any())),
  id: z.string(),
  name: z.string(),
  parameters: z.array(ToolParameterSchema),
  returnType: z.enum(['string', 'number', 'boolean', 'array', 'object']),
});
