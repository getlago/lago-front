import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { AttributedUsageBasisEnum, CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { ATTRIBUTION_TABLE_FOOTER_TEST_ID } from '../AttributionFlatTable'
import { AttributionLevel, getAttributionNodeKey } from '../attributionTree'
import {
  ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID,
  ATTRIBUTION_TREE_ROW_TEST_ID,
  ATTRIBUTION_TREE_TOGGLE_TEST_ID,
  AttributionTreeTable,
} from '../AttributionTreeTable'
import { AttributionTreeNodes, AttributionTreeUsage } from '../useAttributionTree'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string, data?: Record<string, string>) =>
      data?.typeName ? `${key}:${data.typeName}` : key,
  }),
}))

const departmentLevel: AttributionLevel = { code: 'department', name: 'Department', isLeaf: false }
const apiKeyLevel: AttributionLevel = { code: 'api_key', name: 'API Key', isLeaf: true }

const buildUsage = (
  values: string[],
  { currentPage = 1, totalPages = 1 }: { currentPage?: number; totalPages?: number } = {},
): AttributionTreeUsage => ({
  currency: CurrencyEnum.Usd,
  metadata: { currentPage, totalPages },
  rows: values.map((value) => ({ value, amountCents: null, chargesUsage: [] })),
  unattributed: { amountCents: null, chargesUsage: [] },
  totals: { amountCents: null, chargesUsage: [] },
})

const ROOT_KEY = getAttributionNodeKey([])
const RND_PATH = [{ code: 'department', value: 'rnd' }]
const RND_KEY = getAttributionNodeKey(RND_PATH)

const rootNodes = (usage = buildUsage(['rnd', 'gtm'])): AttributionTreeNodes => ({
  [ROOT_KEY]: {
    status: 'loaded',
    isExpanded: true,
    blocks: [{ level: departmentLevel, usage, isLoadingMore: false }],
  },
})

const onToggleNode = jest.fn()
const onLoadMore = jest.fn()

const renderTree = (nodes: AttributionTreeNodes, isLoading = false) =>
  render(
    <AttributionTreeTable
      nodes={nodes}
      onToggleNode={onToggleNode}
      onLoadMore={onLoadMore}
      totals={{ amountCents: null, chargesUsage: [] }}
      columns={[]}
      chargeLabel={null}
      hiddenColumnsCount={0}
      isExpanded={false}
      basis={AttributedUsageBasisEnum.Units}
      currency={CurrencyEnum.Usd}
      isLoading={isLoading}
      onToggleExpanded={jest.fn()}
    />,
  )

const getRowTexts = (): string[] =>
  screen.getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID).map((row) => row.textContent ?? '')

describe('AttributionTreeTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GIVEN the root level is loaded', () => {
    it('THEN should render its values followed by the unattributed row', () => {
      renderTree(rootNodes())

      const rows = getRowTexts()

      expect(rows).toHaveLength(3)
      expect(rows[0]).toContain('rnd')
      expect(rows[1]).toContain('gtm')
      expect(rows[2]).toContain('Department')
    })

    it('THEN should render the footer', () => {
      renderTree(rootNodes())

      expect(screen.getByTestId(ATTRIBUTION_TABLE_FOOTER_TEST_ID)).toBeInTheDocument()
    })

    it('THEN should render no show more row on the last page', () => {
      renderTree(rootNodes())

      expect(screen.queryByTestId(ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN the root is still loading', () => {
    it('THEN should render no tree row', () => {
      renderTree({ [ROOT_KEY]: { status: 'loading' } }, true)

      expect(screen.queryByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)).not.toBeInTheDocument()
    })
  })

  describe('GIVEN expandable rows', () => {
    it.each([
      ['collapsed', false],
      ['expanded', true],
    ])('THEN should expose the node name and the %s state', (_, isExpanded) => {
      renderTree({
        ...rootNodes(),
        [RND_KEY]: {
          status: 'loaded',
          isExpanded,
          blocks: [{ level: apiKeyLevel, usage: buildUsage([]), isLoadingMore: false }],
        },
      })

      const toggle = within(screen.getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)[0]).getByTestId(
        ATTRIBUTION_TREE_TOGGLE_TEST_ID,
      )

      expect(toggle).toHaveAttribute('aria-label', 'rnd')
      expect(toggle).toHaveAttribute('aria-expanded', String(isExpanded))
    })
  })

  describe('GIVEN a row is clicked', () => {
    describe('WHEN its toggle is clicked', () => {
      it('THEN should toggle the node with its path and level', async () => {
        const user = userEvent.setup()

        renderTree(rootNodes())

        await user.click(
          within(screen.getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)[0]).getByTestId(
            ATTRIBUTION_TREE_TOGGLE_TEST_ID,
          ),
        )

        expect(onToggleNode).toHaveBeenCalledWith(RND_PATH, 'department')
      })
    })

    describe('WHEN the unattributed toggle is clicked', () => {
      it('THEN should toggle the node with a null value', async () => {
        const user = userEvent.setup()

        renderTree(rootNodes())

        await user.click(
          within(screen.getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)[2]).getByTestId(
            ATTRIBUTION_TREE_TOGGLE_TEST_ID,
          ),
        )

        expect(onToggleNode).toHaveBeenCalledWith(
          [{ code: 'department', value: null }],
          'department',
        )
      })
    })
  })

  describe('GIVEN an expanded node with leaf children', () => {
    const nodes: AttributionTreeNodes = {
      ...rootNodes(),
      [RND_KEY]: {
        status: 'loaded',
        isExpanded: true,
        blocks: [
          {
            level: apiKeyLevel,
            usage: buildUsage(['k_live_ab12'], { totalPages: 2 }),
            isLoadingMore: false,
          },
        ],
      },
    }

    it('THEN should render the children right after their parent, show more before no X', () => {
      renderTree(nodes)

      const rows = getRowTexts()

      expect(rows[0]).toContain('rnd')
      expect(rows[1]).toContain('k_live_ab12')
      expect(rows[2]).toContain('API Key')
      expect(rows[3]).toContain('gtm')
    })

    it('THEN should render no toggle on leaf rows', () => {
      renderTree(nodes)

      const leafRow = screen.getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)[1]

      expect(within(leafRow).queryByTestId(ATTRIBUTION_TREE_TOGGLE_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN should load more rows of that node only', async () => {
      const user = userEvent.setup()

      renderTree(nodes)

      await user.click(screen.getByTestId(ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID))

      expect(onLoadMore).toHaveBeenCalledWith(RND_PATH, 0)
    })
  })

  describe('GIVEN a hierarchy deeper than six levels', () => {
    it('THEN should keep indenting each level', () => {
      const DEPTH = 8
      const levelOf = (index: number): AttributionLevel => ({
        code: `level_${index}`,
        name: `Level ${index}`,
        isLeaf: index === DEPTH,
      })
      const pathTo = (index: number) =>
        Array.from({ length: index }, (_, step) => ({
          code: `level_${step}`,
          value: `value_${step}`,
        }))

      const nodes: AttributionTreeNodes = Object.fromEntries(
        Array.from({ length: DEPTH + 1 }, (_, index) => [
          getAttributionNodeKey(pathTo(index)),
          {
            status: 'loaded',
            isExpanded: true,
            blocks: [
              {
                level: levelOf(index),
                usage: buildUsage([`value_${index}`]),
                isLoadingMore: false,
              },
            ],
          },
        ]),
      )

      renderTree(nodes)

      const deepestRow = screen
        .getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)
        .find((row) => row.textContent?.includes(`value_${DEPTH}`)) as HTMLElement
      const indentedContainer = within(deepestRow).getByText(`value_${DEPTH}`).parentElement

      expect(indentedContainer).toHaveStyle({ paddingLeft: `${DEPTH * 16}px` })
    })
  })

  describe('GIVEN a collapsed node with cached children', () => {
    it('THEN should not render its children', () => {
      renderTree({
        ...rootNodes(),
        [RND_KEY]: {
          status: 'loaded',
          isExpanded: false,
          blocks: [
            { level: apiKeyLevel, usage: buildUsage(['k_live_ab12']), isLoadingMore: false },
          ],
        },
      })

      expect(getRowTexts()).toHaveLength(3)
    })
  })

  describe('GIVEN a level is loading more rows', () => {
    it('THEN should disable its show more button', () => {
      renderTree({
        [ROOT_KEY]: {
          status: 'loaded',
          isExpanded: true,
          blocks: [
            {
              level: departmentLevel,
              usage: buildUsage(['rnd'], { totalPages: 2 }),
              isLoadingMore: true,
            },
          ],
        },
      })

      expect(screen.getByTestId(ATTRIBUTION_TREE_LOAD_MORE_ROWS_TEST_ID)).toBeDisabled()
    })
  })

  describe('GIVEN a node is loading its children', () => {
    it('THEN should disable its toggle', () => {
      renderTree({ ...rootNodes(), [RND_KEY]: { status: 'loading' } })

      expect(
        within(screen.getAllByTestId(ATTRIBUTION_TREE_ROW_TEST_ID)[0]).getByTestId(
          ATTRIBUTION_TREE_TOGGLE_TEST_ID,
        ),
      ).toBeDisabled()
    })
  })
})
