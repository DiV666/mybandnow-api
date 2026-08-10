import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import sonarjs from 'eslint-plugin-sonarjs';

export default [
  // Configuración global
  {
    ignores: [
      'node_modules',
      'dist',
      'build-tools',
      'eslint.config.js',
      'cucumber.js',
      'esbuild.config.js',
      'vitest.config.ts'
    ] // Carpetas/archivos a ignorar
  },

  ...tseslint.configs.recommended,

  sonarjs.configs.recommended,

  prettierConfig,

  // Configuración para ficheros TypeScript/JavaScript
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
      parser: tseslint.parser, // Parser de TypeScript
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json' // Requerido para algunas reglas de `typescript-eslint`
      },
      globals: {
        ...globals.node,
        ...globals.es2021 // Equivalente a es6: true y ecmaVersion: 2018
      }
    },
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      // Regla de Prettier para mostrar errores de formato
      'prettier/prettier': 'error',

      // Tus reglas personalizadas (override)
      'no-console': 'error',
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'enumMember',
          format: ['PascalCase', 'UPPER_CASE']
        }
      ],
      '@typescript-eslint/no-var-requires': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',
      // '@typescript-eslint/no-restricted-types': [
      //   'warn',
      //   {
      //     types: [
      //       { type: 'String', message: 'Usa <string> en su lugar', fixWith: 'string' },
      //       { type: 'Boolean', message: 'Usa <boolean> en su lugar', fixWith: 'boolean' },
      //       { type: 'Number', message: 'Usa <number> en su lugar', fixWith: 'number' },
      //       { type: 'Symbol', message: 'Usa <symbol> en su lugar', fixWith: 'symbol' },
      //       { type: 'Function', message: 'El tipo `Function` es inseguro y no ofrece type-safety.' },
      //       { type: 'Object', message: 'Usa <object> en su lugar', fixWith: 'object' },
      //       { type: '{}', message: 'Usa <object> en su lugar', fixWith: 'object' },
      //     ],
      //   },
      // ],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },

  // Bounded context boundaries: a context must not import another context's
  // code directly — only Shared is common ground. Cross-context coordination
  // belongs in src/apps/**/subscribers (domain events) or DI composition.
  //
  // Scoped at today's top-level granularity (Moat/Identity/Orchestrator).
  // When Moat is flattened into its real per-aggregate contexts, this needs
  // one block per resulting context instead of one block for "Moat".
  {
    files: ['src/Contexts/Moat/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@Contexts/Identity/**', '@Contexts/Orchestrator/**'],
              message:
                'Bounded contexts must not import each other directly. Coordinate via domain events (src/apps/**/subscribers) or move the shared port to @Contexts/Shared.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/Contexts/Identity/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@Contexts/Moat/**', '@Contexts/Orchestrator/**'],
              message:
                'Bounded contexts must not import each other directly. Coordinate via domain events (src/apps/**/subscribers) or move the shared port to @Contexts/Shared.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/Contexts/Orchestrator/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@Contexts/Moat/**', '@Contexts/Identity/**'],
              message:
                'Bounded contexts must not import each other directly. Coordinate via domain events (src/apps/**/subscribers) or move the shared port to @Contexts/Shared.'
            }
          ]
        }
      ]
    }
  }
];
