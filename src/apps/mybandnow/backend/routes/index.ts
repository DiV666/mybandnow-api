import { HandlerMap } from 'openapi-backend';
import * as user from './user.route.js';
import * as musician from './musician.route.js';
import * as band from './band.route.js';

export const routes: HandlerMap = {
  // Routes
  ...user,
  ...musician,
  ...band
};
