import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as clientService from '../services/client.service';
import {
  CLIENT_IMPORT_PROFILES,
  CLIENT_SEO_PROMPT_MAX_LENGTH,
  CLIENT_VAT_RATES,
} from '../constants/client.constants';
import { POPULAR_SELLER_DOMAINS } from '../constants/external-search.constants';

const sellerDomainSchema = z.enum(
  POPULAR_SELLER_DOMAINS as unknown as [string, ...string[]],
);

const clientSchema = z.object({
  name: z.string().min(2).max(80),
  vatRate: z.enum(CLIENT_VAT_RATES).optional(),
  issuesInvoices: z.boolean().optional(),
  importProfile: z.enum(CLIENT_IMPORT_PROFILES).optional(),
  seoPrompt: z.string().max(CLIENT_SEO_PROMPT_MAX_LENGTH).nullable().optional(),
  sellerDomains: z.array(sellerDomainSchema).optional(),
  notes: z.string().max(500).nullable().optional(),
});

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

export async function listClients(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await clientService.listClients(userId(req)));
  } catch (error) {
    next(error);
  }
}

export async function createClient(req: Request, res: Response, next: NextFunction) {
  try {
    const body = clientSchema.parse(req.body);
    const client = await clientService.createClient(userId(req), body);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

export async function updateClient(req: Request, res: Response, next: NextFunction) {
  try {
    const body = clientSchema.parse(req.body);
    const client = await clientService.updateClient(userId(req), req.params.id, body);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function deleteClient(req: Request, res: Response, next: NextFunction) {
  try {
    await clientService.deleteClient(userId(req), req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function setActiveClient(req: Request, res: Response, next: NextFunction) {
  try {
    const client = await clientService.setActiveClient(userId(req), req.params.id);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

export async function getActiveClient(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ client: await clientService.getActiveClient(userId(req)) });
  } catch (error) {
    next(error);
  }
}
