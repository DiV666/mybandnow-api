import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

const requireMusicianProfile = ['Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware'] as const;

export async function bandPostCreate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandPostCreateController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandPutUpdate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandPutUpdateController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandSongPostCreate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandSongPostCreateController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandSongGetByBand(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandSongGetByBandController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandMemberPostCreate(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandMemberPostCreateController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandMemberGetByBand(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandMemberGetByBandController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandDeleteRemove(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandDeleteRemoveController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}

export async function bandGetSearch(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandGetSearchController', context, req, res, next);
}

export async function bandGetMatchByCriteria(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.BandGetMatchByCriteriaController', context, req, res, next);
}
