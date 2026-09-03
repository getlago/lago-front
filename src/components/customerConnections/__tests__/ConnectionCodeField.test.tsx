import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { CONNECTION_CODE_FIELD_TEST_ID, ConnectionCodeField } from '../ConnectionCodeField'
import type { CustomerConnectionDrawerFormApi } from '../CustomerConnectionDrawer'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const formRef: { current: CustomerConnectionDrawerFormApi | null } = { current: null }

const Harness = ({
  defaultValues,
}: {
  defaultValues: { code?: string; providerCode?: string }
}) => {
  const form = useAppForm({ defaultValues })

  formRef.current = form as unknown as CustomerConnectionDrawerFormApi

  return <ConnectionCodeField form={form as unknown as CustomerConnectionDrawerFormApi} />
}

const getInput = (): HTMLInputElement =>
  screen.getByTestId(CONNECTION_CODE_FIELD_TEST_ID).querySelector('input') as HTMLInputElement

const selectProvider = (providerCode: string): void => {
  act(() => {
    formRef.current?.setFieldValue('providerCode', providerCode)
  })
}

const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

describe('ConnectionCodeField', () => {
  beforeEach(() => {
    formRef.current = null
  })

  describe('GIVEN a connection being created', () => {
    describe('WHEN a provider is selected', () => {
      it('THEN should seed the code with the selected connection code', () => {
        render(<Harness defaultValues={{ code: '', providerCode: undefined }} />)

        selectProvider('anrok-1')

        expect(getInput()).toHaveValue('anrok-1')
      })
    })

    describe('WHEN the provider is switched after the seed', () => {
      it('THEN should follow the new connection instead of keeping the replaced code', () => {
        render(<Harness defaultValues={{ code: '', providerCode: undefined }} />)

        selectProvider('anrok-1')
        selectProvider('avalara-1')

        expect(getInput()).toHaveValue('avalara-1')
      })
    })

    describe('WHEN the provider is switched away and back', () => {
      it('THEN should come back to the code the drawer opened on', () => {
        render(<Harness defaultValues={{ code: 'tax-eu', providerCode: 'anrok-1' }} />)

        selectProvider('avalara-1')
        expect(getInput()).toHaveValue('avalara-1')

        selectProvider('anrok-1')
        expect(getInput()).toHaveValue('tax-eu')
      })

      it('THEN should re-seed when the drawer opened without a code', () => {
        render(<Harness defaultValues={{ code: '', providerCode: undefined }} />)

        selectProvider('anrok-1')
        selectProvider('avalara-1')
        selectProvider('anrok-1')

        expect(getInput()).toHaveValue('anrok-1')
      })
    })

    describe('WHEN the user typed a code before switching provider', () => {
      it('THEN should keep what the user typed', async () => {
        render(<Harness defaultValues={{ code: '', providerCode: undefined }} />)

        selectProvider('anrok-1')
        await userEvent.clear(getInput())
        await userEvent.type(getInput(), 'tax-eu')

        selectProvider('avalara-1')

        expect(getInput()).toHaveValue('tax-eu')
      })
    })
  })

  describe('GIVEN a connection opened on a persisted code', () => {
    describe('WHEN the field mounts', () => {
      it('THEN should keep the persisted code', () => {
        render(<Harness defaultValues={{ code: 'payment-eu', providerCode: 'stripe-eu' }} />)

        expect(getInput()).toHaveValue('payment-eu')
      })
    })
  })
  describe('GIVEN a persisted connection with no code', () => {
    describe('WHEN the field mounts', () => {
      it('THEN should seed it from the connection it is attached to', () => {
        render(<Harness defaultValues={{ code: '', providerCode: 'stripe-eu' }} />)

        expect(getInput()).toHaveValue('stripe-eu')
      })
    })
  })

  describe('GIVEN the backend rejected the code as already used', () => {
    describe('WHEN the user edits it', () => {
      it('THEN should clear the error so the form can be submitted again', async () => {
        render(<Harness defaultValues={{ code: 'already-used', providerCode: 'stripe-eu' }} />)

        act(() => {
          formRef.current?.setFieldMeta('code', (meta) => ({
            ...meta,
            errorMap: { ...meta.errorMap, onDynamic: { message: EXISTING_CODE_ERROR_MESSAGE } },
          }))
        })

        expect(formRef.current?.getFieldMeta('code')?.errorMap?.onDynamic).toBeTruthy()

        await userEvent.type(getInput(), '-2')

        expect(formRef.current?.getFieldMeta('code')?.errorMap?.onDynamic).toBeUndefined()
      })
    })
  })
})
