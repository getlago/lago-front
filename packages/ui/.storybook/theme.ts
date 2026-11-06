import { create } from 'storybook/theming'

// Storybook cannot read CSS variables, so these mirror the light tokens in `src/styles/colors.css`.
export const lagoTheme = create({
  base: 'light',
  brandTitle: 'Lago UI',
  brandImage: '/brand/lago-logo.svg',
  brandTarget: '_self',

  colorPrimary: '#0369CC',
  colorSecondary: '#0369CC',

  appBg: '#FBFBFB',
  appContentBg: '#FFFFFF',
  appPreviewBg: '#FFFFFF',
  appBorderColor: '#ECECEC',
  appBorderRadius: 8,

  fontBase: '"Inter", sans-serif',
  fontCode: '"IBM Plex Mono", monospace',

  textColor: '#1A1A1A',
  textMutedColor: '#525252',
  textInverseColor: '#FFFFFF',

  barBg: '#FFFFFF',
  barTextColor: '#525252',
  barHoverColor: '#0369CC',
  barSelectedColor: '#0369CC',

  inputBg: '#FFFFFF',
  inputBorder: '#909090',
  inputTextColor: '#1A1A1A',
  inputBorderRadius: 8,
})
