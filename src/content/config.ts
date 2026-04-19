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
    author: z.string().default('Léa Moreau'),
    author_handle: z.string().default('lea-moreau'),
    published_at: z.string(),
    updated_at: z.string().nullable().optional(),
    last_reviewed: z.string().nullable().optional(),
    tags: z.string().nullable().optional(),
    image: z.object({
      src: z.string(),
      alt: z.string().nullable().optional(),
      width: z.number().nullable().optional(),
      height: z.number().nullable().optional(),
    }).nullable().optional(),
    meta_title: z.string().nullable().optional(),
    meta_description: z.string().nullable().optional(),
    tldr: z.array(z.string()).default([]),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      publisher: z.string().optional(),
    })).default([]),
    word_count: z.number().optional(),
  }),
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    handle: z.string(),
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    expertise: z.array(z.string()),
    years_experience: z.number(),
    avatar_initials: z.string(),
    avatar_color: z.string(),
    linkedin: z.string().optional(),
    published_in: z.array(z.string()).optional(),
  }),
});

export const collections = { articles, authors };
