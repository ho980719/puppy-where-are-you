import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PlaceSearchSchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radius: z.coerce.number().optional(),
  tags: z
    .string()
    .transform((s) => s.split(',').map((t) => t.trim()).filter(Boolean))
    .optional(),
  petFriendly: z.coerce.boolean().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  cursor: z.string().optional(),
});

export class PlaceSearchQueryDto extends createZodDto(PlaceSearchSchema) {}
