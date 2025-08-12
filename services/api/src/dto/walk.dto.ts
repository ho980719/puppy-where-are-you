import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const WalkStartSchema = z.object({
  userId: z.string().min(1),
  note: z.string().optional(),
});
export class WalkStartDto extends createZodDto(WalkStartSchema) {}

export const WalkPointSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  recordedAt: z.coerce.date().optional(),
});

export const WalkAppendSchema = z.object({
  points: z.array(WalkPointSchema).min(1),
});
export class WalkAppendDto extends createZodDto(WalkAppendSchema) {}

export const WalkListQuerySchema = z.object({
  userId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().optional(),
});
export class WalkListQueryDto extends createZodDto(WalkListQuerySchema) {}

export const WalkGetQuerySchema = z.object({
  includePoints: z.coerce.boolean().optional().default(false),
  pointsLimit: z.coerce.number().int().min(1).max(5000).optional(),
});
export class WalkGetQueryDto extends createZodDto(WalkGetQuerySchema) {}
