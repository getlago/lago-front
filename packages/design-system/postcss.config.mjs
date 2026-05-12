export default {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {},
    autoprefixer: {},
    ...(process.env.APP_ENV === 'production' && {
      cssnano: {}
    })
  }
}