import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import { runController } from './controllerRoute.js';

export async function userPostRegister(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.UserPostRegisterController', context, req, res, next);
}

export async function userPostLogin(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  await runController('Apps.Mybandnow.Backend.controllers.UserPostLoginController', context, req, res, next);
}
