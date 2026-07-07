// ESM loader for path aliases resolution
// Based on https://github.com/cucumber/cucumber-js/issues/2403

import { pathToFileURL } from 'url';
import { resolve as resolvePath, join } from 'path';

const baseDir = process.cwd();
const aliases = {
  '@Contexts/': resolvePath(baseDir, 'src/Contexts/'),
  '@Apps/': resolvePath(baseDir, 'src/apps/'),
  '@Test/': resolvePath(baseDir, 'test/'),
};

export async function resolve(specifier, context, nextResolve) {
  for (const [alias, target] of Object.entries(aliases)) {
    if (specifier.startsWith(alias)) {
      // Replace alias with absolute path and .js with .ts
      const relativePath = specifier.slice(alias.length).replace(/\.js$/, '.ts');
      const absolutePath = join(target, relativePath);
      
      return {
        url: pathToFileURL(absolutePath).href,
        shortCircuit: true,
      };
    }
  }

  return nextResolve(specifier, context);
}
