import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import { JSON_EDITOR_ERROR_ENUM, JsonEditor } from '../JsonEditor'

const LABEL = 'Payload'
const CUSTOM_INVALID_ERROR = 'The payload is not valid JSON'
const SCHEMA_ERROR = 'This field is required'

describe('JsonEditor', () => {
  describe('GIVEN an error that is not one of the editor own codes', () => {
    describe('WHEN no customInvalidError is provided', () => {
      // Guards the empty red caption: any message other than the two editor codes was
      // dropped, and a schema message is never one of them.
      it('THEN should display the error message', () => {
        render(<JsonEditor label={LABEL} error={SCHEMA_ERROR} />)

        expect(screen.getByText(SCHEMA_ERROR)).toBeInTheDocument()
      })
    })

    describe('WHEN a customInvalidError is provided', () => {
      it('THEN should display the custom error instead of the message', () => {
        render(
          <JsonEditor
            label={LABEL}
            error={SCHEMA_ERROR}
            customInvalidError={CUSTOM_INVALID_ERROR}
          />,
        )

        expect(screen.getByText(CUSTOM_INVALID_ERROR)).toBeInTheDocument()
        expect(screen.queryByText(SCHEMA_ERROR)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN one of the editor own error codes', () => {
    describe('WHEN no customInvalidError is provided', () => {
      it.each([
        ['malformed JSON', JSON_EDITOR_ERROR_ENUM.invalid],
        ['a failing custom validation', JSON_EDITOR_ERROR_ENUM.invalidCustomValidate],
      ])('THEN should not leak the raw code for %s', (_, errorCode) => {
        render(<JsonEditor label={LABEL} error={errorCode} />)

        expect(screen.queryByText(errorCode)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN no error', () => {
    describe('WHEN a helper text is provided', () => {
      it('THEN should display the helper text', () => {
        render(<JsonEditor label={LABEL} helperText="Some help" />)

        expect(screen.getByText('Some help')).toBeInTheDocument()
      })
    })
  })
})
