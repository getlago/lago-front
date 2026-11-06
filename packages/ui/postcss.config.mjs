import autoprefixer from 'autoprefixer'
import postcssPresetEnv from 'postcss-preset-env'
import tailwindcss from 'tailwindcss'

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: [postcssPresetEnv, tailwindcss, autoprefixer],
}

export default config
