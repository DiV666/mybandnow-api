import { build, context } from 'esbuild';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatching = !!process.argv.includes('--watch')
const nodePackage = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));

// Simple path alias plugin for ESBuild
const pathAliasPlugin = {
  name: 'path-alias',
  setup(build) {
    // Intercept imports starting with @ and resolve them
    // Replace .js with .ts for source files (ESM convention)
    build.onResolve({ filter: /^@Contexts\// }, args => {
      const importPath = args.path.slice('@Contexts/'.length).replace(/\.js$/, '.ts');
      return { path: resolve(__dirname, 'src/Contexts', importPath) };
    });
    build.onResolve({ filter: /^@Apps\// }, args => {
      const importPath = args.path.slice('@Apps/'.length).replace(/\.js$/, '.ts');
      return { path: resolve(__dirname, 'src/apps', importPath) };
    });
    build.onResolve({ filter: /^@Test\// }, args => {
      const importPath = args.path.slice('@Test/'.length).replace(/\.js$/, '.ts');
      return { path: resolve(__dirname, 'test', importPath) };
    });
  }
};

const buildOptions = {
  entryPoints: [resolve(process.cwd(), 'src', 'apps/mybandnow/backend/start.ts')],
  outfile: resolve(process.cwd(), 'dist', 'start.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  sourcemap: true,
  minify: true,
  keepNames: true,
  plugins: [pathAliasPlugin],
  external: [
    Object.keys(nodePackage.dependencies ?? {}),
    Object.keys(nodePackage.peerDependencies ?? {}),
    Object.keys(nodePackage.devDependencies ?? {}),
  ].flat(),
};

if (isWatching) {
  context(buildOptions).then(ctx => {
    if (isWatching) {
      ctx.watch();
    } else {
      ctx.rebuild();
    }
  });
} else {
  build(buildOptions)
}