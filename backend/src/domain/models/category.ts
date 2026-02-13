export const CATEGORY_SLUGS = ["llm", "backend", "frontend"] as const;

export type CategorySlug = (typeof CATEGORY_SLUGS)[number];
