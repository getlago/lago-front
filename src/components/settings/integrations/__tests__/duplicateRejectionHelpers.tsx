import { act, screen } from '@testing-library/react'

import { EXISTING_CODE_ERROR_MESSAGE } from '~/core/form/existingCodeError'
import { LagoApiError } from '~/generated/graphql'

export const rejectedUnder = (detailsKey: string) => ({
  errors: [{ extensions: { details: { [detailsKey]: [LagoApiError.ValueAlreadyExist] } } }],
})

type OpenDialog = (detailsKey: string) => Promise<() => Promise<unknown>>

// The duplicate-rejection contract shared by every integration dialog: the Code
// input carries the error only when the API keys the collision under `code`.
// `expectFallback` asserts where a collision under another key surfaces instead,
// which differs per dialog depending on whether its mutation mutes the error link.
export const describeDuplicateRejectionRouting = (
  label: string,
  openDialog: OpenDialog,
  expectFallback?: () => void,
): void => {
  const submitAndExpectRejection = async (detailsKey: string): Promise<void> => {
    const submit = await openDialog(detailsKey)

    await act(async () => {
      await expect(submit()).rejects.toThrow()
    })
  }

  describe(`GIVEN the backend rejects the ${label} for a duplicate code`, () => {
    describe('WHEN submitting the dialog', () => {
      it('THEN surfaces the shared duplicate-code message under the code input', async () => {
        await submitAndExpectRejection('code')

        expect(await screen.findByText(EXISTING_CODE_ERROR_MESSAGE)).toBeInTheDocument()
      })
    })
  })

  describe(`GIVEN the backend rejects the ${label} for a duplicate on another unique field`, () => {
    describe('WHEN submitting the dialog', () => {
      it('THEN leaves the code input clean', async () => {
        await submitAndExpectRejection('externalId')

        expect(screen.queryByText(EXISTING_CODE_ERROR_MESSAGE)).not.toBeInTheDocument()
        expectFallback?.()
      })
    })
  })
}
