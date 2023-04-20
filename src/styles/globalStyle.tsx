import { GlobalStyles } from '@mui/material'

import { palette } from './colorsPalette'

export const inputGlobalStyles = (
  <GlobalStyles
    styles={{
      'html, body, #root': {
        padding: 0,
        margin: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
      },
      body: {
        fontFamily: 'Inter, Arial , Verdana , Helvetica , sans-serif',
        color: palette.text.primary,
        position: 'relative',
        '-webkit-font-smoothing': 'auto',
        '-moz-osx-font-smoothing': 'auto',
      },
      a: {
        color: palette.primary.main,
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline',
        },
        '&:focus': {
          boxShadow: `0px 0px 0px 4px ${palette.primary[200]}`,
          borderRadius: '4px',
          outline: 'none',
        },
        '&:visited': {
          color: palette.info.main,
        },
      },
      button: {
        fontFamily: 'Inter, Arial , Verdana , Helvetica , sans-serif',
        padding: '6px 12px',
        height: '40px',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        '&:focus, &:active': {
          outline: 'none',
        },
      },
      b: {
        fontSize: '16px',
        lineHeight: '28px',
        fontWeight: 500,
      },
    }}
  />
)
