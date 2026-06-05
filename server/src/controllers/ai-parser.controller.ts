import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import * as aiParserService from '../services/ai-parser.service';

const parseInputSchema = z.object({
  input: z.string().min(3).max(500),
});

export async function parseListingInput(req: Request, res: Response, next: NextFunction) {
  try {
    const body = parseInputSchema.parse(req.body);
    const parsed = await aiParserService.parseInput(body.input);
    res.json(parsed);
  } catch (error) {
    next(error);
  }
}
