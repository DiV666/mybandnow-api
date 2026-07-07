export default {
  parallel: 1,
  // format: ['html:cucumber-report.html'],
  publish: false,
  // Se usa el loader de ESM para ts-node en lugar de `requireModule` que es para CommonJS.
  // Esto permite que Cucumber importe correctamente los archivos de steps en TypeScript.
  // Path aliases (@Contexts, @Apps, @Test) are resolved by loader.mjs
  loader: ['ts-node/esm', './loader.mjs'],
  paths: [
    'test/acceptance/features/**/*.feature'
  ],
  import: ['test/acceptance/config/bootstrap.ts', 'test/acceptance/step_definitions/**/*.ts']
}
