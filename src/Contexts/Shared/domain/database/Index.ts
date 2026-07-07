import { Key } from './Key.js';

export interface Index {
  keys: Key[];
  name?: string;
  background?: boolean;
  unique?: boolean;
}
