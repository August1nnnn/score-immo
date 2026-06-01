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

const barometre = defineCollection({
  type: 'data',
  schema: z.object({
    slug: z.string(),
    ville: z.string(),
    code_postal: z.string(),
    region: z.string(),
    type_bien: z.string(),
    surface: z.number(),
    prix_demande: z.number(),
    prix_m2: z.number().nullable(),
    score_global: z.number(),
    score_sections: z.record(z.number()).default({}),
    dpe: z.string().nullable(),
    points_forts: z.array(z.string()).default([]),
    alertes_cles: z.array(z.string()).default([]),
    verdict: z.string().default(''),
    mois: z.string(),
    is_edito: z.boolean().default(false),
    edito_label: z.string().nullable().optional(),
    date_analyse: z.string(),
  }),
});

export const collections = { articles, authors, barometre };
