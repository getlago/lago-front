import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { PlanFormType } from '~/hooks/plans/usePlanForm'
import { render } from '~/test-utils'

import {
  ADD_PLAN_METADATA_TEST_ID,
  PLAN_METADATA_ACCORDION_TEST_ID,
  PlanMetadataSection,
} from '../PlanMetadataSection'

type MetadataPair = { key: string; value?: string | null }

// Mutable value returned by the mocked useStore selector.
let mockMetadata: MetadataPair[] = []

jest.mock('@tanstack/react-form', () => ({
  useStore: (
    _store: unknown,
    selector: (state: { values: { metadata: MetadataPair[] } }) => unknown,
  ) => selector({ values: { metadata: mockMetadata } }),
}))

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({
    translate: (key: string) => key,
  }),
}))

// Capture the drawer props + imperative handle so we can assert wiring.
const mockOpenDrawer = jest.fn()
let capturedDrawerProps: {
  onSave: (values: { metadata: MetadataPair[] }) => void
  onDelete?: () => void
} = { onSave: jest.fn() }

jest.mock('~/components/metadata/ItemMetadataDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const ItemMetadataDrawer = forwardRef((props: typeof capturedDrawerProps, ref: unknown) => {
    capturedDrawerProps = props
    useImperativeHandle(ref, () => ({ openDrawer: mockOpenDrawer, closeDrawer: jest.fn() }))
    return null
  })

  return { __esModule: true, ItemMetadataDrawer }
})

const mockSetFieldValue = jest.fn()
const mockForm = { store: {}, setFieldValue: mockSetFieldValue } as unknown as PlanFormType

describe('PlanMetadataSection', () => {
  beforeEach(() => {
    mockMetadata = []
    mockOpenDrawer.mockClear()
    mockSetFieldValue.mockClear()
  })

  describe('GIVEN the plan has metadata', () => {
    beforeEach(() => {
      mockMetadata = [{ key: 'product_group', value: 'Premium Suite' }]
    })

    it('THEN should render the metadata accordion', () => {
      render(<PlanMetadataSection form={mockForm} />)

      expect(screen.getByTestId(PLAN_METADATA_ACCORDION_TEST_ID)).toBeInTheDocument()
    })

    it('THEN should render the header add button', () => {
      render(<PlanMetadataSection form={mockForm} />)

      expect(screen.getByTestId(ADD_PLAN_METADATA_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN the plan has no metadata', () => {
    it('THEN should not render the accordion', () => {
      render(<PlanMetadataSection form={mockForm} />)

      expect(screen.queryByTestId(PLAN_METADATA_ACCORDION_TEST_ID)).not.toBeInTheDocument()
    })

    it('THEN should render the inline add button', () => {
      render(<PlanMetadataSection form={mockForm} />)

      expect(screen.getByTestId(ADD_PLAN_METADATA_TEST_ID)).toBeInTheDocument()
    })
  })

  describe('GIVEN the add button is clicked', () => {
    describe('WHEN the plan has existing metadata', () => {
      it('THEN should open the drawer prefilled with the existing pairs', async () => {
        const user = userEvent.setup()

        mockMetadata = [{ key: 'product_group', value: 'Premium Suite' }]

        render(<PlanMetadataSection form={mockForm} />)

        await user.click(screen.getByTestId(ADD_PLAN_METADATA_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith(
          { metadata: [{ key: 'product_group', value: 'Premium Suite' }] },
          { appendEmptyRow: true },
        )
      })

      it('THEN should coerce a null value to an empty string', async () => {
        const user = userEvent.setup()

        mockMetadata = [{ key: 'product_group', value: null }]

        render(<PlanMetadataSection form={mockForm} />)

        await user.click(screen.getByTestId(ADD_PLAN_METADATA_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith(
          { metadata: [{ key: 'product_group', value: '' }] },
          { appendEmptyRow: true },
        )
      })
    })

    describe('WHEN the plan has no metadata', () => {
      it('THEN should open the drawer with an empty list', async () => {
        const user = userEvent.setup()

        render(<PlanMetadataSection form={mockForm} />)

        await user.click(screen.getByTestId(ADD_PLAN_METADATA_TEST_ID))

        expect(mockOpenDrawer).toHaveBeenCalledWith({ metadata: [] }, { appendEmptyRow: true })
      })
    })
  })

  describe('GIVEN the drawer reports a save', () => {
    it('THEN should write the metadata back onto the form', () => {
      render(<PlanMetadataSection form={mockForm} />)

      capturedDrawerProps.onSave({ metadata: [{ key: 'a', value: 'b' }] })

      expect(mockSetFieldValue).toHaveBeenCalledWith('metadata', [{ key: 'a', value: 'b' }])
    })
  })

  describe('GIVEN the drawer reports a delete', () => {
    it('THEN should clear the metadata on the form', () => {
      render(<PlanMetadataSection form={mockForm} />)

      capturedDrawerProps.onDelete?.()

      expect(mockSetFieldValue).toHaveBeenCalledWith('metadata', [])
    })
  })
})
