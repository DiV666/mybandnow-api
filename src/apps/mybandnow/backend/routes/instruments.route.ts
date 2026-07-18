import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

export async function instrumentsGetMatchByCriteria(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController(
    'Apps.Mybandnow.Backend.controllers.InstrumentsGetMatchByCriteriaController',
    context,
    req,
    res,
    next
  );
}

export async function instrumentsGetSearch(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.InstrumentsGetSearchController', context, req, res, next);
}
