import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

export async function songInstrumentPostCreate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.SongInstrumentPostCreateController', context, req, res, next);
}

export async function songInstrumentGetMatchByCriteria(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController(
    'Apps.Mybandnow.Backend.controllers.SongInstrumentGetMatchByCriteriaController',
    context,
    req,
    res,
    next
  );
}

export async function songInstrumentGetById(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.SongInstrumentGetByIdController', context, req, res, next);
}

export async function songInstrumentPatchAssign(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController(
    'Apps.Mybandnow.Backend.controllers.SongInstrumentPatchAssignController',
    context,
    req,
    res,
    next
  );
}

export async function songInstrumentPostInvite(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.SongInstrumentPostInviteController', context, req, res, next);
}

export async function songInstrumentPatchVideo(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.SongInstrumentPatchVideoController', context, req, res, next);
}
