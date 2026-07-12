import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

const requireMusicianProfile = ['Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware'] as const;

export async function trackPostUpload(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.TrackPostUploadController', context, req, res, next, [
    ...requireMusicianProfile
  ]);
}
