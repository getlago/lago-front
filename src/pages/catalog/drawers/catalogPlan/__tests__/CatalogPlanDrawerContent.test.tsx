import { revalidateLogic } from '@tanstack/react-form'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { MAX_ITEM_METADATA_COUNT } from '~/components/metadata/constants'
import { ItemMetadataFormValues } from '~/components/metadata/ItemMetadataDrawer'
import { metadataFormSectionTestIds } from '~/components/metadata/MetadataFormSection'
import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders } from '~/test-utils'

import { CatalogPlanDrawerContent } from '../CatalogPlanDrawerContent'
import {
  CATALOG_PLAN_DRAWER_REMOVE_DESCRIPTION_TEST_ID,
  CATALOG_PLAN_DRAWER_SHOW_DESCRIPTION_TEST_ID,
  CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY,
  CATALOG_PLAN_FORM_DEFAULTS,
  CATALOG_PLAN_METADATA_TEST_ID,
  CatalogPlanFormValues,
} from '../constants'
import { catalogPlanSchema } from '../schema'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

const mockOpenMetadataDrawer = jest.fn()
let capturedMetadataDrawerProps: {
  onSave: (values: ItemMetadataFormValues) => void
  onDelete?: () => void
}

jest.mock('~/components/metadata/ItemMetadataDrawer', () => {
  const { forwardRef, useImperativeHandle } = jest.requireActual('react')

  const ItemMetadataDrawer = forwardRef(
    (props: typeof capturedMetadataDrawerProps, ref: unknown) => {
      capturedMetadataDrawerProps = props
      useImperativeHandle(ref, () => ({
        openDrawer: mockOpenMetadataDrawer,
        closeDrawer: jest.fn(),
      }))
      return null
    },
  )

  return { __esModule: true, ItemMetadataDrawer }
})

jest.mock('~/components/metadata/useDeleteAllMetadataDialog', () => ({
  useDeleteAllMetadataDialog: () => ({
    openDeleteAllMetadataDialog: ({ onConfirm }: { onConfirm: () => void }) => onConfirm(),
  }),
}))

const { add: ADD_METADATA_TEST_ID, accordion: METADATA_ACCORDION_TEST_ID } =
  metadataFormSectionTestIds(CATALOG_PLAN_METADATA_TEST_ID)
const EDIT_METADATA_ACTION_KEY = 'text_63e51ef4985f0ebd75c212fc'
const DELETE_ALL_METADATA_ACTION_KEY = 'text_1784637373017e1som6d92em'

let hostForm: { state: { values: CatalogPlanFormValues } }

const NAME_LABEL_KEY = 'text_629728388c4d2300e2d38091'
const CODE_LABEL_KEY = 'text_629728388c4d2300e2d380b7'
const DESCRIPTION_LABEL_KEY = 'text_6388b923e514213fed58331c'
const INVOICE_DISPLAY_NAME_LABEL_KEY = 'text_65a6b4e2cb38d9b70ec53d39'
const ADD_DESCRIPTION_BUTTON_KEY = 'text_642d5eb2783a2ad10d670324'

type HostProps = {
  values?: Partial<CatalogPlanFormValues>
  isEdit?: boolean
  disableCodeInput?: boolean
  disableCurrencyInput?: boolean
}

const Host = ({
  values,
  isEdit = false,
  disableCodeInput = false,
  disableCurrencyInput = false,
}: HostProps) => {
  const form = useAppForm({
    defaultValues: { ...CATALOG_PLAN_FORM_DEFAULTS, ...values },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: catalogPlanSchema },
    onSubmit: async () => undefined,
  })

  hostForm = form

  return (
    <CatalogPlanDrawerContent
      form={form}
      isEdit={isEdit}
      disableCodeInput={disableCodeInput}
      disableCurrencyInput={disableCurrencyInput}
    />
  )
}

const renderHost = (props: HostProps = {}): void => {
  render(<Host {...props} />, { wrapper: AllTheProviders })
}

const nameInput = (): HTMLElement => screen.getByLabelText(NAME_LABEL_KEY)
const codeInput = (): HTMLElement => screen.getByLabelText(CODE_LABEL_KEY)
const currencyInput = (): HTMLElement => screen.getByRole('combobox')
const invoiceDisplayNameInput = (): HTMLElement =>
  screen.getByLabelText(INVOICE_DISPLAY_NAME_LABEL_KEY)
const descriptionInput = (): HTMLElement => screen.getByLabelText(DESCRIPTION_LABEL_KEY)

describe('CatalogPlanDrawerContent', () => {
  describe('lock matrix', () => {
    it('GIVEN no lock THEN every field is editable', () => {
      renderHost()

      expect(nameInput()).toBeEnabled()
      expect(codeInput()).toBeEnabled()
      expect(currencyInput()).toBeEnabled()
      expect(invoiceDisplayNameInput()).toBeEnabled()
    })

    it('GIVEN disableCodeInput THEN only the code is locked', () => {
      renderHost({ isEdit: true, disableCodeInput: true })

      expect(codeInput()).toBeDisabled()
      expect(nameInput()).toBeEnabled()
      expect(currencyInput()).toBeEnabled()
      expect(invoiceDisplayNameInput()).toBeEnabled()
    })

    it('GIVEN disableCurrencyInput THEN only the currency is locked', () => {
      renderHost({ isEdit: true, disableCurrencyInput: true })

      expect(currencyInput()).toBeDisabled()
      expect(nameInput()).toBeEnabled()
      expect(codeInput()).toBeEnabled()
      expect(invoiceDisplayNameInput()).toBeEnabled()
    })

    // `updateCatalogPlan` accepts name and invoiceDisplayName on a
    // contract-attached plan; re-freezing them here would block a legal edit.
    it('GIVEN both locks THEN name, description and invoice display name stay editable', () => {
      renderHost({
        isEdit: true,
        disableCodeInput: true,
        disableCurrencyInput: true,
        values: { description: 'Existing' },
      })

      expect(codeInput()).toBeDisabled()
      expect(currencyInput()).toBeDisabled()
      expect(nameInput()).toBeEnabled()
      expect(descriptionInput()).toBeEnabled()
      expect(invoiceDisplayNameInput()).toBeEnabled()
    })
  })

  it('GIVEN an existing description THEN reveals the description field', () => {
    renderHost({ values: { description: 'Existing' } })

    expect(screen.getByDisplayValue('Existing')).toBeInTheDocument()
  })

  it('GIVEN no description THEN shows the add-description button instead', () => {
    renderHost()

    expect(screen.getByText(ADD_DESCRIPTION_BUTTON_KEY)).toBeInTheDocument()
  })

  it('GIVEN clicking add description THEN reveals the description field', async () => {
    renderHost()

    await userEvent.click(screen.getByTestId(CATALOG_PLAN_DRAWER_SHOW_DESCRIPTION_TEST_ID))

    expect(descriptionInput()).toBeInTheDocument()
  })

  it('GIVEN clicking remove on an existing description THEN hides it again', async () => {
    renderHost({ values: { description: 'Existing' } })

    await userEvent.click(screen.getByTestId(CATALOG_PLAN_DRAWER_REMOVE_DESCRIPTION_TEST_ID))

    expect(screen.queryByLabelText(DESCRIPTION_LABEL_KEY)).not.toBeInTheDocument()
    expect(screen.getByText(ADD_DESCRIPTION_BUTTON_KEY)).toBeInTheDocument()
  })

  it('GIVEN edit mode THEN titles the body Edit plan', () => {
    renderHost({ isEdit: true, values: { name: 'Premium', currency: CurrencyEnum.Usd } })

    expect(screen.getByText(CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY)).toBeInTheDocument()
  })

  describe('metadata', () => {
    it('GIVEN stored pairs THEN shows the metadata accordion', () => {
      renderHost({ isEdit: true, values: { metadata: [{ key: 'region', value: 'eu' }] } })

      expect(screen.getByTestId(METADATA_ACCORDION_TEST_ID)).toBeInTheDocument()
    })

    it('GIVEN no pairs THEN offers to add metadata without an accordion', () => {
      renderHost()

      expect(screen.getByTestId(ADD_METADATA_TEST_ID)).toBeInTheDocument()
      expect(screen.queryByTestId(METADATA_ACCORDION_TEST_ID)).not.toBeInTheDocument()
    })

    it('GIVEN a click on add metadata THEN opens the metadata drawer with the stored pairs', async () => {
      renderHost({ isEdit: true, values: { metadata: [{ key: 'region', value: 'eu' }] } })

      await userEvent.click(screen.getByTestId(ADD_METADATA_TEST_ID))

      expect(mockOpenMetadataDrawer).toHaveBeenCalledWith(
        { metadata: [{ key: 'region', value: 'eu' }] },
        { appendEmptyRow: true },
      )
    })

    it('GIVEN the metadata drawer saves THEN shows the metadata accordion', () => {
      renderHost()

      act(() => capturedMetadataDrawerProps.onSave({ metadata: [{ key: 'tier', value: 'gold' }] }))

      expect(screen.getByTestId(METADATA_ACCORDION_TEST_ID)).toBeInTheDocument()
    })

    it('GIVEN the edit action on two pairs THEN opens the drawer with both and no empty row', async () => {
      const pairs = [
        { key: 'region', value: 'eu' },
        { key: 'tier', value: 'gold' },
      ]

      renderHost({ isEdit: true, values: { metadata: pairs } })

      await userEvent.click(screen.getByTestId(`${METADATA_ACCORDION_TEST_ID}-actions`))
      await userEvent.click(screen.getByText(EDIT_METADATA_ACTION_KEY))

      expect(mockOpenMetadataDrawer).toHaveBeenCalledWith({ metadata: pairs })
    })

    it('GIVEN the accordion delete-all action confirmed THEN empties the form metadata', async () => {
      renderHost({ isEdit: true, values: { metadata: [{ key: 'region', value: 'eu' }] } })

      await userEvent.click(screen.getByTestId(`${METADATA_ACCORDION_TEST_ID}-actions`))
      await userEvent.click(screen.getByText(DELETE_ALL_METADATA_ACTION_KEY))

      expect(hostForm.state.values.metadata).toEqual([])
      expect(screen.queryByTestId(METADATA_ACCORDION_TEST_ID)).not.toBeInTheDocument()
    })

    it('GIVEN the max count of pairs THEN disables adding metadata', () => {
      const maxedOut = Array.from({ length: MAX_ITEM_METADATA_COUNT }, (_, index) => ({
        key: `key_${index}`,
        value: `value_${index}`,
      }))

      renderHost({ isEdit: true, values: { metadata: maxedOut } })

      expect(screen.getByTestId(ADD_METADATA_TEST_ID)).toBeDisabled()
    })

    it('GIVEN the metadata drawer deletes every pair THEN removes the accordion', () => {
      renderHost({ isEdit: true, values: { metadata: [{ key: 'region', value: 'eu' }] } })

      act(() => capturedMetadataDrawerProps.onDelete?.())

      expect(hostForm.state.values.metadata).toEqual([])
      expect(screen.queryByTestId(METADATA_ACCORDION_TEST_ID)).not.toBeInTheDocument()
    })
  })
})
