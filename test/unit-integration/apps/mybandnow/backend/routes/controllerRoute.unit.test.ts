import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import type { Request, Response, NextFunction } from 'express';
import type { Context } from 'openapi-backend';

const { get } = vi.hoisted(() => ({
  get: vi.fn()
}));

vi.mock('../../../../../../src/apps/mybandnow/backend/config/dependency-injection/index.js', () => ({
  default: {
    get
  }
}));

import { runController } from '../../../../../../src/apps/mybandnow/backend/routes/controllerRoute.js';

describe('runController', () => {
  let req: MockProxy<Request>;
  let res: MockProxy<Response>;
  let next: MockProxy<NextFunction>;
  let context: Context;

  beforeEach(() => {
    req = mock<Request>();
    res = mock<Response>();
    next = vi.fn() as unknown as MockProxy<NextFunction>;
    context = { security: { BearerAuth: { userId: 'user-123' } } } as unknown as Context;
    vi.clearAllMocks();
  });

  it('runs the controller directly when the route does not opt in to middleware', async () => {
    // Arrange
    const controller = { run: vi.fn().mockResolvedValue(undefined) };
    get.mockImplementation((id: string) => {
      if (id === 'Apps.Mybandnow.Backend.controllers.BandPostCreateController') {
        return controller;
      }

      throw new Error(`Unexpected service: ${id}`);
    });

    // Act
    await runController('Apps.Mybandnow.Backend.controllers.BandPostCreateController', context, req, res, next);

    // Assert
    expect(get).toHaveBeenCalledTimes(1);
    expect(controller.run).toHaveBeenCalledWith(context, req, res);
    expect(next).not.toHaveBeenCalled();
  });

  it('runs route middleware before the controller when the route opts in', async () => {
    // Arrange
    const middleware = { run: vi.fn().mockResolvedValue(undefined) };
    const controller = { run: vi.fn().mockResolvedValue(undefined) };
    get.mockImplementation((id: string) => {
      if (id === 'Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware') {
        return middleware;
      }

      if (id === 'Apps.Mybandnow.Backend.controllers.BandPostCreateController') {
        return controller;
      }

      throw new Error(`Unexpected service: ${id}`);
    });

    // Act
    await runController('Apps.Mybandnow.Backend.controllers.BandPostCreateController', context, req, res, next, [
      'Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware'
    ]);

    // Assert
    expect(middleware.run).toHaveBeenCalledWith(context);
    expect(controller.run).toHaveBeenCalledWith(context, req, res);
    expect(next).not.toHaveBeenCalled();
  });

  it('forwards middleware errors to next and skips the controller', async () => {
    // Arrange
    const error = new Error('Profile required');
    const middleware = { run: vi.fn().mockRejectedValue(error) };
    const controller = { run: vi.fn() };
    get.mockImplementation((id: string) => {
      if (id === 'Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware') {
        return middleware;
      }

      if (id === 'Apps.Mybandnow.Backend.controllers.BandPostCreateController') {
        return controller;
      }

      throw new Error(`Unexpected service: ${id}`);
    });

    // Act
    await runController('Apps.Mybandnow.Backend.controllers.BandPostCreateController', context, req, res, next, [
      'Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware'
    ]);

    // Assert
    expect(controller.run).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });
});
