import { KeyboardEvent } from 'react'

/**
 * MUI's ButtonBase only emulates Space activation for non-native roots, and an
 * anchor carrying an href is not one, so Space on a link-rendered tab would
 * only scroll the page while the WAI-ARIA tabs pattern requires it to activate.
 */
export const spaceActivatesAnchorProps = {
  onKeyDown: (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === ' ' && event.target === event.currentTarget) {
      event.preventDefault()
    }
  },
  onKeyUp: (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === ' ' && event.target === event.currentTarget) {
      event.currentTarget.click()
    }
  },
}
