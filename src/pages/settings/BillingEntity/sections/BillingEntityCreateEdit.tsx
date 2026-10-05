import { revalidateLogic, useStore } from '@tanstack/react-form'
import { ReactNode, useCallback, useEffect } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { LogoPicker } from '~/components/LogoPicker'
import { DOCUMENTATION_EINVOICING } from '~/core/constants/externalUrls'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { applyExistingCodeError, EXISTING_CODE_FIELD_ERRORS } from '~/core/form/existingCodeError'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import { CountryCode } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import useCreateEditBillingEntity from '~/hooks/useCreateEditBillingEntity'
import { MANDATORY_EINVOICING_COUNTRIES } from '~/pages/settings/BillingEntity/const'
import {
  billingEntityCreateEditValidationSchema,
  BillingEntityCreateEditValues,
} from '~/pages/settings/BillingEntity/sections/billingEntityCreateEdit/validationSchema'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

export const BILLING_ENTITY_CREATE_EDIT_FORM_ID = 'billing-entity-create-edit-form'
export const BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID = 'billing-entity-name-input'
export const BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID = 'billing-entity-code-input'
export const BILLING_ENTITY_CREATE_EDIT_COUNTRY_INPUT_TEST_ID = 'billing-entity-country-input'
export const BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID =
  'billing-entity-einvoicing-switch'
export const BILLING_ENTITY_CREATE_EDIT_CLOSE_BUTTON_TEST_ID = 'billing-entity-close-button'
export const BILLING_ENTITY_CREATE_EDIT_CANCEL_BUTTON_TEST_ID = 'billing-entity-cancel-button'
export const BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID = 'billing-entity-submit-button'

const COMPANY_FIELDS = [
  {
    name: 'legalName',
    label: 'text_62ab2d0396dd6b0361614d40',
    placeholder: 'text_62ab2d0396dd6b0361614d48',
  },
  {
    name: 'legalNumber',
    label: 'text_62ab2d0396dd6b0361614d50',
    placeholder: 'text_62ab2d0396dd6b0361614d58',
  },
  {
    name: 'taxIdentificationNumber',
    label: 'text_648053ee819b60364c675d05',
    placeholder: 'text_648053ee819b60364c675d0b',
  },
] as const

const ADDRESS_FIELDS = [
  { name: 'addressLine2', placeholder: 'text_62ab2d0396dd6b0361614d80' },
  { name: 'zipcode', placeholder: 'text_62ab2d0396dd6b0361614d88' },
  { name: 'city', placeholder: 'text_62ab2d0396dd6b0361614d90' },
  { name: 'state', placeholder: 'text_62ab2d0396dd6b0361614d98' },
] as const

const isMandatoryEinvoicingCountry = (country?: CountryCode): boolean =>
  !!country && MANDATORY_EINVOICING_COUNTRIES.includes(country)

const einvoicingForCountry = (
  country?: CountryCode,
  einvoicing?: boolean | null,
): boolean | undefined => {
  if (!isMandatoryEinvoicingCountry(country)) return undefined

  return einvoicing || false
}

const BillingEntityCreateEdit = () => {
  const { translate } = useInternationalization()

  const { isEdition, errorCode, loading, onClose, onSave, billingEntity } =
    useCreateEditBillingEntity()

  const centralizedDialog = useCentralizedDialog()

  const openDirtyAttributesWarning = useCallback(() => {
    centralizedDialog.open({
      title: translate('text_6244277fe0975300fe3fb940'),
      description: translate('text_6244277fe0975300fe3fb946'),
      actionText: translate('text_6244277fe0975300fe3fb94c'),
      colorVariant: 'danger',
      onAction: () => onClose(),
    })
  }, [centralizedDialog, onClose, translate])

  const defaultValues: BillingEntityCreateEditValues = {
    name: billingEntity?.name || '',
    code: billingEntity?.code || '',
    legalName: billingEntity?.legalName || '',
    legalNumber: billingEntity?.legalNumber || '',
    taxIdentificationNumber: billingEntity?.taxIdentificationNumber || '',
    email: billingEntity?.email || '',
    phone: billingEntity?.phone || '',
    addressLine1: billingEntity?.addressLine1 || '',
    addressLine2: billingEntity?.addressLine2 || '',
    zipcode: billingEntity?.zipcode || '',
    city: billingEntity?.city || '',
    state: billingEntity?.state || '',
    country: billingEntity?.country || undefined,
    logo: undefined,
    einvoicing: einvoicingForCountry(
      billingEntity?.country || undefined,
      billingEntity?.einvoicing,
    ),
  }

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: billingEntityCreateEditValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        ...value,
        phone: value.phone || null,
      })
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(
        BILLING_ENTITY_CREATE_EDIT_FORM_ID,
        formApi.state.errorMap.onDynamic || {},
      )
    },
  })

  // Not `[billingEntity]`: `enableReinitialize` deep-compared `initialValues`, so a field the
  // form does not hold changing never reset it. The object's identity changes on any of them.
  const defaultValuesKey = JSON.stringify(defaultValues)

  useEffect(() => {
    if (billingEntity) {
      form.reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValuesKey])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      applyExistingCodeError(form)
      scrollToFirstInputError(BILLING_ENTITY_CREATE_EDIT_FORM_ID, EXISTING_CODE_FIELD_ERRORS)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const country = useStore(form.store, (state) => state.values.country)
  const logo = useStore(form.store, (state) => state.values.logo)

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault()
    form.handleSubmit()
  }

  const handleClose = (): void => {
    if (isDirty) {
      openDirtyAttributesWarning()
      return
    }

    onClose()
  }

  const renderEinvoicingField = (): ReactNode => {
    if (!isMandatoryEinvoicingCountry(country)) {
      return (
        <Alert type="warning">
          <Typography
            className="word-break-word"
            color="textSecondary"
            html={translate('text_176010285376748i8jr0rwn2', {
              href: DOCUMENTATION_EINVOICING,
            })}
          />
        </Alert>
      )
    }

    return (
      <form.AppField name="einvoicing">
        {(field) => (
          <field.SwitchField
            label={translate('text_1760103938878g88itu3cdah')}
            subLabel={translate('text_1760103938878069h2vcfis3')}
            dataTest={BILLING_ENTITY_CREATE_EDIT_EINVOICING_SWITCH_TEST_ID}
          />
        )}
      </form.AppField>
    )
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={BILLING_ENTITY_CREATE_EDIT_FORM_ID}
        className="flex min-h-full flex-col"
        onSubmit={handleSubmit}
      >
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {isEdition && translate('text_1743077296189h6w5gkxmgwz')}
            {!isEdition && translate('text_17423672666602uggxpe1r0v')}
          </Typography>

          <Button
            variant="quaternary"
            icon="close"
            data-test={BILLING_ENTITY_CREATE_EDIT_CLOSE_BUTTON_TEST_ID}
            onClick={handleClose}
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {loading && <FormLoadingSkeleton id="create-billing-entity" />}

          {!loading && (
            <>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="textSecondary">
                  {translate('text_1743077296189ms0shds6g53')}
                </Typography>
                <Typography variant="body">{translate('text_1743077296189ji809eyi90y')}</Typography>
              </div>

              <div className="flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_1743077296189sv3omf8cjep')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1743077296189q2ukwvbtf5y')}
                    </Typography>
                  </div>
                  <NameAndCodeGroup
                    form={form}
                    fields={{ name: 'name', code: 'code' }}
                    disableCodeInput={isEdition}
                    disableAutoGenerateCode={isEdition}
                    nameDataTest={BILLING_ENTITY_CREATE_EDIT_NAME_INPUT_TEST_ID}
                    codeDataTest={BILLING_ENTITY_CREATE_EDIT_CODE_INPUT_TEST_ID}
                    nameProps={{
                      autoFocus: true,
                      label: translate('text_6419c64eace749372fc72b0f'),
                      placeholder: translate('text_6584550dc4cec7adf861504f'),
                    }}
                    codeProps={{
                      label: translate('text_62876e85e32e0300e1803127'),
                      placeholder: translate('text_6584550dc4cec7adf8615053'),
                    }}
                  />
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_17430772961890sgj8ku8lmp')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1743077296189mme3pwm3xxu')}
                    </Typography>
                  </div>

                  <div className="mb-8 flex flex-col gap-6">
                    <LogoPicker
                      logoValue={logo}
                      onChange={(value) => form.setFieldValue('logo', value)}
                      logoUrl={billingEntity?.logoUrl}
                      name={billingEntity?.name}
                    />

                    {COMPANY_FIELDS.map(({ name, label, placeholder }) => (
                      <form.AppField key={name} name={name}>
                        {(field) => (
                          <field.TextInputField
                            label={translate(label)}
                            placeholder={translate(placeholder)}
                          />
                        )}
                      </form.AppField>
                    ))}

                    <form.AppField name="email">
                      {(field) => (
                        <field.TextInputField
                          beforeChangeFormatter={['lowercase']}
                          label={translate('text_62ab2d0396dd6b0361614d60')}
                          placeholder={translate('text_62ab2d0396dd6b0361614d68')}
                        />
                      )}
                    </form.AppField>

                    <form.AppField name="phone">
                      {(field) => (
                        <field.TextInputField
                          label={translate('text_626c0c09812bbc00e4c59e0d')}
                          placeholder={translate('text_626c0c09812bbc00e4c59e0f')}
                        />
                      )}
                    </form.AppField>

                    <div className="flex flex-col gap-4">
                      <form.AppField name="addressLine1">
                        {(field) => (
                          <field.TextInputField
                            label={translate('text_62ab2d0396dd6b0361614d70')}
                            placeholder={translate('text_62ab2d0396dd6b0361614d78')}
                          />
                        )}
                      </form.AppField>

                      {ADDRESS_FIELDS.map(({ name, placeholder }) => (
                        <form.AppField key={name} name={name}>
                          {(field) => <field.TextInputField placeholder={translate(placeholder)} />}
                        </form.AppField>
                      ))}

                      <form.AppField
                        name="country"
                        listeners={{
                          onChange: ({ value }) => {
                            form.setFieldValue(
                              'einvoicing',
                              einvoicingForCountry(value, form.state.values.einvoicing),
                            )
                          },
                        }}
                      >
                        {(field) => (
                          <field.ComboBoxField
                            data={countryDataForCombobox}
                            placeholder={translate('text_62ab2d0396dd6b0361614da0')}
                            PopperProps={{ displayInDialog: true }}
                            dataTest={BILLING_ENTITY_CREATE_EDIT_COUNTRY_INPUT_TEST_ID}
                          />
                        )}
                      </form.AppField>
                    </div>
                  </div>
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_1760101157939jviogsjfcsn')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1760101157939mnmlyzbp7ao')}
                    </Typography>
                  </div>
                  <div className="mb-8 flex flex-col gap-6">{renderEinvoicingField()}</div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            data-test={BILLING_ENTITY_CREATE_EDIT_CANCEL_BUTTON_TEST_ID}
            onClick={handleClose}
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>

          <form.AppForm>
            <form.SubmitButton dataTest={BILLING_ENTITY_CREATE_EDIT_SUBMIT_BUTTON_TEST_ID}>
              {isEdition && translate('text_17432414198706rdwf76ek3u')}

              {!isEdition && translate('text_174324141987010zhlfvyidj')}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default BillingEntityCreateEdit
