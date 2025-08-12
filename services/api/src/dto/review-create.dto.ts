import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ReviewCreateSchema = z.object({
  userId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  content: z.string().optional().default(''),
  photos: z.array(z.string().url()).optional().default([]),
});

export class ReviewCreateDto extends createZodDto(ReviewCreateSchema) {}
