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
      '@mui/styled-engine': path.resolve(__dirname, 'node_modules/@mui/styled-engine-sc'),
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
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css'
          return assetInfo.name || ''
        },
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react-router-dom': 'ReactRouterDOM',
          '@mui/material': 'MaterialUI',
          '@mui/styled-engine': 'MaterialUIStyledEngine',
          '@mui/styled-engine-sc': 'MaterialUIStyledEngineSC',
          '@mui/x-date-pickers': 'MaterialUIXDatePickers',
        },
      },
      external: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@mui/styled-engine',
        '@mui/styled-engine-sc',
        '@mui/x-date-pickers',
      ],
    },
    cssCodeSplit: false,
  },
})
