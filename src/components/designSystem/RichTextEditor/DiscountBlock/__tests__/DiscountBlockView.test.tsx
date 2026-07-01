import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeViewProps } from '@tiptap/react'

import { render } from '~/test-utils'

import {
  EntityData,
  OnDiscountCommand,
  RichTextEditorProvider,
} from '../../common/RichTextEditorContext'
import { SLASH_COMMAND_BLOCK_VIEW_TEST_ID } from '../../SlashCommandBlockWrapper/SlashCommandBlockWrapper'
import {
  DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID,
  DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID,
  DiscountBlockView,
} from '../DiscountBlockView'

jest.mock('@tiptap/react', () => ({
  ...jest.requireActual('@tiptap/react'),
  NodeViewWrapper: ({
    children,
    ...props
  }: {
    children: React.ReactNode
    as?: string
    className?: string
  }) => <div {...props}>{children}</div>,
}))

const createNodeProps = (
  attrs: Record<string, unknown> = {},
  overrides: Partial<NodeViewProps> = {},
): NodeViewProps => {
  return {
    node: {
      attrs: { couponId: '', localId: '', ...attrs },
    },
    editor: null as never,
    extension: null as never,
    getPos: () => 0,
    updateAttributes: jest.fn(),
    deleteNode: () => {},
    selected: false,
    decorations: [],
    innerDecorations: null as never,
    HTMLAttributes: {},
    view: null as never,
    ...overrides,
  } as unknown as NodeViewProps
}

const renderDiscountBlockView = ({
  attrs = {},
  entities = {} as Record<string, EntityData>,
  onDiscountCommand = jest.fn() as OnDiscountCommand,
}: {
  attrs?: Record<string, unknown>
  entities?: Record<string, EntityData>
  onDiscountCommand?: OnDiscountCommand
} = {}) => {
  const nodeProps = createNodeProps(attrs)

  return {
    ...render(
      <RichTextEditorProvider
        value={{
          mode: 'edit',
          mentionValues: {},
          entities,
          onDiscountCommand,
        }}
      >
        <DiscountBlockView {...nodeProps} />
      </RichTextEditorProvider>,
    ),
    nodeProps,
    onDiscountCommand,
  }
}

describe('DiscountBlockView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN couponId is empty', () => {
    describe('WHEN rendered', () => {
      it('THEN should display the empty state button', () => {
        renderDiscountBlockView()

        expect(screen.getByTestId(DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should show the placeholder text', () => {
        renderDiscountBlockView()

        const emptyButton = screen.getByTestId(DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID)

        expect(emptyButton).toHaveTextContent('Select a coupon')
      })
    })

    describe('WHEN the empty state button is clicked', () => {
      it('THEN should call onDiscountCommand with editData undefined', async () => {
        const user = userEvent.setup()
        const { onDiscountCommand } = renderDiscountBlockView()

        const button = screen.getByTestId(DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID)

        await user.click(button)

        expect(onDiscountCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            onSave: expect.any(Function),
            editData: undefined,
          }),
        )
      })
    })

    describe('WHEN mouseDown occurs on the empty button', () => {
      it('THEN should stop propagation to prevent BlockToolbar overlay', () => {
        renderDiscountBlockView()

        const button = screen.getByTestId(DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID)
        const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
        const stopPropagationSpy = jest.spyOn(mouseDownEvent, 'stopPropagation')

        button.dispatchEvent(mouseDownEvent)

        expect(stopPropagationSpy).toHaveBeenCalled()
      })
    })
  })

  describe('GIVEN couponId is set and entity is resolved', () => {
    const couponEntity: EntityData = {
      entityId: 'coupon-1',
      entityType: 'coupon',
      name: '10% Off',
      code: 'ten-off',
    }

    describe('WHEN rendered', () => {
      it('THEN should display the coupon name via SlashCommandBlockWrapper', () => {
        renderDiscountBlockView({
          attrs: { couponId: 'coupon-1', localId: 'local-1' },
          entities: { 'local-1': couponEntity },
        })

        const button = screen.getByTestId(SLASH_COMMAND_BLOCK_VIEW_TEST_ID)

        expect(button).toHaveTextContent('10% Off')
      })

      it('THEN should render the coupon icon', () => {
        renderDiscountBlockView({
          attrs: { couponId: 'coupon-1', localId: 'local-1' },
          entities: { 'local-1': couponEntity },
        })

        const button = screen.getByTestId(SLASH_COMMAND_BLOCK_VIEW_TEST_ID)

        expect(button.querySelector('[data-test="coupon/medium"]')).toBeInTheDocument()
      })
    })

    describe('WHEN the resolved block is clicked', () => {
      it('THEN should call onDiscountCommand with editData containing couponId and localId', async () => {
        const user = userEvent.setup()
        const { onDiscountCommand } = renderDiscountBlockView({
          attrs: { couponId: 'coupon-1', localId: 'local-1' },
          entities: { 'local-1': couponEntity },
        })

        const button = screen.getByTestId(SLASH_COMMAND_BLOCK_VIEW_TEST_ID)

        await user.click(button)

        expect(onDiscountCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            onSave: expect.any(Function),
            editData: { couponId: 'coupon-1', localId: 'local-1' },
          }),
        )
      })
    })

    describe('WHEN onSave is called from the discount command params', () => {
      it('THEN should call updateAttributes with the new attrs', async () => {
        const user = userEvent.setup()
        const mockOnDiscountCommand = jest.fn()
        const { nodeProps } = renderDiscountBlockView({
          onDiscountCommand: mockOnDiscountCommand,
        })

        const button = screen.getByTestId(DISCOUNT_BLOCK_VIEW_EMPTY_TEST_ID)

        await user.click(button)

        const { onSave } = mockOnDiscountCommand.mock.calls[0][0]
        const newAttrs = { couponId: 'coupon-new', localId: 'local-new' }

        onSave(newAttrs)

        expect(nodeProps.updateAttributes).toHaveBeenCalledWith(newAttrs)
      })
    })
  })

  describe('GIVEN couponId is set but entity is not resolved', () => {
    describe('WHEN rendered', () => {
      it('THEN should display the unresolved fallback with coupon id', () => {
        renderDiscountBlockView({
          attrs: { couponId: 'coupon-unknown', localId: '' },
          entities: {},
        })

        expect(screen.getByTestId(DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toHaveTextContent(
          'Coupon: coupon-unknown',
        )
      })

      it('THEN the unresolved element should not be a button', () => {
        renderDiscountBlockView({
          attrs: { couponId: 'coupon-unknown', localId: '' },
          entities: {},
        })

        const unresolvedElement = screen.getByTestId(DISCOUNT_BLOCK_VIEW_UNRESOLVED_TEST_ID)

        expect(unresolvedElement.tagName).not.toBe('BUTTON')
      })
    })
  })
})
