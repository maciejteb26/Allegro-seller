import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const tree = await categoryService.getCategoryTree();
    res.json(tree);
  } catch (err) {
    next(err);
  }
}

export async function getCategoryMappings(req: Request, res: Response, next: NextFunction) {
  try {
    const mappings = await categoryService.getCategoryMappingsExport();
    res.json(mappings);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleMakes(req: Request, res: Response, next: NextFunction) {
  try {
    const { type } = req.query;
    const makes = await categoryService.getVehicleMakes(type as string | undefined);
    res.json(makes);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleModels(req: Request, res: Response, next: NextFunction) {
  try {
    const models = await categoryService.getVehicleModels(req.params.makeId);
    res.json(models);
  } catch (err) {
    next(err);
  }
}

export async function getVehicleGenerations(req: Request, res: Response, next: NextFunction) {
  try {
    const generations = await categoryService.getVehicleGenerations(req.params.modelId);
    res.json(generations);
  } catch (err) {
    next(err);
  }
}
