import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { runController } from './controllerRoute.js';

export async function profileGet(context: Context, req: Request, res: Response, next: NextFunction): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.ProfileGetController', context, req, res, next);
}

export async function profilePost(context: Context, req: Request, res: Response, next: NextFunction): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.ProfilePostController', context, req, res, next);
}
