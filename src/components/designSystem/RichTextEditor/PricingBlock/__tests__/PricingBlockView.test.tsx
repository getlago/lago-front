import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeViewProps } from '@tiptap/react'

import { render } from '~/test-utils'

import {
  EntityData,
  OnPricingCommand,
  RichTextEditorProvider,
} from '../../common/RichTextEditorContext'
import {
  PRICING_BLOCK_VIEW_EMPTY_TEST_ID,
  PRICING_BLOCK_VIEW_TEST_ID,
  PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID,
  PricingBlockView,
} from '../PricingBlockView'

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
      attrs: { pricingType: 'plan', entityIds: [], ...attrs },
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

const renderPricingBlockView = ({
  attrs = {},
  mode = 'edit' as 'edit' | 'preview',
  entities = {} as Record<string, EntityData>,
  onPricingCommand = jest.fn() as OnPricingCommand,
} = {}) => {
  const nodeProps = createNodeProps(attrs)

  return {
    ...render(
      <RichTextEditorProvider value={{ mode, mentionValues: {}, entities, onPricingCommand }}>
        <PricingBlockView {...nodeProps} />
      </RichTextEditorProvider>,
    ),
    nodeProps,
    onPricingCommand,
  }
}

describe('PricingBlockView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the component is in edit mode', () => {
    describe('WHEN rendered with empty entityIds', () => {
      it('THEN should display the empty state button', () => {
        renderPricingBlockView()

        expect(screen.getByTestId(PRICING_BLOCK_VIEW_EMPTY_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should show the placeholder text', () => {
        renderPricingBlockView()

        const emptyButton = screen.getByTestId(PRICING_BLOCK_VIEW_EMPTY_TEST_ID)

        expect(emptyButton).toHaveTextContent('Select pricing')
      })
    })

    describe('WHEN rendered with entityIds that have context data (plan)', () => {
      it('THEN should display the plan name and code', () => {
        renderPricingBlockView({
          attrs: { pricingType: 'plan', entityIds: ['plan-1'] },
          entities: {
            'plan-1': {
              entityId: 'plan-1',
              entityType: 'plan',
              name: 'Basic Plan',
              code: 'basic',
            },
          },
        })

        const button = screen.getByTestId(PRICING_BLOCK_VIEW_TEST_ID)

        expect(button).toHaveTextContent('Basic Plan (basic)')
      })
    })

    describe('WHEN rendered with entityIds that have context data (addOns)', () => {
      it('THEN should display each add-on name', () => {
        renderPricingBlockView({
          attrs: { pricingType: 'addOns', entityIds: ['addon-1', 'addon-2'] },
          entities: {
            'addon-1': {
              entityId: 'addon-1',
              entityType: 'addOn',
              name: 'Storage Add-on',
              code: 'storage',
            },
            'addon-2': {
              entityId: 'addon-2',
              entityType: 'addOn',
              name: 'Support Add-on',
              code: 'support',
            },
          },
        })

        const button = screen.getByTestId(PRICING_BLOCK_VIEW_TEST_ID)

        expect(button).toHaveTextContent('One-off invoice of')
        expect(button).toHaveTextContent('Click to edit')
      })
    })

    describe('WHEN rendered with entityIds that have no context data (plan)', () => {
      it('THEN should display the unresolved view with plan id', () => {
        renderPricingBlockView({
          attrs: { pricingType: 'plan', entityIds: ['plan-123'] },
        })

        expect(screen.getByTestId(PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toHaveTextContent(
          'Plan: plan-123',
        )
      })
    })

    describe('WHEN rendered with entityIds that have no context data (addOns)', () => {
      it('THEN should display the unresolved view with add-on ids', () => {
        renderPricingBlockView({
          attrs: { pricingType: 'addOns', entityIds: ['addon-1', 'addon-2'] },
        })

        expect(screen.getByTestId(PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toHaveTextContent(
          'Add-ons: addon-1, addon-2',
        )
      })
    })

    describe('WHEN the empty state button is clicked', () => {
      it('THEN should call onPricingCommand with editData undefined', async () => {
        const user = userEvent.setup()
        const { onPricingCommand } = renderPricingBlockView()

        const button = screen.getByTestId(PRICING_BLOCK_VIEW_EMPTY_TEST_ID)

        await user.click(button)

        expect(onPricingCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            onSave: expect.any(Function),
            editData: undefined,
          }),
        )
      })
    })

    describe('WHEN the resolved plan block is clicked', () => {
      it('THEN should call onPricingCommand with editData containing pricingType and entityIds', async () => {
        const user = userEvent.setup()
        const { onPricingCommand } = renderPricingBlockView({
          attrs: { pricingType: 'plan', entityIds: ['plan-1'] },
          entities: {
            'plan-1': {
              entityId: 'plan-1',
              entityType: 'plan',
              name: 'Basic Plan',
              code: 'basic',
            },
          },
        })

        const button = screen.getByTestId(PRICING_BLOCK_VIEW_TEST_ID)

        await user.click(button)

        expect(onPricingCommand).toHaveBeenCalledWith(
          expect.objectContaining({
            onSave: expect.any(Function),
            editData: { pricingType: 'plan', entityIds: ['plan-1'] },
          }),
        )
      })
    })

    describe('WHEN onSave is called from the pricing command params', () => {
      it('THEN should call updateAttributes with the new attrs', async () => {
        const user = userEvent.setup()
        const mockOnPricingCommand = jest.fn()
        const { nodeProps } = renderPricingBlockView({
          onPricingCommand: mockOnPricingCommand,
        })

        const button = screen.getByTestId(PRICING_BLOCK_VIEW_EMPTY_TEST_ID)

        await user.click(button)

        const { onSave } = mockOnPricingCommand.mock.calls[0][0]
        const newAttrs = { pricingType: 'plan' as const, entityIds: ['plan-new'] }

        onSave(newAttrs, {})

        expect(nodeProps.updateAttributes).toHaveBeenCalledWith(newAttrs)
      })
    })

    describe('WHEN the unresolved state is rendered', () => {
      it('THEN should not be clickable', () => {
        renderPricingBlockView({
          attrs: { pricingType: 'plan', entityIds: ['unknown-plan'] },
        })

        const unresolvedElement = screen.getByTestId(PRICING_BLOCK_VIEW_UNRESOLVED_TEST_ID)

        // The unresolved element should be a div, not a button
        expect(unresolvedElement.tagName).not.toBe('BUTTON')
      })
    })
  })
})
