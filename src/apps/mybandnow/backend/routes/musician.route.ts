import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import container from '../config/dependency-injection/index.js';
import ApiController from '../../../../Contexts/Shared/infrastructure/Express/ApiController.js';

export async function profileGet(context: Context, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const controller = container.get<ApiController>('Apps.Mybandnow.Backend.controllers.ProfileGetController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}

export async function profilePost(context: Context, req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const controller = container.get<ApiController>('Apps.Mybandnow.Backend.controllers.ProfilePostController');
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}
