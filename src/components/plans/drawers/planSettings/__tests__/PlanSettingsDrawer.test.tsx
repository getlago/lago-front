import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef, ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'
import { UpdatePlanDocument } from '~/generated/graphql'

import { planDetailsV2Fixture } from '../../../details-v2/__tests__/fixtures'
import { PlanSettingsDrawer, PlanSettingsDrawerRef } from '../PlanSettingsDrawer'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

type CapturedDrawerArgs = {
  title?: ReactNode
  children?: ReactNode
  mainAction?: ReactNode
  form?: { id: string; submit: () => void }
}

let lastDrawerArgs: CapturedDrawerArgs | null = null
const mockClose = jest.fn()

jest.mock('~/components/drawers/useDrawer', () => ({
  useFormDrawer: () => ({
    open: jest.fn((args: CapturedDrawerArgs) => {
      lastDrawerArgs = args
    }),
    close: mockClose,
  }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

const updateMockFactory = (cascadeUpdates: boolean | undefined): MockedResponse => ({
  request: { query: UpdatePlanDocument },
  variableMatcher: (vars) => {
    const input = vars?.input
    if (!input || input.id !== planDetailsV2Fixture.id || input.name !== 'Pro Renamed') {
      return false
    }
    if (cascadeUpdates === undefined) {
      return input.cascadeUpdates === undefined
    }
    return input.cascadeUpdates === cascadeUpdates
  },
  result: {
    data: { updatePlan: { ...planDetailsV2Fixture, name: 'Pro Renamed' } },
  },
})

const renderHarness = (plan = planDetailsV2Fixture, mocks: MockedResponse[] = []) => {
  const ref = createRef<PlanSettingsDrawerRef>()

  const utils = render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <NiceModal.Provider>
        <PlanSettingsDrawer ref={ref} plan={plan} />
      </NiceModal.Provider>
    </MockedProvider>,
  )

  return { ref, ...utils }
}

const renderDrawerBody = () => {
  if (!lastDrawerArgs?.children) {
    throw new Error('Drawer was not opened')
  }
  return render(
    <MockedProvider mocks={[]} addTypename={false}>
      <NiceModal.Provider>{lastDrawerArgs.children}</NiceModal.Provider>
    </MockedProvider>,
  )
}

describe('PlanSettingsDrawer', () => {
  beforeEach(() => {
    lastDrawerArgs = null
    mockClose.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('opens with current plan values pre-filled', async () => {
    const { ref } = renderHarness()

    act(() => ref.current?.openDrawer())

    expect(lastDrawerArgs?.title).toBe('text_642d5eb2783a2ad10d67031a')

    renderDrawerBody()

    await waitFor(() => {
      expect(screen.getByDisplayValue('Pro')).toBeInTheDocument()
    })
    expect(screen.getByDisplayValue('pro')).toBeInTheDocument()
  })

  it('submits updatePlan without opening the cascade dialog when no overrides exist', async () => {
    const { ref } = renderHarness(planDetailsV2Fixture, [updateMockFactory(undefined)])

    act(() => ref.current?.openDrawer())

    renderDrawerBody()

    await waitFor(() => screen.getByDisplayValue('Pro'))

    const nameInput = screen.getByDisplayValue('Pro') as HTMLInputElement

    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Pro Renamed')

    await act(async () => {
      lastDrawerArgs?.form?.submit()
    })

    await waitFor(() => {
      expect(screen.queryByText('text_1729604107534r3hsj7i64gp')).not.toBeInTheDocument()
    })
  })

  it('opens the cascade dialog when plan has overridden subs', async () => {
    const { ref } = renderHarness(
      { ...planDetailsV2Fixture, hasOverriddenPlans: true },
      [updateMockFactory(true)],
    )

    act(() => ref.current?.openDrawer())

    renderDrawerBody()

    await waitFor(() => screen.getByDisplayValue('Pro'))

    const nameInput = screen.getByDisplayValue('Pro') as HTMLInputElement

    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Pro Renamed')

    await act(async () => {
      lastDrawerArgs?.form?.submit()
    })

    await waitFor(() => {
      expect(screen.getByText('text_1729604107534r3hsj7i64gp')).toBeInTheDocument()
    })
  })
})
