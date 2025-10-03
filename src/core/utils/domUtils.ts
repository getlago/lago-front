/**
 * Scrolls to and expands an accordion element if it's collapsed
 * @param accordionId - The ID of the accordion element to scroll to and expand
 * @param delay - Delay in milliseconds before executing the action (default: 100)
 */
export const scrollToAndExpandAccordion = (accordionId: string, delay: number = 100): void => {
  setTimeout(() => {
    // Make sure the accordion is visible
    const accordion = document.getElementById(accordionId)

    if (!!accordion) {
      accordion.scrollIntoView({ behavior: 'smooth', block: 'start' })

      // Find the AccordionSummary element (which is the clickable part)
      const accordionSummary = accordion.querySelector('[role="button"]') as HTMLElement | null

      if (accordionSummary?.getAttribute('aria-expanded') === 'false') {
        // Use native click method to ensure proper event handling
        accordionSummary.click()
      }
    }
  }, delay)
}

/**
 * Scrolls to and clicks an element
 * @param selector - The selector of the element to scroll to and click
 * @param delay - Delay in milliseconds before executing the action (default: 0)
 * @param callback - Callback function to execute after the element is clicked
 */
export const scrollToAndClickElement = ({
  selector,
  delay = 0,
  callback,
}: {
  selector: string
  delay?: number
  callback?: () => void
}) => {
  setTimeout(() => {
    const element = document.querySelector(selector) as HTMLElement

    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.click()

    callback?.()
  }, delay)
}

/**
 * Scrolls to the top of the element, defaulting to app wrapper
 * @param selector - The selector of the element to scroll to (default: '[data-app-wrapper]')
 */
export const scrollToTop = (selector?: string) => {
  const element = document.querySelector(selector || '[data-app-wrapper]')

  if (!element) return

  setTimeout(() => {
    element.scrollTo({ top: 0, behavior: 'smooth' })
  }, 0)
}
