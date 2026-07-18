import { HandlerMap } from 'openapi-backend';
import * as user from './user.route.js';
import * as musician from './musician.route.js';
import * as band from './band.route.js';
import * as song from './song.route.js';
import * as songInstrument from './songInstrument.route.js';
import * as songInstrumentUpload from './songInstrumentUpload.route.js';
import * as instruments from './instruments.route.js';

export const routes: HandlerMap = {
  // Routes
  ...user,
  ...musician,
  ...band,
  ...song,
  ...songInstrument,
  ...songInstrumentUpload,
  ...instruments
};
