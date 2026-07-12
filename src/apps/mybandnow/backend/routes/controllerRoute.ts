import type { Request, Response, NextFunction } from 'express';
import type { Context } from 'openapi-backend';
import container from '../config/dependency-injection/index.js';
import ApiController from '../../../../Contexts/Shared/infrastructure/Express/ApiController.js';
import { RequireMusicianProfileMiddleware } from '../middlewares/RequireMusicianProfileMiddleware.js';

type RouteMiddlewareId = 'Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware';

export async function runController(
  controllerId: string,
  context: Context,
  req: Request,
  res: Response,
  next: NextFunction,
  middlewareIds: RouteMiddlewareId[] = []
): Promise<void> {
  try {
    for (const middlewareId of middlewareIds) {
      const middleware = container.get<RequireMusicianProfileMiddleware>(middlewareId);
      await middleware.run(context);
    }

    const controller = container.get<ApiController>(controllerId);
    await controller.run(context, req, res);
  } catch (error) {
    next(error);
  }
}
