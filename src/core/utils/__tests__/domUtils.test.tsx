import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import React from 'react'

import { Accordion } from '~/components/designSystem/Accordion'
import { Button } from '~/components/designSystem/Button'
import { ComboBox } from '~/components/form'

import { openAccordionThenScrollTo, scrollToAndClickElement, scrollToTop } from '../domUtils'

// Mock scrollIntoView and scrollTo since they're not available in jsdom
const mockScrollIntoView = jest.fn()
const mockScrollTo = jest.fn()
const mockClick = jest.fn()
const mockFocus = jest.fn()

Element.prototype.scrollIntoView = mockScrollIntoView
Element.prototype.scrollTo = mockScrollTo
HTMLElement.prototype.click = mockClick
HTMLElement.prototype.focus = mockFocus

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
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe('openAccordionThenScrollTo', () => {
    it('opens a collapsed accordion instantly (no anim), then scrolls + focuses once', () => {
      const accordionId = 'open-then-scroll-collapsed'

      render(<TestAccordionComponent accordionId={accordionId} />)

      openAccordionThenScrollTo(accordionId)

      // Open happens synchronously.
      expect(mockClick).toHaveBeenCalledTimes(1)
      // Scroll + focus are deferred to the settle loop.
      expect(mockFocus).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockScrollIntoView).toHaveBeenCalledTimes(1)
      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(mockFocus).toHaveBeenCalledTimes(1)
      expect(mockFocus).toHaveBeenCalledWith({ preventScroll: true, focusVisible: true })
    })

    it('does not click an already-open accordion but still focuses it', () => {
      const accordionId = 'open-then-scroll-open'

      render(<TestAccordionComponent accordionId={accordionId} initiallyOpen={true} />)

      openAccordionThenScrollTo(accordionId)

      expect(mockClick).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(mockFocus).toHaveBeenCalledWith({ preventScroll: true, focusVisible: true })
    })

    it('degrades to a plain scroll for a non-accordion target (no summary to focus)', () => {
      const sectionId = 'open-then-scroll-plain-section'

      render(<section id={sectionId}>Plain section</section>)

      openAccordionThenScrollTo(sectionId)

      expect(mockClick).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
      expect(mockFocus).not.toHaveBeenCalled()
    })

    it('is a no-op when the target element does not exist', () => {
      render(<div>No target here</div>)

      expect(() => openAccordionThenScrollTo('does-not-exist')).not.toThrow()

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockClick).not.toHaveBeenCalled()
      expect(mockScrollIntoView).not.toHaveBeenCalled()
      expect(mockFocus).not.toHaveBeenCalled()
    })

    it('scrolls instantly when behavior is "auto" (crossing a virtualized list)', () => {
      const sectionId = 'open-then-scroll-auto'

      render(<section id={sectionId}>Plain section</section>)

      openAccordionThenScrollTo(sectionId, 'auto')

      act(() => {
        jest.advanceTimersByTime(100)
      })

      expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' })
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

      const selector = `.${elementClass} .MuiButtonBase-root`

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
    it('should scroll to the top of the page', () => {
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

      fireEvent.click(screen.getByTestId('scroll-test-button'))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollTo).toHaveBeenCalledWith({
        behavior: 'smooth',
        top: 0,
      })
    })

    it('should scroll to the top of the page with a custom selector', () => {
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

      fireEvent.click(screen.getByTestId('scroll-test-button'))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollTo).toHaveBeenCalledWith({
        behavior: 'smooth',
        top: 0,
      })
    })

    it('should not scroll if the selector does not exist', () => {
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

      fireEvent.click(screen.getByTestId('scroll-test-button'))

      act(() => {
        jest.advanceTimersByTime(0)
      })

      expect(mockScrollTo).not.toHaveBeenCalled()
    })
  })
})
