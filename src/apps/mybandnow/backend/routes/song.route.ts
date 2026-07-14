import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

export async function songGetMatchByCriteria(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.SongGetMatchByCriteriaController', context, req, res, next);
}
