import type { UserConfig, UserConfigFn } from 'vite'

import mainConfig from '../vite.config'

export default (async (env) => {
  const resolved =
    typeof mainConfig === 'function'
      ? await (mainConfig as UserConfigFn)(env)
      : (mainConfig as UserConfig)

  // cypress-vite forces `output.inlineDynamicImports: true`, which rollup
  // rejects together with `manualChunks`. mergeConfig() ignores `undefined`,
  // so delete the key on the resolved config instead.
  const output = resolved.build?.rollupOptions?.output

  if (output && !Array.isArray(output)) {
    delete output.manualChunks
  }

  return resolved
}) satisfies UserConfigFn
