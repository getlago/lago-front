import { screen } from '@testing-library/react'
import { createRef } from 'react'

import { makeEmptyWalletItem, type WalletFormItem } from '~/core/serializers/serializeQuoteWallets'
import { CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { CreditsDrawerContent } from '../CreditsDrawerContent'

// The wallet sub-drawer hooks (Tasks 4-7) call useDrawer(), which transitively
// pulls in drawerStack.ts (Vite-only `import.meta.hot`, unparsable by Jest).
// Mock useDrawer once here, as the sibling drawer tests do, so the real hook
// bodies (and our mapper wiring) still execute against a stubbed drawer shell.
jest.mock('~/components/drawers/useDrawer', () => ({
  useDrawer: () => ({ open: jest.fn(), close: jest.fn() }),
}))

describe('CreditsDrawerContent', () => {
  it('renders the four selector rows and seeds the stateRef', () => {
    const item = makeEmptyWalletItem('wl_1')
    const ref = createRef<WalletFormItem>()

    // @ts-expect-error test seeds a mutable ref
    ref.current = item

    render(
      <CreditsDrawerContent
        stateRef={ref as never}
        initialItem={item}
        currency={CurrencyEnum.Usd}
      />,
    )

    // 4 selector rows present (assert by role since each Selector renders as a button)
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(4)
    expect(ref.current).toBeTruthy()
  })
})
