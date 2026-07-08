import { Request, Response, NextFunction } from 'express';
import type { Context as OpenAPIContext } from 'openapi-backend';
import container from '../config/dependency-injection/index.js';

export async function userPostRegister(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.UserPostRegisterController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}

export async function userPostLogin(
  context: OpenAPIContext,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const controller = container.get('Apps.Mybandnow.Backend.controllers.UserPostLoginController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}
