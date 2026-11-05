import { act, cleanup, screen } from '@testing-library/react'

import {
  PASSWORD_VALIDATION_ERRORS,
  PASSWORD_VALIDATION_TEST_IDS,
} from '~/formValidation/zodCustoms'
import { theme } from '~/styles'
import { render } from '~/test-utils'

import {
  PASSWORD_HINTS_TEST_IDS,
  PASSWORD_VALIDATION_KEYS,
  PasswordValidationHints,
  PasswordValidationHintsProps,
} from '../PasswordValidationHints'

const PRIMARY_COLOR = theme.palette.primary.main
const GREY_COLOR = theme.palette.grey[500]

async function prepare(props: PasswordValidationHintsProps): Promise<void> {
  await act(() => render(<PasswordValidationHints {...props} />))
}

const getRuleDotColors = (): Array<string | null> =>
  Array.from(
    screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE).querySelectorAll('circle'),
    (circle) => circle.getAttribute('fill'),
  )

describe('PasswordValidationHints', () => {
  afterEach(cleanup)

  describe('when password is valid', () => {
    it('renders success alert', async () => {
      await prepare({
        password: 'Password1!',
        errors: [],
        isValid: true,
      })

      expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.SUCCESS)).toBeInTheDocument()
    })

    it('renders custom success message translation key', async () => {
      await prepare({
        password: 'Password1!',
        errors: [],
        isValid: true,
        successMessage: 'custom_success_key',
      })

      expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.SUCCESS)).toBeInTheDocument()
    })
  })

  describe('when password is empty', () => {
    it('renders hidden validation hints', async () => {
      await prepare({
        password: '',
        errors: Object.values(PASSWORD_VALIDATION_ERRORS),
        isValid: false,
      })

      expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.HIDDEN)).toBeInTheDocument()
    })
  })

  describe('when password has validation errors', () => {
    it('renders visible validation hints when password is not empty', async () => {
      await prepare({
        password: 'test',
        errors: [
          PASSWORD_VALIDATION_ERRORS.MIN,
          PASSWORD_VALIDATION_ERRORS.UPPERCASE,
          PASSWORD_VALIDATION_ERRORS.NUMBER,
          PASSWORD_VALIDATION_ERRORS.SPECIAL,
        ],
        isValid: false,
      })

      expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE)).toBeInTheDocument()
    })

    it('marks errored validation rules with test ids', async () => {
      await prepare({
        password: 'password',
        errors: [
          PASSWORD_VALIDATION_ERRORS.UPPERCASE,
          PASSWORD_VALIDATION_ERRORS.NUMBER,
          PASSWORD_VALIDATION_ERRORS.SPECIAL,
        ],
        isValid: false,
      })

      expect(screen.getByTestId('UPPERCASE')).toBeInTheDocument()
      expect(screen.getByTestId('NUMBER')).toBeInTheDocument()
      expect(screen.getByTestId('SPECIAL')).toBeInTheDocument()
    })

    it('renders all validation keys', async () => {
      await prepare({
        password: 'test',
        errors: Object.values(PASSWORD_VALIDATION_ERRORS),
        isValid: false,
      })

      // Each validation key should render as a hint
      expect(PASSWORD_VALIDATION_KEYS).toHaveLength(5)
    })
  })

  describe('with className prop', () => {
    it('applies className when valid', async () => {
      await prepare({
        password: 'Password1!',
        errors: [],
        isValid: true,
        className: 'custom-class',
      })

      const alert = screen.getByTestId(PASSWORD_HINTS_TEST_IDS.SUCCESS)

      expect(alert).toHaveClass('custom-class')
    })

    it('applies className when invalid', async () => {
      await prepare({
        password: 'test',
        errors: [PASSWORD_VALIDATION_ERRORS.MIN],
        isValid: false,
        className: 'custom-class',
      })

      const hints = screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE)

      expect(hints).toHaveClass('custom-class')
    })
  })

  describe('GIVEN the default variant', () => {
    describe('WHEN some rules are unmet', () => {
      it('THEN should highlight the unmet rules with the primary colour', async () => {
        await prepare({
          password: 'abcdefgh',
          errors: [
            PASSWORD_VALIDATION_ERRORS.UPPERCASE,
            PASSWORD_VALIDATION_ERRORS.NUMBER,
            PASSWORD_VALIDATION_ERRORS.SPECIAL,
          ],
          isValid: false,
        })

        expect(getRuleDotColors()).toEqual([
          GREY_COLOR,
          GREY_COLOR,
          PRIMARY_COLOR,
          PRIMARY_COLOR,
          PRIMARY_COLOR,
        ])
      })
    })
  })

  describe('GIVEN the checklist variant', () => {
    describe('WHEN every rule is met', () => {
      beforeEach(async () => {
        await prepare({ variant: 'checklist', password: 'Abcdefg1!', errors: [] })
      })

      it('THEN should not render the success alert', () => {
        expect(screen.queryByTestId(PASSWORD_HINTS_TEST_IDS.SUCCESS)).not.toBeInTheDocument()
      })

      it('THEN should keep the checklist visible', () => {
        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.VISIBLE)).toBeInTheDocument()
      })

      it('THEN should highlight every rule with the primary colour', () => {
        expect(getRuleDotColors()).toEqual(
          Array(PASSWORD_VALIDATION_KEYS.length).fill(PRIMARY_COLOR),
        )
      })
    })

    describe('WHEN some rules are unmet', () => {
      beforeEach(async () => {
        await prepare({
          variant: 'checklist',
          password: 'abcdefgh',
          errors: [
            PASSWORD_VALIDATION_ERRORS.UPPERCASE,
            PASSWORD_VALIDATION_ERRORS.NUMBER,
            PASSWORD_VALIDATION_ERRORS.SPECIAL,
          ],
        })
      })

      it('THEN should highlight the met rules and grey out the unmet ones', () => {
        expect(getRuleDotColors()).toEqual([
          PRIMARY_COLOR,
          PRIMARY_COLOR,
          GREY_COLOR,
          GREY_COLOR,
          GREY_COLOR,
        ])
      })

      it.each([
        ['uppercase', PASSWORD_VALIDATION_ERRORS.UPPERCASE],
        ['number', PASSWORD_VALIDATION_ERRORS.NUMBER],
        ['special character', PASSWORD_VALIDATION_ERRORS.SPECIAL],
      ])('THEN should mark the unmet %s rule', (_, rule) => {
        expect(screen.getByTestId(PASSWORD_VALIDATION_TEST_IDS[rule])).toBeInTheDocument()
      })

      it.each([
        ['minimum length', PASSWORD_VALIDATION_ERRORS.MIN],
        ['lowercase', PASSWORD_VALIDATION_ERRORS.LOWERCASE],
      ])('THEN should not mark the met %s rule', (_, rule) => {
        expect(screen.queryByTestId(PASSWORD_VALIDATION_TEST_IDS[rule])).not.toBeInTheDocument()
      })
    })

    describe('WHEN the password is empty', () => {
      it('THEN should hide the checklist', async () => {
        await prepare({
          variant: 'checklist',
          password: '',
          errors: Object.values(PASSWORD_VALIDATION_ERRORS),
        })

        expect(screen.getByTestId(PASSWORD_HINTS_TEST_IDS.HIDDEN)).toBeInTheDocument()
      })
    })
  })
})
