import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

const requireMusicianProfile = ['Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware'] as const;

export async function songInstrumentUploadPostUpload(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController(
    'Apps.Mybandnow.Backend.controllers.SongInstrumentUploadPostUploadController',
    context,
    req,
    res,
    next,
    [...requireMusicianProfile]
  );
}

export async function songInstrumentUploadPostUploadConfirm(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController(
    'Apps.Mybandnow.Backend.controllers.SongInstrumentUploadPostUploadConfirmController',
    context,
    req,
    res,
    next,
    [...requireMusicianProfile]
  );
}

export async function songInstrumentUploadPostUploadCancel(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController(
    'Apps.Mybandnow.Backend.controllers.SongInstrumentUploadPostUploadCancelController',
    context,
    req,
    res,
    next,
    [...requireMusicianProfile]
  );
}
