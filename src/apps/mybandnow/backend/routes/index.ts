import { HandlerMap } from 'openapi-backend';
import * as user from './user.route.js';
import * as musician from './musician.route.js';

export const routes: HandlerMap = {
  // Routes
  ...user,
  ...musician
};
