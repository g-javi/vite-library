/// <reference types="vitest/config" />

// https://vite.dev/config/
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

const dirName =
  typeof __dirname !== 'undefined' ? __dirname : dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [
    react(),
    dts({
      outDir: 'dist/types',
      insertTypesEntry: true,
      tsconfigPath: './tsconfig.lib.json',
    }),
    libInjectCss(),
  ],
  build: {
    minify: false,
    sourcemap: true,
    emptyOutDir: true,
    cssCodeSplit: true,
    lib: {
      entry: {
        index: resolve(dirName, 'lib/index.ts'),
        'components/index': resolve(dirName, 'lib/components/index.ts'),
        'pages/index': resolve(dirName, 'lib/pages/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (format === 'esm') {
          return `${entryName}.mjs`;
        }

        return `${entryName}.${format}`;
      },
      cssFileName: 'styles',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      // Externalize react/jsx-runtime
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: [
        {
          format: 'esm',
          dir: 'dist/esm',
          preserveModules: true,
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'react/jsx-runtime', // Define global for UMD
          },
        },
        {
          format: 'cjs',
          dir: 'dist/cjs',
          preserveModules: true,
          dynamicImportInCjs: true,
          // Provide global variables to use in the UMD build
          // for externalized deps
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
            'react/jsx-runtime': 'react/jsx-runtime', // Define global for UMD
          },
        },
      ],
    },
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: join(dirName, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [
              {
                browser: 'chromium',
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
});
