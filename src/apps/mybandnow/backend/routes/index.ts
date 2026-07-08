import { HandlerMap } from 'openapi-backend';
import * as user from './user.route.js';

export const routes: HandlerMap = {
  // Routes
  ...user
};
