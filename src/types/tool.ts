import { z } from 'zod';

export interface ToolParameter {
  name: string;
  type: string | 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  returnType: string | 'string' | 'number' | 'boolean' | 'array' | 'object';
  handler: (params: any) => Promise<any>;
}

export type ToolParameters = Record<string, any>;

export const ToolParameterSchema = z.object({
  name: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  description: z.string(),
  required: z.boolean().default(false),
});

export const ToolSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  parameters: z.array(ToolParameterSchema),
  returnType: z.enum(['string', 'number', 'boolean', 'array', 'object']),
  handler: z.function()
    .args(z.record(z.any()))
    .returns(z.promise(z.any())),
});
