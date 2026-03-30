import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NodeViewProps } from '@tiptap/react'

import { render } from '~/test-utils'

import {
  PLAN_BLOCK_VIEW_EMPTY_TEST_ID,
  PLAN_BLOCK_VIEW_TEST_ID,
  PLAN_BLOCK_VIEW_UNRESOLVED_TEST_ID,
  PlanBlockView,
} from '../PlanBlock/PlanBlockView'
import { EntityData, RichTextEditorProvider } from '../RichTextEditorContext'

const mockDrawerOpen = jest.fn()
const mockDrawerClose = jest.fn()

jest.mock('~/components/drawers/drawerStack', () => ({
  drawerStack: {
    push: jest.fn(),
    remove: jest.fn(),
    subscribe: jest.fn(() => jest.fn()),
    onClear: jest.fn(() => jest.fn()),
    clearAll: jest.fn(),
    getSnapshot: jest.fn(() => []),
  },
}))

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({
    open: mockDrawerOpen,
    close: mockDrawerClose,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  usePlansQuery: jest.fn().mockReturnValue({
    data: {
      plans: {
        collection: [
          { id: 'plan-1', name: 'Basic Plan', code: 'basic' },
          { id: 'plan-2', name: 'Pro Plan', code: 'pro' },
        ],
      },
    },
    loading: false,
  }),
}))

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

jest.mock('@tanstack/react-form', () => ({
  revalidateLogic: () => ({}),
}))

jest.mock('~/hooks/forms/useAppform', () => ({
  useAppForm: jest.fn().mockReturnValue({
    handleSubmit: jest.fn(),
    AppForm: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    SubmitButton: ({ children }: { children: React.ReactNode; dataTest: string }) => (
      <button>{children}</button>
    ),
  }),
}))

jest.mock('../PlanBlock/PlanBlockDrawerContent', () => ({
  __esModule: true,
  default: () => <div data-test="plan-block-drawer-content">Drawer Content</div>,
}))

const createNodeProps = (attrs: Record<string, unknown> = {}): NodeViewProps => {
  return {
    node: {
      attrs: { planId: '', ...attrs },
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
  } as unknown as NodeViewProps
}

const renderPlanBlockView = ({
  attrs = {},
  mode = 'edit' as 'edit' | 'preview',
  plans = {} as Record<string, EntityData>,
  selected = false,
} = {}) => {
  const nodeProps = createNodeProps(attrs)

  if (selected) {
    ;(nodeProps as unknown as { selected: boolean }).selected = true
  }

  return {
    ...render(
      <RichTextEditorProvider value={{ mode, mentionValues: {}, plans, setPlan: jest.fn() }}>
        <PlanBlockView {...nodeProps} />
      </RichTextEditorProvider>,
    ),
    nodeProps,
  }
}

describe('PlanBlockView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the component is in edit mode', () => {
    describe('WHEN rendered with an empty planId', () => {
      it('THEN should display the empty state button', () => {
        renderPlanBlockView()

        expect(screen.getByTestId(PLAN_BLOCK_VIEW_EMPTY_TEST_ID)).toBeInTheDocument()
      })

      it('THEN should auto-open the drawer', () => {
        renderPlanBlockView()

        expect(mockDrawerOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN rendered with a planId that has context data', () => {
      it('THEN should display the plan name and code', () => {
        renderPlanBlockView({
          attrs: { planId: 'plan-1' },
          plans: {
            'plan-1': {
              entityId: 'plan-1',
              entityType: 'plan',
              name: 'Basic Plan',
              code: 'basic',
            },
          },
        })

        const button = screen.getByTestId(PLAN_BLOCK_VIEW_TEST_ID)

        expect(button).toHaveTextContent('Basic Plan (basic)')
      })
    })

    describe('WHEN rendered with a planId that has no context or query data', () => {
      it('THEN should display the unresolved view with plan id', () => {
        // usePlansQuery returns collection that doesn't include this planId
        const { usePlansQuery } = jest.requireMock('~/generated/graphql') as {
          usePlansQuery: jest.Mock
        }

        usePlansQuery.mockReturnValueOnce({
          data: { plans: { collection: [] } },
          loading: false,
        })

        renderPlanBlockView({
          attrs: { planId: 'unknown-plan' },
        })

        expect(screen.getByTestId(PLAN_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toBeInTheDocument()
        expect(screen.getByTestId(PLAN_BLOCK_VIEW_UNRESOLVED_TEST_ID)).toHaveTextContent(
          'Plan: unknown-plan',
        )
      })
    })

    describe('WHEN the empty state button is clicked', () => {
      it('THEN should open the drawer', async () => {
        const user = userEvent.setup()

        renderPlanBlockView()

        // Clear the auto-open call
        mockDrawerOpen.mockClear()

        const button = screen.getByTestId(PLAN_BLOCK_VIEW_EMPTY_TEST_ID)

        await user.click(button)

        expect(mockDrawerOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN the plan block button is clicked', () => {
      it('THEN should open the drawer', async () => {
        const user = userEvent.setup()

        renderPlanBlockView({
          attrs: { planId: 'plan-1' },
          plans: {
            'plan-1': {
              entityId: 'plan-1',
              entityType: 'plan',
              name: 'Basic Plan',
              code: 'basic',
            },
          },
        })

        const button = screen.getByTestId(PLAN_BLOCK_VIEW_TEST_ID)

        await user.click(button)

        expect(mockDrawerOpen).toHaveBeenCalled()
      })
    })

    describe('WHEN selected is true', () => {
      it('THEN should add the selected class to the empty button', () => {
        renderPlanBlockView({ selected: true })

        const button = screen.getByTestId(PLAN_BLOCK_VIEW_EMPTY_TEST_ID)

        expect(button.className).toContain('plan-block--selected')
      })

      it('THEN should add the selected class to a plan block button', () => {
        renderPlanBlockView({
          attrs: { planId: 'plan-1' },
          plans: {
            'plan-1': {
              entityId: 'plan-1',
              entityType: 'plan',
              name: 'Basic Plan',
              code: 'basic',
            },
          },
          selected: true,
        })

        const button = screen.getByTestId(PLAN_BLOCK_VIEW_TEST_ID)

        expect(button.className).toContain('plan-block--selected')
      })
    })
  })

  describe('GIVEN the plan data comes from the query', () => {
    describe('WHEN the planId matches a plan in the query results', () => {
      it('THEN should display the plan name and code from query', () => {
        renderPlanBlockView({
          attrs: { planId: 'plan-2' },
        })

        const button = screen.getByTestId(PLAN_BLOCK_VIEW_TEST_ID)

        expect(button).toHaveTextContent('Pro Plan (pro)')
      })
    })
  })
})
