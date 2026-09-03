import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useAppForm } from '~/hooks/forms/useAppform'
import { render } from '~/test-utils'

import { CONNECTION_CODE_FIELD_TEST_ID, ConnectionCodeField } from '../ConnectionCodeField'
import type { CustomerConnectionDrawerFormApi } from '../CustomerConnectionDrawer'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

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

describe('ConnectionCodeField', () => {
  beforeEach(() => {
    formRef.current = null
  })

  describe('GIVEN a connection being created', () => {
    describe('WHEN a provider is selected', () => {
      it('THEN should leave the code empty, the backend backfilling it from the provider', () => {
        render(<Harness defaultValues={{ code: '', providerCode: undefined }} />)

        act(() => {
          formRef.current?.setFieldValue('providerCode', 'anrok-1')
        })

        expect(getInput()).toHaveValue('')
      })
    })
  })

  describe('GIVEN a connection opened on a persisted code', () => {
    describe('WHEN the provider is switched', () => {
      it('THEN should keep showing the value the connection was loaded with', () => {
        render(<Harness defaultValues={{ code: 'tax-eu', providerCode: 'anrok-1' }} />)

        act(() => {
          formRef.current?.setFieldValue('providerCode', 'avalara-1')
        })

        expect(getInput()).toHaveValue('tax-eu')
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
