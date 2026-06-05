import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import * as marginService from '../services/margin.service';

const saveMarginsSchema = z.array(
  z.object({
    platform: z.enum(['ALLEGRO']),
    marginType: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
    marginValue: z.number(),
  }),
);

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

export async function getMargins(req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await marginService.getMarginRules(userId(req));
    res.json(rules);
  } catch (error) {
    next(error);
  }
}

export async function saveMargins(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = saveMarginsSchema.parse(req.body);
    const saved = await Promise.all(payload.map((rule) => marginService.upsertMarginRule(userId(req), rule)));
    res.json(saved);
  } catch (error) {
    next(error);
  }
}
