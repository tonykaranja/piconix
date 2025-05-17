import { z } from 'zod';


const baseZodSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	inactive: z.boolean().optional(),
});
export const baseSchema = baseZodSchema.shape;

export const defaultOmits = {
	createdAt: true,
	updatedAt: true,
	inactive: true,
} as const;



// @see: https://github.com/colinhacks/zod#json-type
const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];
export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
	z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);
// and instead of passthrough use `.and(jsonSchema)`
// const schema = z
// 	.object({
// 		...baseSchema,
// 		name: z.string(),
// 	})
// 	.and(jsonSchema);
