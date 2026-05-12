// Tailwind v4: no resolveConfig — screens are defined in CSS.

const SCREENS: Record<string, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

type BreakpointKey = keyof typeof SCREENS

export const getCurrentBreakpoint = (): BreakpointKey => {
  let currentBreakpoint: BreakpointKey = 'sm'
  let biggestBreakpointValue = 0

  for (const [breakpoint, value] of Object.entries(SCREENS) as [BreakpointKey, number][]) {
    if (value > biggestBreakpointValue && window.innerWidth >= value) {
      biggestBreakpointValue = value
      currentBreakpoint = breakpoint
    }
  }

  return currentBreakpoint
}