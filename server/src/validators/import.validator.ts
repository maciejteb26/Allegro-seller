import { z } from 'zod';
import { EXTERNAL_SEARCH_SOURCE } from '../constants/external-search.constants';

const allegroProductSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    categoryId: z.string(),
    categoryName: z.string().optional(),
    imageUrl: z.string().optional(),
    gtin: z.string().optional(),
  })
  .nullable();

const externalProductSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    language: z.string().optional(),
    sourceUrl: z.string(),
    sourceName: z.string(),
    imageUrls: z.array(z.string()),
    hits: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
        source: z.enum([
          EXTERNAL_SEARCH_SOURCE.GOOGLE,
          EXTERNAL_SEARCH_SOURCE.SELLER,
          EXTERNAL_SEARCH_SOURCE.SOURCE_LINK,
          EXTERNAL_SEARCH_SOURCE.MOCK,
        ]),
        sellerName: z.string().optional(),
        language: z.string().optional(),
      }),
    ),
  })
  .nullable();

export const importRowSchema = z.object({
  rowIndex: z.number(),
  sourceLink: z.string(),
  identifierRaw: z.string(),
  identifierType: z.enum(['GTIN', 'MPN', 'PHRASE']),
  searchPhrase: z.string(),
  signature: z.string(),
  condition: z.enum(['NEW', 'USED', 'DAMAGED']).nullable(),
  quantity: z.number(),
  packaging: z.string(),
  price: z.number().nullable(),
  delivery: z.string(),
  draftTitle: z.string(),
  notes: z.string(),
});

export const enrichImportSchema = z.object({
  clientId: z.string().optional(),
  rows: z.array(importRowSchema),
});

export const seoImportSchema = z.object({
  clientId: z.string().optional(),
  rows: z.array(
    importRowSchema.extend({
      enrichStatus: z.enum(['pending', 'matched', 'not_found', 'skipped', 'error']).optional(),
      enrichMessage: z.string().optional(),
      allegroProduct: allegroProductSchema.optional(),
      externalProduct: externalProductSchema.optional(),
    }),
  ),
});

export const publishImportSchema = z.object({
  clientId: z.string().optional(),
  rows: z.array(
    importRowSchema.extend({
      enrichStatus: z.enum(['pending', 'matched', 'not_found', 'skipped', 'error']).optional(),
      enrichMessage: z.string().optional(),
      allegroProduct: allegroProductSchema.optional(),
      externalProduct: externalProductSchema.optional(),
      seo: z
        .object({
          title: z.string(),
          description: z.string(),
          titleLength: z.number(),
          mode: z.enum(['AI', 'RULES']),
        })
        .nullable()
        .optional(),
      seoStatus: z.enum(['pending', 'generated', 'skipped', 'error']).optional(),
      seoMessage: z.string().optional(),
    }),
  ),
});
