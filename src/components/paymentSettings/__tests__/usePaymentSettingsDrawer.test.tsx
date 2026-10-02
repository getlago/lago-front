import { act, ReactNode } from 'react'

import { ViewTypeEnum } from '~/core/constants/billingObjectViewTypes'
import { PaymentMethodTypeEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { usePaymentSettingsDrawer } from '../usePaymentSettingsDrawer'

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

jest.mock('~/components/drawers/useFocusTrap', () => ({
  focusFirstInput: jest.fn(),
}))

const mockFieldsProps: { current: { error?: string } | null } = { current: null }

jest.mock('~/components/paymentMethodSelection/PaymentMethodFields', () => ({
  PaymentMethodFields: (props: { error?: string }) => {
    mockFieldsProps.current = props

    return <div data-test="pm-fields" />
  },
}))

type UsePaymentSettingsDrawerProps = Parameters<typeof usePaymentSettingsDrawer>[0]
type OpenDrawer = ReturnType<typeof usePaymentSettingsDrawer>['openDrawer']

const captured: { current: OpenDrawer | null } = { current: null }

// The hook has no rendered element of its own, so a throwaway host mounts it
// and hands `openDrawer` back to the test.
const DrawerHost = (props: UsePaymentSettingsDrawerProps) => {
  captured.current = usePaymentSettingsDrawer(props).openDrawer

  return null
}

describe('usePaymentSettingsDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFieldsProps.current = null
    captured.current = null
  })

  const renderDrawer = (onSave = jest.fn(), viewType: ViewTypeEnum = ViewTypeEnum.Subscription) => {
    render(<DrawerHost viewType={viewType} externalCustomerId="ext_1" onSave={onSave} />)

    return { onSave }
  }

  it('mounts without rendering anything and without opening the drawer', () => {
    const { container } = render(
      <DrawerHost
        viewType={ViewTypeEnum.Subscription}
        externalCustomerId="ext_1"
        onSave={jest.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
    expect(mockOpen).not.toHaveBeenCalled()
  })

  it('opens the drawer with the Payment settings title', () => {
    renderDrawer()

    act(() => {
      captured.current?.({
        paymentMethod: { paymentMethodId: null, paymentMethodType: PaymentMethodTypeEnum.Provider },
      })
    })

    expect(mockOpen).toHaveBeenCalledTimes(1)
    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'text_17828013737948943pe3k8nc' }),
    )
  })

  it('uses the contract-specific edit title for contracts', () => {
    renderDrawer(jest.fn(), ViewTypeEnum.Contract)

    act(() => captured.current?.({ paymentMethod: undefined }))

    expect(mockOpen).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'text_1790018785008bkx5wmu4e0b' }),
    )
  })

  it('commits the seeded draft through onSave on submit, then closes', async () => {
    const { onSave } = renderDrawer()

    const seeded = {
      paymentMethod: { paymentMethodId: 'pm_1', paymentMethodType: PaymentMethodTypeEnum.Provider },
    }

    act(() => {
      captured.current?.(seeded)
    })

    const { form } = mockOpen.mock.calls[0][0] as { form: { submit: () => Promise<void> } }

    await act(async () => {
      await form.submit()
    })

    expect(onSave).toHaveBeenCalledWith(seeded)
    expect(mockClose).toHaveBeenCalled()
  })

  it('blocks submit and surfaces the error when "specific" is picked with no method', async () => {
    const { onSave } = renderDrawer()

    act(() => {
      captured.current?.({
        paymentMethod: {
          paymentMethodId: undefined,
          paymentMethodType: PaymentMethodTypeEnum.Provider,
        },
      })
    })

    const opened = mockOpen.mock.calls[0][0] as {
      form: { submit: () => Promise<void> }
      children: ReactNode
    }

    // Mount the drawer content so the field error can surface on the inline
    // fields (drawer.open is mocked, so children isn't rendered otherwise).
    render(<>{opened.children}</>)

    await act(async () => {
      await opened.form.submit()
    })

    expect(onSave).not.toHaveBeenCalled()
    expect(mockClose).not.toHaveBeenCalled()
    expect(mockFieldsProps.current?.error).toBe('text_624ea7c29103fd010732ab7d')
  })
})
