import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as orderService from '../services/order.service';

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

export async function getOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const orders = await orderService.getOrders(userId(req));
    res.json(orders);
  } catch (error) {
    next(error);
  }
}
