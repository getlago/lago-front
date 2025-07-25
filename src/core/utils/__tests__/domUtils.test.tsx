import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import React from 'react'

import { Accordion } from '~/components/designSystem'

import { scrollToAndExpandAccordion } from '../domUtils'

// Mock setTimeout to control timing in tests
jest.useFakeTimers()

// Mock scrollIntoView since it's not available in jsdom
const mockScrollIntoView = jest.fn()

Element.prototype.scrollIntoView = mockScrollIntoView

const TestAccordionComponent = ({
  accordionId,
  initiallyOpen = false,
  accordionContent = 'Test Accordion Content',
}: {
  accordionId: string
  initiallyOpen?: boolean
  accordionContent?: React.ReactNode
}) => {
  return (
    <Accordion id={accordionId} summary="Test Accordion Summary" initiallyOpen={initiallyOpen}>
      <div>{accordionContent}</div>
    </Accordion>
  )
}

describe('scrollToAndExpandAccordion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should scroll to accordion element with default delay', async () => {
    const accordionId = 'test-accordion-1'

    render(<TestAccordionComponent accordionId={accordionId} />)

    scrollToAndExpandAccordion(accordionId)

    // Fast-forward time by default delay (100ms)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Verify the accordion element was found and scrolled to
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('should scroll to accordion element with custom delay', async () => {
    const accordionId = 'test-accordion-2'
    const customDelay = 250

    render(<TestAccordionComponent accordionId={accordionId} />)

    scrollToAndExpandAccordion(accordionId, customDelay)

    // Should not execute before custom delay
    act(() => {
      jest.advanceTimersByTime(100)
    })
    expect(mockScrollIntoView).not.toHaveBeenCalled()

    // Fast-forward to custom delay
    act(() => {
      jest.advanceTimersByTime(150) // Total: 250ms
    })

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('should scroll to accordion that is already open', async () => {
    const accordionId = 'test-accordion-3'

    render(<TestAccordionComponent accordionId={accordionId} initiallyOpen={true} />)

    // Verify accordion is initially open (content in DOM)
    expect(screen.getByText('Test Accordion Content')).toBeInTheDocument()

    // Verify accordion summary shows expanded state
    const summary = screen.getByRole('button', { expanded: true })

    expect(summary).toBeInTheDocument()

    scrollToAndExpandAccordion(accordionId)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('should handle case when accordion element does not exist', () => {
    const accordionId = 'non-existent-accordion'

    // Don't render any accordion with this ID
    render(<div>No accordion here</div>)

    scrollToAndExpandAccordion(accordionId)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(mockScrollIntoView).not.toHaveBeenCalled()
  })

  it('should handle case when accordion has no child nodes', () => {
    const accordionId = 'accordion-no-children'

    render(<div id={accordionId} />)

    scrollToAndExpandAccordion(accordionId)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    // No error should be thrown
  })

  it('should handle multiple accordions independently', async () => {
    const accordionId1 = 'test-accordion-multi-1'
    const accordionId2 = 'test-accordion-multi-2'

    render(
      <div>
        <TestAccordionComponent
          accordionId={accordionId1}
          accordionContent="Test Accordion Content 1"
        />
        <TestAccordionComponent
          accordionId={accordionId2}
          accordionContent="Test Accordion Content 2"
        />
      </div>,
    )

    // Verify both accordions are rendered with correct IDs but closed initially
    expect(document.getElementById(accordionId1)).toBeInTheDocument()
    expect(document.getElementById(accordionId2)).toBeInTheDocument()
    expect(screen.queryByText('Test Accordion Content 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Test Accordion Content 2')).not.toBeInTheDocument()

    // Call function on first accordion
    scrollToAndExpandAccordion(accordionId1)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Should have scrolled to the first accordion
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
    expect(mockScrollIntoView).toHaveBeenCalledTimes(1)

    // Verify that the accordion is actually opened by checking if its content is visible
    expect(screen.getByText('Test Accordion Content 1')).toBeInTheDocument()

    // Verify that the second accordion remains closed
    expect(screen.queryByText('Test Accordion Content 2')).not.toBeInTheDocument()
  })

  it('should verify accordion structure and state checking', () => {
    const accordionId = 'test-accordion-structure'

    render(<TestAccordionComponent accordionId={accordionId} />)

    // Verify the accordion element exists and has proper structure
    const accordionElement = document.getElementById(accordionId)

    expect(accordionElement).toBeInTheDocument()

    // The function looks for first child's ariaExpanded property
    const firstChild = accordionElement?.childNodes[0] as HTMLElement

    expect(firstChild).toBeDefined()

    // Call the function
    scrollToAndExpandAccordion(accordionId)
    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Verify scrolling occurred
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })
})
