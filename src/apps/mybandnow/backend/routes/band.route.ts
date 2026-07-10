import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import container from '../config/dependency-injection/index.js';

export async function bandPostCreate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.BandPostCreateController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}

export async function bandPutUpdate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.BandPutUpdateController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}

export async function bandDeleteRemove(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.BandDeleteRemoveController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}

export async function bandGetSearch(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.BandGetSearchController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}

export async function bandGetMatchByCriteria(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.BandGetMatchByCriteriaController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}
