/* eslint-disable tailwindcss/no-custom-classname */
import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from 'lago-design-system'
import React from 'react'

import { Accordion } from '~/components/designSystem'
import { ComboBox } from '~/components/form'
import { MUI_BUTTON_BASE_ROOT_CLASSNAME } from '~/core/constants/form'

import { scrollToAndClickElement, scrollToAndExpandAccordion, scrollToTop } from '../domUtils'

// Mock setTimeout to control timing in tests
jest.useFakeTimers()

// Mock scrollIntoView and scrollTo since they're not available in jsdom
const mockScrollIntoView = jest.fn()
const mockScrollTo = jest.fn()
const mockClick = jest.fn()

Element.prototype.scrollIntoView = mockScrollIntoView
Element.prototype.scrollTo = mockScrollTo
HTMLElement.prototype.click = mockClick

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

const TestComboboxElement = ({ elementClass }: { elementClass: string }) => {
  return <ComboBox className={elementClass} data={[]} onChange={() => {}} />
}

const TestAppWrapper = ({ children, id }: { children: React.ReactNode; id?: string }) => {
  return (
    <div className="h-[99999px] overflow-hidden" data-app-wrapper id={id}>
      <div className="flex-1 overflow-y-auto" data-scrollable-content>
        {children}
      </div>
    </div>
  )
}

describe('DomUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('scrollToAndExpandAccordion', () => {
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

      // Verify that the click method was called on the first accordion's button
      expect(mockClick).toHaveBeenCalledTimes(1)

      // Verify that the function found the correct accordion
      const firstAccordion = document.getElementById(accordionId1)
      const firstAccordionButton = firstAccordion?.querySelector('[role="button"]')

      expect(firstAccordionButton).toBeInTheDocument()

      // Call function on second accordion to verify independence
      scrollToAndExpandAccordion(accordionId2)
      act(() => {
        jest.advanceTimersByTime(100)
      })

      // Should have been called again for the second accordion
      expect(mockScrollIntoView).toHaveBeenCalledTimes(2)
      expect(mockClick).toHaveBeenCalledTimes(2)
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

  describe('scrollToAndClickElement', () => {
    it('should scroll to element and click it with default delay', () => {
      const testSelector = '.test-element'

      render(<button className="test-element">Test Button</button>)

      scrollToAndClickElement({ selector: testSelector })

      // With default delay of 0, should execute immediately
      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('should scroll to element and click it with custom delay', () => {
      const testSelector = '.test-element-delayed'
      const customDelay = 200

      render(<button className="test-element-delayed">Test Button Delayed</button>)

      scrollToAndClickElement({ selector: testSelector, delay: customDelay })

      // Should not execute before custom delay
      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(mockScrollIntoView).not.toHaveBeenCalled()
      expect(mockClick).not.toHaveBeenCalled()

      // Fast-forward to custom delay
      act(() => {
        jest.advanceTimersByTime(100) // Total: 200ms
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('should handle case when element does not exist', () => {
      const nonExistentSelector = '.non-existent-element'

      render(<div>No button here</div>)

      scrollToAndClickElement({ selector: nonExistentSelector })

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollIntoView).not.toHaveBeenCalled()
      expect(mockClick).not.toHaveBeenCalled()
    })

    it('should execute callback function when provided', () => {
      const testSelector = '.test-element-callback'
      const mockCallback = jest.fn()

      render(<button className="test-element-callback">Test Button with Callback</button>)

      scrollToAndClickElement({
        selector: testSelector,
        callback: mockCallback,
      })

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
      expect(mockClick).toHaveBeenCalledTimes(1)
      expect(mockCallback).toHaveBeenCalledTimes(1)
    })

    it('should work with ComboBox elements', () => {
      const elementClass = 'test-combobox'

      render(<TestComboboxElement elementClass={elementClass} />)

      const selector = `.${elementClass} .${MUI_BUTTON_BASE_ROOT_CLASSNAME}`

      scrollToAndClickElement({ selector })

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple elements with same selector by clicking the first one', () => {
      const testSelector = '.multiple-elements'

      render(
        <div>
          <button className="multiple-elements">First Button</button>
          <button className="multiple-elements">Second Button</button>
        </div>,
      )

      scrollToAndClickElement({ selector: testSelector })

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      })
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    it('should not execute callback when element does not exist', () => {
      const nonExistentSelector = '.non-existent-callback'
      const mockCallback = jest.fn()

      render(<div>No button here</div>)

      scrollToAndClickElement({
        selector: nonExistentSelector,
        callback: mockCallback,
      })

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollIntoView).not.toHaveBeenCalled()
      expect(mockClick).not.toHaveBeenCalled()
      expect(mockCallback).not.toHaveBeenCalled()
    })
  })

  describe('scrollToTop', () => {
    it('should scroll to the top of the page', async () => {
      render(
        <TestAppWrapper>
          <Button
            onClick={() => {
              scrollToTop()
            }}
            data-testid="scroll-test-button"
          >
            Scroll test button
          </Button>
        </TestAppWrapper>,
      )

      await waitFor(() => userEvent.click(screen.getByTestId('scroll-test-button')))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollTo).toHaveBeenCalledWith({
        behavior: 'smooth',
        top: 0,
      })
    })

    it('should scroll to the top of the page with a custom selector', async () => {
      render(
        <TestAppWrapper id="scroll-test-button">
          <Button
            onClick={() => {
              scrollToTop('#scroll-test-button')
            }}
            data-testid="scroll-test-button"
          >
            Scroll test button
          </Button>
        </TestAppWrapper>,
      )

      await waitFor(() => userEvent.click(screen.getByTestId('scroll-test-button')))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollTo).toHaveBeenCalledWith({
        behavior: 'smooth',
        top: 0,
      })
    })

    it('should not scroll if the selector does not exist', async () => {
      render(
        <TestAppWrapper>
          <Button
            onClick={() => {
              scrollToTop('.this-does-not-exist')
            }}
            data-testid="scroll-test-button"
          >
            Scroll test button
          </Button>
        </TestAppWrapper>,
      )

      await waitFor(() => userEvent.click(screen.getByTestId('scroll-test-button')))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollTo).not.toHaveBeenCalled()
    })
  })
})
