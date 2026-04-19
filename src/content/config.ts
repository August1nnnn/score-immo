import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'data',
  schema: z.object({
    id: z.string(),
    title: z.string(),
    handle: z.string(),
    blog: z.enum(['guides', 'villes', 'quartiers']),
    body_html: z.string(),
    summary_html: z.string().nullable().optional(),
    author: z.string().default('ScoreImmo'),
    published_at: z.string(),
    updated_at: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string().nullable().optional(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
    }).nullable().optional(),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
  }),
});

export const collections = { articles };
