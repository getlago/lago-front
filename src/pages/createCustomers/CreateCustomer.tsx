import { revalidateLogic } from '@tanstack/react-form'
import { Icon } from 'lago-design-system'
import { useCallback, useMemo, useRef } from 'react'

import { Button, Typography } from '~/components/designSystem'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import {
  CreateCustomerInput,
  CustomerAccountTypeEnum,
  PremiumIntegrationTypeEnum,
  UpdateCustomerInput,
  useGetBillingEntitiesQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCreateEditCustomer } from '~/hooks/useCreateEditCustomer'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import BillingAccordion from './billingAccordion/BillingAccordion'
import CustomerInformation from './customerInformation/CustomerInformation'
import ExternalAppsAccordion from './externalAppsAccordion/ExternalAppsAccordion'
import { getDefaultValues } from './formInitialization/getDefaultValues'
import { validationSchema } from './formInitialization/validationSchema'
import MetadataAccordion from './metadataAccordion/MetadataAccordion'

const CreateCustomer = () => {
  const { translate } = useInternationalization()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const hasAccessToRevenueShare = !!premiumIntegrations?.includes(
    PremiumIntegrationTypeEnum.RevenueShare,
  )

  const { isEdition, onSave, customer, loading, onClose } = useCreateEditCustomer()

  const { data: billingEntitiesData, loading: isLoadingBillingEntities } =
    useGetBillingEntitiesQuery()

  const billingEntitiesList = useMemo(
    () =>
      billingEntitiesData?.billingEntities?.collection
        ?.map((billingEntity) => ({
          label: `${billingEntity.name || billingEntity.code}${billingEntity.isDefault ? ` (${translate('text_1744018116743pwoqp40bkhp')})` : ''}`,
          value: billingEntity.code,
          isDefault: billingEntity.isDefault,
        }))
        .sort((a) => (a.isDefault ? -1 : 1)) || [],
    [billingEntitiesData, translate],
  )

  const defaultBillingEntity = billingEntitiesList.find((b) => b.isDefault)

  const canEditAccountType =
    hasAccessToRevenueShare && (isEdition ? customer?.canEditAttributes : true)

  const form = useAppForm({
    defaultValues: getDefaultValues(customer, defaultBillingEntity),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async (values) => {
      // isPartner is only used for display purpose and should not be sent to API
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { email, metadata, isPartner: _isPartner, ...restValues } = values.value

      const formattedEmail = email
        ?.split(',')
        .map((mail) => mail.trim())
        .join(',')

      const saveParameters: (CreateCustomerInput | UpdateCustomerInput) & { isPartner?: boolean } =
        {
          ...restValues,
          email: formattedEmail,
          metadata: (metadata || []).map((m) => ({
            key: m.key,
            value: m.value,
            // Should not occur in this case since we have the displayInInvoice displayed but not all metadata have
            displayInInvoice: m.displayInInvoice || false,
          })),
        }

      const answer = await onSave(saveParameters)

      const { errors } = answer

      /* TODO: Remove this line */
      // eslint-disable-next-line no-console
      console.log('errors', errors)
    },
  })

  const handleAbort = useCallback(() => {
    form.state.isDirty ? warningDialogRef.current?.openDialog() : onClose()
  }, [form.state.isDirty, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  const getSubmitButtonText = () => {
    return isEdition
      ? translate('text_1735651472114fzhjvrrcumw')
      : translate('text_1734452833961s338w0x3b4s')
  }

  return (
    <CenteredPage.Wrapper>
      <form onSubmit={handleSubmit}>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {isEdition
              ? translate('text_1735651472114fzhjvrrcumw')
              : translate('text_1734452833961s338w0x3b4s')}
          </Typography>
          <Button variant="quaternary" icon="close" onClick={handleAbort} />
        </CenteredPage.Header>

        {loading && (
          <CenteredPage.Container>
            <FormLoadingSkeleton id="create-customer" />
          </CenteredPage.Container>
        )}

        {!loading && (
          <CenteredPage.Container>
            <div className="not-last-child:mb-1">
              <Typography variant="headline" color="textSecondary">
                {isEdition
                  ? translate('text_1735651472114fzhjvrrcumw')
                  : translate('text_1734452833961s338w0x3b4s')}
              </Typography>
              <Typography variant="body">{translate('text_1734452833961ix7z38723pg')}</Typography>
            </div>

            <div className="mb-8 flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
              {/* eslint-disable-next-line */}
              <div
                className="flex items-center justify-between"
                onClick={() => {
                  if (!hasAccessToRevenueShare) {
                    premiumWarningDialogRef.current?.openDialog()
                  }
                }}
              >
                <form.AppField
                  name="isPartner"
                  listeners={{
                    onChange: ({ value }) => {
                      form.setFieldValue(
                        'accountType',
                        value ? CustomerAccountTypeEnum.Partner : null,
                      )
                    },
                  }}
                >
                  {(field) => (
                    <field.SwitchField
                      label={translate('text_173832066416253fgbilrnae')}
                      subLabel={translate('text_173832066416219scp0nqeo8')}
                      labelPosition="right"
                      disabled={!canEditAccountType}
                    />
                  )}
                </form.AppField>

                {!hasAccessToRevenueShare && <Icon name="sparkles" />}
              </div>

              <CustomerInformation
                form={form}
                isEdition={isEdition}
                isLoadingBillingEntities={isLoadingBillingEntities}
                customer={customer}
                billingEntitiesList={billingEntitiesList}
              />
              <BillingAccordion form={form} isEdition={isEdition} customer={customer} />
              <MetadataAccordion form={form} />
              <ExternalAppsAccordion form={form} isEdition={isEdition} />
            </div>
          </CenteredPage.Container>
        )}

        <CenteredPage.StickyFooter>
          <Button size="large" variant="quaternary" onClick={handleAbort}>
            {translate('text_62e79671d23ae6ff149de968')}
          </Button>
          <form.AppForm>
            <form.SubmitButton>{getSubmitButtonText()}</form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={onClose}
      />

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
    </CenteredPage.Wrapper>
  )
}

export default CreateCustomer
