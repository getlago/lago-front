import { screen, waitFor } from '@testing-library/react'
import userEvent, { UserEvent } from '@testing-library/user-event'
import { ReactNode, useState } from 'react'

import { render } from '~/test-utils'

import {
  CUSTOM_EXPRESSION_SAVE_TEST_ID,
  CUSTOM_EXPRESSION_VALIDATE_TEST_ID,
} from '../CustomExpressionDrawerActions'
import { CUSTOM_EXPRESSION_VALIDATION_ERROR_TEST_ID } from '../CustomExpressionDrawerContent'
import {
  OpenCustomExpressionDrawerParams,
  useCustomExpressionDrawer,
} from '../useCustomExpressionDrawer'

const INVALID_EXPRESSION = 'event.properties.'
const VALID_EXPRESSION = 'event.properties.tokens * 2'
const THROWING_EXPRESSION = 'event.properties.boom'
const EVALUATION_RESULT = '42'
const EVALUATION_ERROR = 'boom'

jest.mock('lago-expression', () => ({
  parseExpression: jest.fn((expression: string) => {
    if (expression === INVALID_EXPRESSION) {
      throw new Error('parse error')
    }

    return { expression }
  }),
  evaluateExpression: jest.fn((parsed: { expression: string }) => {
    if (parsed.expression === THROWING_EXPRESSION) {
      throw new Error(EVALUATION_ERROR)
    }

    return EVALUATION_RESULT
  }),
}))

const mockOpen = jest.fn()
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
  useFormDrawer: () => ({ open: mockOpen, close: mockClose }),
}))

// The Ace editor does not hold its value under jsdom: it re-emits an empty
// change on blur, which would clear the expression on the first click.
jest.mock('~/components/form/JsonEditor/JsonEditorFieldForTanstack', () => {
  const { useFieldContext } = jest.requireActual<typeof import('~/hooks/forms/formContext')>(
    '~/hooks/forms/formContext',
  )

  return {
    __esModule: true,
    default: function MockJsonEditorField() {
      const field = useFieldContext<string | Record<string, unknown>>()

      return (
        <textarea
          data-test={`json-editor-${field.name}`}
          readOnly
          value={String(field.state.value)}
        />
      )
    },
  }
})

const OPEN_BUTTON_TEST_ID = 'open-custom-expression-drawer'

type DrawerPayload = {
  children: ReactNode
  mainAction: ReactNode
  form: { id: string; submit: () => void }
  onClose: () => void
  closeOnSubmitSuccess: boolean
}

const RERENDER_BUTTON_TEST_ID = 'rerender-custom-expression-host'

const DrawerHost = ({
  onSave,
  params,
}: {
  onSave: (expression: string) => void
  params?: OpenCustomExpressionDrawerParams
}) => {
  const { openDrawer } = useCustomExpressionDrawer({ onSave })
  const [renderCount, setRenderCount] = useState(0)

  return (
    <>
      <button data-test={OPEN_BUTTON_TEST_ID} onClick={() => openDrawer(params)}>
        open
      </button>
      <button data-test={RERENDER_BUTTON_TEST_ID} onClick={() => setRenderCount(renderCount + 1)}>
        rerender
      </button>
    </>
  )
}

const lastDrawerPayload = (): DrawerPayload => mockOpen.mock.calls.at(-1)?.[0] as DrawerPayload

const openDrawerAndRenderBody = async (
  params?: OpenCustomExpressionDrawerParams,
  onSave: (expression: string) => void = jest.fn(),
): Promise<{ payload: DrawerPayload; user: UserEvent }> => {
  const user = userEvent.setup({ pointerEventsCheck: 0 })

  render(<DrawerHost onSave={onSave} params={params} />)

  await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))

  const payload = lastDrawerPayload()

  render(
    <>
      {payload.children}
      {payload.mainAction}
    </>,
  )

  return { payload, user }
}

describe('useCustomExpressionDrawer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the drawer is opened', () => {
    describe('WHEN the caller passes no seed', () => {
      it('THEN should open a form drawer that owns its own closing', async () => {
        await openDrawerAndRenderBody()

        expect(mockOpen).toHaveBeenCalledTimes(1)
        expect(lastDrawerPayload().closeOnSubmitSuccess).toBe(false)
        expect(lastDrawerPayload().form.id).toBe('custom-expression-drawer-form')
      })
    })

    describe('WHEN the expression is editable', () => {
      it('THEN should display both the validate and the save buttons', async () => {
        await openDrawerAndRenderBody({ expression: VALID_EXPRESSION, isEditable: true })

        expect(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(CUSTOM_EXPRESSION_SAVE_TEST_ID)).toBeInTheDocument()
      })
    })

    describe('WHEN the expression is read-only', () => {
      it('THEN should not display the save button', async () => {
        await openDrawerAndRenderBody({ expression: VALID_EXPRESSION, isEditable: false })

        expect(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID)).toBeInTheDocument()
        expect(screen.queryByTestId(CUSTOM_EXPRESSION_SAVE_TEST_ID)).not.toBeInTheDocument()
      })
    })
  })

  describe('GIVEN a seeded expression', () => {
    describe('WHEN it does not parse', () => {
      it('THEN should disable the validate button', async () => {
        await openDrawerAndRenderBody({ expression: INVALID_EXPRESSION, isEditable: true })

        expect(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID)).toBeDisabled()
      })
    })

    describe('WHEN it parses', () => {
      it('THEN should enable the validate button', async () => {
        await openDrawerAndRenderBody({ expression: VALID_EXPRESSION, isEditable: true })

        expect(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN an editable expression that has not been validated', () => {
    describe('WHEN the drawer body renders', () => {
      it('THEN should keep the save button disabled', async () => {
        await openDrawerAndRenderBody({ expression: VALID_EXPRESSION, isEditable: true })

        expect(screen.getByTestId(CUSTOM_EXPRESSION_SAVE_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN the user validates the expression', () => {
    describe('WHEN the evaluation succeeds', () => {
      it('THEN should display the result and enable the save button', async () => {
        const { user } = await openDrawerAndRenderBody({
          expression: VALID_EXPRESSION,
          isEditable: true,
        })

        await user.click(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID))

        expect(await screen.findByText(EVALUATION_RESULT)).toBeInTheDocument()
        expect(screen.getByTestId(CUSTOM_EXPRESSION_SAVE_TEST_ID)).not.toBeDisabled()
      })

      it('THEN should save the expression and close the drawer on submit', async () => {
        const onSave = jest.fn()

        const { payload, user } = await openDrawerAndRenderBody(
          { expression: VALID_EXPRESSION, isEditable: true },
          onSave,
        )

        await user.click(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID))
        payload.form.submit()

        await waitFor(() => expect(onSave).toHaveBeenCalledWith(VALID_EXPRESSION))
        expect(mockClose).toHaveBeenCalled()
      })
    })

    describe('WHEN the evaluation fails', () => {
      it('THEN should display the evaluation error and keep the save button disabled', async () => {
        const { user } = await openDrawerAndRenderBody({
          expression: THROWING_EXPRESSION,
          isEditable: true,
        })

        await user.click(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID))

        expect(
          await screen.findByTestId(CUSTOM_EXPRESSION_VALIDATION_ERROR_TEST_ID),
        ).toHaveTextContent(EVALUATION_ERROR)
        expect(screen.getByTestId(CUSTOM_EXPRESSION_SAVE_TEST_ID)).toBeDisabled()
      })
    })
  })

  describe('GIVEN the consumer re-renders while the drawer is open', () => {
    describe('WHEN the drawer body renders again', () => {
      // A `defaultValues` object rebuilt on every render of the consumer used
      // to hand `useAppForm` a new seed and wipe the expression.
      it('THEN should keep the seeded expression', async () => {
        const user = userEvent.setup({ pointerEventsCheck: 0 })

        render(
          <DrawerHost
            onSave={jest.fn()}
            params={{ expression: VALID_EXPRESSION, isEditable: true }}
          />,
        )

        await user.click(screen.getByTestId(OPEN_BUTTON_TEST_ID))
        await user.click(screen.getByTestId(RERENDER_BUTTON_TEST_ID))

        const payload = lastDrawerPayload()

        render(
          <>
            {payload.children}
            {payload.mainAction}
          </>,
        )

        expect(screen.getByTestId(CUSTOM_EXPRESSION_VALIDATE_TEST_ID)).not.toBeDisabled()
      })
    })
  })

  describe('GIVEN a submit with an unparseable expression', () => {
    describe('WHEN the drawer form is submitted', () => {
      it('THEN should not save nor close the drawer', async () => {
        const onSave = jest.fn()

        const { payload } = await openDrawerAndRenderBody(
          { expression: INVALID_EXPRESSION, isEditable: true },
          onSave,
        )

        payload.form.submit()

        await waitFor(() => expect(onSave).not.toHaveBeenCalled())
        expect(mockClose).not.toHaveBeenCalled()
      })
    })
  })
})
