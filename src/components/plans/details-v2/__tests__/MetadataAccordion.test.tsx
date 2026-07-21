import { MockedProvider } from '@apollo/client/testing'
import NiceModal from '@ebay/nice-modal-react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactNode } from 'react'

import { FORM_DIALOG_NAME } from '~/components/dialogs/const'
import FormDialog from '~/components/dialogs/FormDialog'

import { planDetailsV2Fixture } from './fixtures'

import { MetadataAccordion } from '../accordions/MetadataAccordion'

NiceModal.register(FORM_DIALOG_NAME, FormDialog)

// ── Drawer mock ────────────────────────────────────────────────────────────────
const mockOpenDrawer = jest.fn()
const mockCloseDrawer = jest.fn()

jest.mock('~/components/metadata/ItemMetadataDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const ItemMetadataDrawer = forwardRef((_props: unknown, ref: unknown) => {
    useImperativeHandle(ref, () => ({ openDrawer: mockOpenDrawer, closeDrawer: mockCloseDrawer }))
    return null
  })

  return { __esModule: true, ItemMetadataDrawer }
})

// ── Hook mocks ─────────────────────────────────────────────────────────────────
const mockSetFieldValue = jest.fn()
const mockApplyAndSubmit = jest.fn()

jest.mock('~/hooks/plans/useUpdatePlanWithCascade', () => ({
  useUpdatePlanWithCascade: () => ({
    form: {
      reset: jest.fn(),
      setFieldValue: mockSetFieldValue,
      state: { values: { metadata: [] } },
    },
    applyAndSubmit: mockApplyAndSubmit,
  }),
  buildUpdatePlanFormDefaults: () => ({}),
}))

const mockHasPermissions = jest.fn().mockReturnValue(true)

jest.mock('~/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermissions: mockHasPermissions }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

// ── Test wrapper ───────────────────────────────────────────────────────────────
const Wrapper = ({ children }: { children: ReactNode }) => (
  <MockedProvider mocks={[]} addTypename={false}>
    <NiceModal.Provider>{children}</NiceModal.Provider>
  </MockedProvider>
)

// ── Fixtures ───────────────────────────────────────────────────────────────────
const existingMetadata = [
  { __typename: 'ItemMetadata' as const, key: 'product_group', value: 'Premium Suite' },
  { __typename: 'ItemMetadata' as const, key: 'display_order', value: '2' },
]

const planWithMetadata = {
  ...planDetailsV2Fixture,
  metadata: existingMetadata,
}

describe('MetadataAccordion', () => {
  beforeEach(() => {
    mockOpenDrawer.mockClear()
    mockCloseDrawer.mockClear()
    mockSetFieldValue.mockClear()
    mockApplyAndSubmit.mockReset().mockImplementation((mutate: () => void) => {
      mutate()
      return Promise.resolve(true)
    })
    mockHasPermissions.mockReset().mockReturnValue(true)
  })

  it('renders the section anchor and the metadata rows once expanded', async () => {
    const user = userEvent.setup()

    const { container } = render(<MetadataAccordion plan={planWithMetadata} />, {
      wrapper: Wrapper,
    })

    expect(container.querySelector('#metadata')).not.toBeNull()

    // The accordion content is unmounted while collapsed — expand it first
    const expandButton = container.querySelector('[data-test="open-charge"]')

    expect(expandButton).not.toBeNull()
    await user.click(expandButton as Element)

    expect(screen.getByText('product_group')).toBeInTheDocument()
    expect(screen.getByText('Premium Suite')).toBeInTheDocument()
    expect(screen.getByText('display_order')).toBeInTheDocument()
  })

  it('does not render the accordion card when the plan has no metadata', () => {
    render(<MetadataAccordion plan={{ ...planDetailsV2Fixture, metadata: [] }} />, {
      wrapper: Wrapper,
    })

    expect(screen.queryByText('product_group')).not.toBeInTheDocument()
  })

  // Regression: the header "Add metadata" button must open the drawer with the
  // pre-existing pairs — an empty drawer would overwrite them on save.
  it('opens the drawer prefilled with existing metadata from the header Add button', async () => {
    const user = userEvent.setup()

    render(<MetadataAccordion plan={planWithMetadata} />, { wrapper: Wrapper })

    await user.click(screen.getByRole('button', { name: 'text_6405cac5c833dcf18cad0196' }))

    expect(mockOpenDrawer).toHaveBeenCalledWith(
      {
        metadata: [
          { key: 'product_group', value: 'Premium Suite' },
          { key: 'display_order', value: '2' },
        ],
      },
      { appendEmptyRow: true },
    )
  })

  it('opens the drawer prefilled with existing metadata from the Edit menu action', async () => {
    const user = userEvent.setup()

    render(<MetadataAccordion plan={planWithMetadata} />, { wrapper: Wrapper })

    await user.click(screen.getByRole('button', { name: 'actions' }))
    await user.click(screen.getByRole('button', { name: 'text_63e51ef4985f0ebd75c212fc' }))

    expect(mockOpenDrawer).toHaveBeenCalledWith({
      metadata: [
        { key: 'product_group', value: 'Premium Suite' },
        { key: 'display_order', value: '2' },
      ],
    })
  })

  it('clears the metadata through applyAndSubmit from the Delete menu action', async () => {
    const user = userEvent.setup()

    render(<MetadataAccordion plan={planWithMetadata} />, { wrapper: Wrapper })

    await user.click(screen.getByRole('button', { name: 'actions' }))
    await user.click(screen.getByRole('button', { name: 'text_1784637373017e1som6d92em' }))

    expect(mockApplyAndSubmit).toHaveBeenCalledTimes(1)
    expect(mockSetFieldValue).toHaveBeenCalledWith('metadata', [])
  })

  it('does not render the Add action when plansCreate permission is missing', () => {
    mockHasPermissions.mockImplementation((perms: string[]) => !perms.includes('plansCreate'))

    render(<MetadataAccordion plan={planWithMetadata} />, { wrapper: Wrapper })

    expect(
      screen.queryByRole('button', { name: 'text_6405cac5c833dcf18cad0196' }),
    ).not.toBeInTheDocument()
  })
})
