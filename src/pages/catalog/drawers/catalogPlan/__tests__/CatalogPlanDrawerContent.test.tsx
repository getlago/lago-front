import { revalidateLogic } from '@tanstack/react-form'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { CurrencyEnum } from '~/generated/graphql'
import { useAppForm } from '~/hooks/forms/useAppform'
import { AllTheProviders } from '~/test-utils'

import { CatalogPlanDrawerContent } from '../CatalogPlanDrawerContent'
import {
  CATALOG_PLAN_DRAWER_REMOVE_DESCRIPTION_TEST_ID,
  CATALOG_PLAN_DRAWER_SHOW_DESCRIPTION_TEST_ID,
  CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY,
  CATALOG_PLAN_FORM_DEFAULTS,
  CatalogPlanFormValues,
} from '../constants'
import { catalogPlanSchema } from '../schema'

jest.mock('~/hooks/core/useInternationalization', () => ({
  useInternationalization: () => ({ translate: (key: string) => key }),
}))

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
})
