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
