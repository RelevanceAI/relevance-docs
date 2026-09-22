import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { z } from 'astro:content';

export const collections = {
  docs: defineCollection({
    loader: docsLoader(),
    // Extend Starlight's schema to tolerate Mintlify's own frontmatter keys
    // instead of rejecting them. This is what turns silent Mintlify quirks
    // into build-time errors.
    schema: docsSchema({
      extend: z.object({
        sidebarTitle: z.string().optional(),
        sidebardTitle: z.string().optional(), // known typo in one file
        mode: z.enum(['wide', 'custom', 'center']).optional(),
        icon: z.string().optional(),
        tag: z.string().optional(),
        api: z.string().optional(),
      }),
    }),
  }),
};
