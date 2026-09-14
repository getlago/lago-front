import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ConnectionBehaviorEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import {
  CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID,
  CONNECTION_FIELDS_SKIP_RADIO_TEST_ID,
  CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID,
  ConnectionBehaviorFields,
} from '../ConnectionBehaviorFields'
import { ConnectionBehavior, SelectedConnection } from '../types'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key, locale: 'en' }),
}))

const SPECIFIC_SLOT_TEST_ID = 'specific-slot'
const BADGE_TEST_ID = 'inherit-badge'

const LABELS = {
  [ConnectionBehavior.INHERIT]: { label: 'Inherit' },
  [ConnectionBehavior.SPECIFIC]: { label: 'Specific', sublabel: 'Specific sublabel' },
  [ConnectionBehavior.SKIP]: { label: 'Skip', sublabel: 'Skip sublabel' },
}

const renderFields = (value?: SelectedConnection) => {
  const onChange = jest.fn()

  render(
    <ConnectionBehaviorFields
      name="testConnectionBehavior"
      labels={LABELS}
      value={value}
      onChange={onChange}
      renderBadge={(behavior) =>
        behavior === ConnectionBehavior.INHERIT ? <span data-test={BADGE_TEST_ID} /> : null
      }
      renderSelectedContent={({ behavior, code, onCodeChange }) => {
        if (behavior !== ConnectionBehavior.SPECIFIC) return null

        return (
          <button
            data-test={SPECIFIC_SLOT_TEST_ID}
            onClick={() => onCodeChange('stripe_eu')}
            type="button"
          >
            {code}
          </button>
        )
      }}
    />,
  )

  return { onChange }
}

const radioOf = (testId: string): HTMLInputElement =>
  screen.getByTestId(testId).querySelector('input') as HTMLInputElement

describe('ConnectionBehaviorFields', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN no choice was made yet', () => {
    describe('WHEN the control renders', () => {
      it.each([
        ['inherit radio', CONNECTION_FIELDS_INHERIT_RADIO_TEST_ID],
        ['specific radio', CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID],
        ['skip radio', CONNECTION_FIELDS_SKIP_RADIO_TEST_ID],
      ])('THEN should display the %s', (_, testId) => {
        renderFields()

        expect(screen.getByTestId(testId)).toBeInTheDocument()
      })

      it('THEN should not display the specific slot', () => {
        renderFields()

        expect(screen.queryByTestId(SPECIFIC_SLOT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN the control is rendered', () => {
    describe('WHEN the user picks the specific branch', () => {
      it('THEN should display the specific slot', async () => {
        const user = userEvent.setup()

        renderFields()
        await user.click(radioOf(CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID))

        expect(screen.getByTestId(SPECIFIC_SLOT_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should publish a code-shaped value even before a code is picked', async () => {
        const user = userEvent.setup()
        const { onChange } = renderFields()

        await user.click(radioOf(CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID))

        expect(onChange).toHaveBeenCalledWith({ code: '' })
      })

      it('THEN should publish the picked code', async () => {
        const user = userEvent.setup()
        const { onChange } = renderFields()

        await user.click(radioOf(CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID))
        await user.click(screen.getByTestId(SPECIFIC_SLOT_TEST_ID))

        expect(onChange).toHaveBeenLastCalledWith({ code: 'stripe_eu' })
      })
    })

    describe('WHEN the user picks the skip branch', () => {
      it('THEN should publish the skip behavior', async () => {
        const user = userEvent.setup()
        const { onChange } = renderFields()

        await user.click(radioOf(CONNECTION_FIELDS_SKIP_RADIO_TEST_ID))

        expect(onChange).toHaveBeenCalledWith({ behavior: ConnectionBehaviorEnum.Skip })
      })

      it('THEN should hide the specific slot again', async () => {
        const user = userEvent.setup()

        renderFields()
        await user.click(radioOf(CONNECTION_FIELDS_SPECIFIC_RADIO_TEST_ID))
        await user.click(radioOf(CONNECTION_FIELDS_SKIP_RADIO_TEST_ID))

        expect(screen.queryByTestId(SPECIFIC_SLOT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a seeded specific connection', () => {
    describe('WHEN the control renders', () => {
      it('THEN should open the specific slot seeded with the stored code', () => {
        renderFields({ code: 'stripe_eu' })

        expect(screen.getByTestId(SPECIFIC_SLOT_TEST_ID)).toHaveTextContent('stripe_eu')
      })
    })
  })

  describe('GIVEN a seeded skip choice', () => {
    describe('WHEN the control renders', () => {
      it('THEN should keep the specific slot closed', () => {
        renderFields({ behavior: ConnectionBehaviorEnum.Skip })

        expect(screen.queryByTestId(SPECIFIC_SLOT_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a badge attached to one behavior', () => {
    describe('WHEN the control renders', () => {
      it('THEN should display it under that option only', () => {
        renderFields()

        expect(screen.getAllByTestId(BADGE_TEST_ID)).toHaveLength(1)
      })
    })
  })
})
