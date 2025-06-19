import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

/**
 * Vite configuration for building a React component library
 */
export default defineConfig({
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
      svgrOptions: {
        plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
        svgoConfig: {
          plugins: [
            {
              name: 'prefixIds',
              params: {
                prefixIds: false,
                prefixClassNames: false,
              },
            },
          ],
        },
      },
    }),
  ],
  publicDir: path.resolve(__dirname, 'public'),
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'LagoDesignSystem',
      fileName: 'index',
      formats: ['es'],
    },
    emptyOutDir: false,
    rollupOptions: {
      output: {
        format: 'es',
        entryFileNames: 'index.js',
        assetFileNames: 'style.css',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          '@mui/material': 'MaterialUI',
          '@mui/styled-engine': 'MaterialUIStyledEngine',
          '@mui/x-date-pickers': 'MaterialUIXDatePickers',
        },
      },
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/styled-engine',
        '@mui/x-date-pickers',
      ],
    },
    cssCodeSplit: false,
  },
})
