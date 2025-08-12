export type ApiResponse<T> = { data: T; error?: { code: string; message: string } };
export type PageMeta = { nextCursor?: string | null; total?: number; avgRating?: number | null };
export type Paginated<T> = { items: T[]; meta: PageMeta };
