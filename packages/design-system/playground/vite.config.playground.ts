/* eslint-disable import/order */
import react from '@vitejs/plugin-react'
import * as path from 'path'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

/**
 * Vite configuration for the playground
 * This configuration is used to run the playground for the design system in local development
 */
export default defineConfig({
  root: './playground',
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
  resolve: {
    alias: {
      '~': path.resolve(__dirname, '../src'),
    },
  },
  css: {
    postcss: path.resolve(__dirname, 'postcss.config.js'),
  },
})
