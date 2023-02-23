import { createTheme } from '@mui/material/styles'

import { palette } from './colorsPalette'

export const MAX_WIDTH = 1600
export const NAV_HEIGHT = 72
export const HEADER_TABLE_HEIGHT = 48
export const INNER_CONTENT_WIDTH = 672

const typographyBody = {
  fontSize: '16px',
  lineHeight: '28px',
  fontWeight: 400,
}

const typographyCaption = {
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: 400,
}

export const theme = createTheme({
  spacing: 4, // Base 4 --> [0, 4, 8, 12, 16...], only following indexes are authorized: 1,2,3,4,5,6,8,10,12
  palette,
  breakpoints: {
    // There's only one real breakpoint, so only use md
    values: {
      xs: 0,
      sm: 0,
      md: 776,
      lg: MAX_WIDTH,
      xl: MAX_WIDTH,
    },
  },
  shape: {
    borderRadius: 12, // Default is 4 but can be 12px
  },
  components: {
    MuiLink: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: {
          '&.Mui-focusVisible': {
            boxShadow: `0px 0px 0px 4px ${palette.primary[200]}`,
            borderRadius: 4,
            outline: 'none',
          },
          '&:visited': {
            color: palette.info.main,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          textOverflow: 'ellipsis',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          transition:
            'background-color 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms,border 250ms cubic-bezier(0.4, 0, 0.2, 1) 0ms',
          '&:hover:not(.Mui-focused)': {
            backgroundColor: palette.grey[100],
          },
          '&.Mui-focused': {
            outline: 'none',
            boxShadow: `0px 0px 0px 4px ${palette.primary[200]} !important`,
          },
          '&.Mui-disabled': {
            backgroundColor: palette.grey[100],
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: palette.grey[300],
            },
            '& input': {
              color: palette.grey[600],
              '-webkit-text-fill-color': 'inherit',
            },
            '.MuiInputAdornment-root, .MuiInputAdornment-root > *': {
              color: palette.grey[400],
            },
          },
          '& .MuiInputAdornment-positionStart': {
            paddingLeft: '16px',
          },
          '& .MuiInputBase-inputAdornedStart': {
            paddingLeft: '8px',
          },
          '& .MuiInputBase-inputAdornedEnd': {
            paddingRight: '0px',
          },
          '.MuiInputAdornment-positionEnd': {
            marginRight: '16px',
          },
        },
        adornedEnd: {
          paddingRight: 0,
          '& .MuiButton-root': {
            '& .svg-icon': {
              padding: '0',
            },
          },
          '& .MuiInputAdornment-positionEnd': {
            '& .svg-icon': {
              padding: '0 0 0 0',
            },
          },
        },
        adornedStart: {
          paddingLeft: '0',
          '& .MuiInputAdornment-positionStart': {
            marginRight: '0',
          },
          '& .MuiButton-root': {
            marginLeft: '4px',
            '& .svg-icon': {
              padding: '0',
            },
          },
          '& .MuiInputAdornment-positionStart .svg-icon': {
            padding: '0 12px 0 16px',
          },
        },
        input: {
          ...typographyBody,
          height: '48px',
          boxSizing: 'border-box',
          padding: '10px 16px',
          color: palette.grey[700],
          '&::placeholder': {
            color: palette.grey[500],
            opacity: 1,
          },
          '&.Mui-disabled': {
            backgroundColor: palette.grey[100],
            borderRadius: 12,
            color: palette.grey[600],
            '&::placeholder': {
              color: palette.grey[400],
            },
          },
        },
        multiline: {
          padding: '10px 16px',
          '&.Mui-disabled': {
            backgroundColor: palette.grey[100],
            borderRadius: 12,
            '&::placeholder': {
              color: palette.grey[400],
            },
          },
          textarea: {
            padding: 0,
          },
        },
        notchedOutline: {
          borderColor: palette.grey[500],
          borderWidth: '1px !important',
          '&:hover': {
            borderColor: palette.grey[600],
          },
          '&:focus, &:active': {
            borderColor: palette.primary.main,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...typographyCaption,
          backgroundColor: palette.grey[700],
          padding: '12px 16px',
        },
        // MUI positions poppers using CSS, per position
        // !important is ugly, but required
        tooltipPlacementBottom: {
          marginTop: '8px !important',
        },
        tooltipPlacementTop: {
          marginBottom: '8px !important',
        },
        tooltipPlacementLeft: {
          marginRight: '8px !important',
        },
        tooltipPlacementRight: {
          marginLeft: '8px !important',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          padding: 8,
          // 5 items of an height of 56px (see ComboBox.tsx) with paddings
          maxHeight: 5 * 56 + 4 * 4,
          overflow: 'auto',
          scrollBehavior: 'smooth',
        },
        loading: { padding: 0 },
        listbox: {
          padding: 0,
        },
        root: {
          '.MuiOutlinedInput-root': {
            padding: '0 0 0 0 !important',
            '&.Mui-disabled': {
              backgroundColor: palette.grey[100],

              '.MuiInputAdornment-root': {
                color: palette.grey[400],
              },
            },
          },
        },
        option: {
          paddingLeft: 0,
          paddingRight: 0,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: '12px',
          height: '56px',
          '&.Mui-focused': {
            backgroundColor: `${palette.grey[100]} !important`,
          },
          '&[aria-selected="true"]': {
            backgroundColor: `${palette.primary[100]} !important`,
            '&[aria-disabled="true"]': {
              opacity: '1 !important',
            },
            '&.Mui-focused': {
              backgroundColor: `${palette.primary[200]} !important`,
            },
          },
        },
        noOptions: {
          color: palette.grey[500],
        },
      },
    },
  },
  typography: {
    fontFamily: 'Inter, Arial , Verdana , Helvetica , sans-serif',
    headline: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 700,
    },
    h1: undefined,
    subhead: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 600,
    },
    captionCode: {
      fontFamily: 'IBM Plex Mono, monospace',
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '20px',
    },
    h2: undefined,
    bodyHl: {
      fontSize: '16px',
      lineHeight: '28px',
      fontWeight: 500,
    },
    body2: undefined,
    body: {
      ...typographyBody,
    },
    body1: undefined,
    captionHl: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
    },
    subtitle1: undefined,
    caption: {
      ...typographyCaption,
    },
    note: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 600,
      textTransform: 'none',
    },
    overline: undefined,
    button: {
      fontSize: '16px',
      lineHeight: '28px',
      fontWeight: 400,
      textTransform: 'none',
    },
  },
  zIndex: {
    tooltip: 2400,
    toast: 2200,
    dialog: 2000,
    popper: 1800,
    drawer: 1600,
    navBar: 1200,
    sectionHead: 1000,
  },
  shadows: [
    'none',
    '0px 2px 4px 0px rgba(25, 33, 46, 0.2)',
    '0px 6px 8px 0px rgba(25, 33, 46, 0.12)',
    '0px 10px 16px 0px rgba(25, 33, 46, 0.1)',
    '0px 16px 24px 0px rgba(25, 33, 46, 0.1)',
    // Next one (shadows[5]) is only used as top divider
    `0px 1px 0px 0px ${palette.divider} inset`,
    // Next one (shadows[6]) is only used as right divider
    `-1px 0px 0px 0px ${palette.divider} inset`,
    // Next one (shadows[7]) is only used as bottom divider
    `0px -1px 0px 0px ${palette.divider} inset`,
    // Next one (shadows[8]) is only used as left divider
    `1px 0px 0px 0px ${palette.divider} inset`,
    // The following are not used but needs to be set for MUI - Those are the default values
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
    '0px 9px 12px -6px rgba(0,0,0,0.2),0px 19px 29px 2px rgba(0,0,0,0.14),0px 7px 36px 6px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 20px 31px 3px rgba(0,0,0,0.14),0px 8px 38px 7px rgba(0,0,0,0.12)',
    '0px 10px 13px -6px rgba(0,0,0,0.2),0px 21px 33px 3px rgba(0,0,0,0.14),0px 8px 40px 7px rgba(0,0,0,0.12)',
  ],
})
