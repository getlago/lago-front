import { act, fireEvent, screen } from '@testing-library/react'
import { createRef, ReactNode } from 'react'

import { SubscriptionInformationSectionFragment } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  SubscriptionInformationDrawer,
  SubscriptionInformationDrawerRef,
} from '../SubscriptionInformationDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()
const mockHandleSubmit = jest.fn()
const mockResetForm = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/hooks/customer/useUpdateSubscriptionInformation', () => ({
  useUpdateSubscriptionInformation: () => ({
    form: {
      handleSubmit: mockHandleSubmit,
      Subscribe: ({
        selector,
        children,
      }: {
        selector: (state: { canSubmit: boolean }) => boolean
        children: (value: boolean) => ReactNode
      }) => children(selector({ canSubmit: true })),
    },
    resetForm: mockResetForm,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

// Stub the form section: surface the name toggle so we can assert the drawer
// content owns reactive state (the toggle worked only once moved off the outer
// drawer, whose `children` are captured once on open).
jest.mock('~/components/subscriptions/form/SubscriptionInformationFormSection', () => ({
  SubscriptionInformationFormSection: ({
    shouldDisplaySubscriptionName,
    setShouldDisplaySubscriptionName,
  }: {
    shouldDisplaySubscriptionName: boolean
    setShouldDisplaySubscriptionName: (value: boolean) => void
  }) => {
    const React = jest.requireActual('react')

    return React.createElement(
      'div',
      null,
      shouldDisplaySubscriptionName ? 'name-shown' : 'name-hidden',
      React.createElement(
        'button',
        { onClick: () => setShouldDisplaySubscriptionName(true) },
        'add name',
      ),
    )
  },
}))

const subscription = {
  id: 'sub-1',
  externalId: '',
  name: '',
  customer: { id: 'cust-1', applicableTimezone: null },
  plan: { id: 'plan-1', interval: null },
} as unknown as SubscriptionInformationSectionFragment

const renderDrawer = () => {
  const ref = createRef<SubscriptionInformationDrawerRef>()

  render(<SubscriptionInformationDrawer ref={ref} subscription={subscription} />)

  return ref
}

describe('SubscriptionInformationDrawer', () => {
  beforeEach(() => {
    mockOpen.mockClear()
    mockClose.mockClear()
    mockHandleSubmit.mockClear()
    mockResetForm.mockClear()
  })

  it('opens the drawer with the edit title, form id and content', () => {
    const ref = renderDrawer()

    act(() => ref.current?.openDrawer())

    expect(mockResetForm).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledTimes(1)

    const openArgs = mockOpen.mock.calls[0][0]

    expect(openArgs.title).toBe('text_62d7f6178ec94cd09370e63c')
    expect(openArgs.form.id).toBe('subscription-information-drawer-form')
    expect(typeof openArgs.form.submit).toBe('function')
    expect(openArgs.children).toBeDefined()
  })

  it('submits the form from the save action and the form submit handler', () => {
    const ref = renderDrawer()

    act(() => ref.current?.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    render(openArgs.mainAction)
    fireEvent.click(screen.getByRole('button', { name: 'text_17295436903260tlyb1gp1i7' }))
    expect(mockHandleSubmit).toHaveBeenCalledTimes(1)

    openArgs.form.submit()
    expect(mockHandleSubmit).toHaveBeenCalledTimes(2)
  })

  it('reveals the subscription name field when its add button is clicked', () => {
    const ref = renderDrawer()

    act(() => ref.current?.openDrawer())
    const openArgs = mockOpen.mock.calls[0][0]

    render(openArgs.children)

    expect(screen.getByText('name-hidden')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'add name' }))

    expect(screen.getByText('name-shown')).toBeInTheDocument()
  })

  it('closes the drawer via the imperative handle', () => {
    const ref = renderDrawer()

    act(() => ref.current?.closeDrawer())

    expect(mockClose).toHaveBeenCalledTimes(1)
  })
})
