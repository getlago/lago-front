import { mergeConfig, type UserConfig, type UserConfigFn } from 'vite'

import mainConfig from '../vite.config'

export default (async (env) => {
  const resolved =
    typeof mainConfig === 'function'
      ? await (mainConfig as UserConfigFn)(env)
      : (mainConfig as UserConfig)

  return mergeConfig(resolved, {
    build: {
      rollupOptions: {
        output: { manualChunks: undefined },
      },
    },
  })
}) satisfies UserConfigFn
