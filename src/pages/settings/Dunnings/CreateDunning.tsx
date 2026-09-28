import InputAdornment from '@mui/material/InputAdornment'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { ToggleableFieldAddButton, ToggleableFieldRow } from '~/components/form/ToggleableFieldRow'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useDefaultCampaignDialog } from '~/components/settings/dunnings/DefaultCampaignDialog'
import {
  PreviewCampaignEmailDrawer,
  PreviewCampaignEmailDrawerRef,
} from '~/components/settings/dunnings/PreviewCampaignEmailDrawer'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { DUNNINGS_SETTINGS_ROUTE, useNavigate } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { scrollToTop } from '~/core/utils/domUtils'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCreateEditDunningCampaign } from '~/hooks/useCreateEditDunningCampaign'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import {
  dunningCampaignFormSchema,
  DunningCampaignFormValues,
} from './createDunning/validationSchema'

export const CREATE_DUNNING_FORM_ID = 'create-dunning-form'
export const CREATE_DUNNING_CLOSE_BUTTON_TEST_ID = 'create-dunning-close'
export const CREATE_DUNNING_CANCEL_BUTTON_TEST_ID = 'create-dunning-cancel'
export const CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID = 'create-dunning-submit'
export const CREATE_DUNNING_SHOW_DESCRIPTION_TEST_ID = 'show-description'
export const CREATE_DUNNING_DELETE_DESCRIPTION_TEST_ID = 'create-dunning-delete-description'
export const CREATE_DUNNING_SHOW_BCC_EMAILS_TEST_ID = 'show-bcc-emails'
export const CREATE_DUNNING_DELETE_BCC_EMAILS_TEST_ID = 'create-dunning-delete-bcc-emails'
export const CREATE_DUNNING_ADD_THRESHOLD_TEST_ID = 'create-dunning-add-threshold'
export const CREATE_DUNNING_DELETE_THRESHOLD_TEST_ID = 'create-dunning-delete-threshold'
export const CREATE_DUNNING_PREVIEW_EMAIL_TEST_ID = 'create-dunning-preview-email'

const CreateDunning = () => {
  const {
    isEdition,
    errorCode,
    loading,
    onClose,
    onSave,
    campaign,
    hasPaymentProviderExcludingGoCardless,
  } = useCreateEditDunningCampaign()
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const { openDefaultCampaignDialog } = useDefaultCampaignDialog()
  const centralizedDialog = useCentralizedDialog()
  const previewCampaignEmailDrawerRef = useRef<PreviewCampaignEmailDrawerRef>(null)

  const openDirtyAttributesWarning = () =>
    centralizedDialog.open({
      title: translate('text_6244277fe0975300fe3fb940'),
      description: translate('text_6244277fe0975300fe3fb946'),
      actionText: translate('text_6244277fe0975300fe3fb94c'),
      colorVariant: 'danger',
      onAction: () => navigate(DUNNINGS_SETTINGS_ROUTE),
    })

  const { organization: { defaultCurrency } = {} } = useOrganizationInfos()

  const defaultValues: DunningCampaignFormValues = {
    name: campaign?.name || '',
    code: campaign?.code || '',
    description: campaign?.description || '',
    thresholds: campaign?.thresholds
      ? campaign.thresholds.map((threshold) => ({
          currency: threshold.currency,
          amountCents: String(deserializeAmount(threshold.amountCents, threshold.currency)),
        }))
      : [
          {
            currency: defaultCurrency ?? CurrencyEnum.Usd,
            amountCents: '',
          },
        ],
    daysBetweenAttempts: campaign?.daysBetweenAttempts ? String(campaign.daysBetweenAttempts) : '',
    maxAttempts: campaign?.maxAttempts ? String(campaign.maxAttempts) : '',
    bccEmails: campaign?.bccEmails?.join(',') || '',
    appliedToOrganization: campaign?.appliedToOrganization || false,
  }

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: dunningCampaignFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        ...value,
        thresholds: value.thresholds.map(({ currency, amountCents }) => ({
          currency: currency as CurrencyEnum,
          amountCents,
        })),
      })
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(CREATE_DUNNING_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  useEffect(() => {
    form.reset(defaultValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, defaultCurrency])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      applyExistingCodeError(form)
      scrollToTop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const thresholds = useStore(form.store, (state) => state.values.thresholds)

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(!!campaign?.description)
  const [shouldDisplayBCCEmails, setShouldDisplayBCCEmails] = useState(
    !!campaign?.bccEmails?.length,
  )

  useEffect(() => {
    setShouldDisplayDescription(!!campaign?.description)
    setShouldDisplayBCCEmails(!!campaign?.bccEmails?.length)
  }, [campaign])

  const renderAttemptsField = ({
    name,
    label,
    unit,
  }: {
    name: 'daysBetweenAttempts' | 'maxAttempts'
    label: string
    unit: string
  }) => (
    <form.AppField name={name}>
      {(field) => (
        <field.TextInputField
          label={label}
          placeholder="0"
          beforeChangeFormatter={['positiveNumber']}
          InputProps={{
            endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
          }}
        />
      )}
    </form.AppField>
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const becomesDefaultCampaign =
      !campaign?.appliedToOrganization && form.state.values.appliedToOrganization

    if (becomesDefaultCampaign) {
      return openDefaultCampaignDialog({
        type: 'setDefault',
        onConfirm: () => form.handleSubmit(),
      })
    }

    form.handleSubmit()
  }

  return (
    <>
      <CenteredPage.Wrapper>
        <form
          id={CREATE_DUNNING_FORM_ID}
          className="flex min-h-full flex-col"
          onSubmit={handleSubmit}
        >
          <CenteredPage.Header>
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate(
                isEdition ? 'text_17322041874138xkertqxbqz' : 'text_17285840281865oxs4lxfs6j',
              )}
            </Typography>
            <Button
              variant="quaternary"
              icon="close"
              data-test={CREATE_DUNNING_CLOSE_BUTTON_TEST_ID}
              onClick={() => (isDirty ? openDirtyAttributesWarning() : onClose())}
            />
          </CenteredPage.Header>

          <CenteredPage.Container>
            {loading ? (
              <FormLoadingSkeleton id="create-dunning" />
            ) : (
              <>
                {isEdition && (
                  <Alert type="warning">{translate('text_1732187313660ghhrj235mxg')}</Alert>
                )}

                <CenteredPage.PageTitle
                  title={translate('text_1728584028187fg2ebhssz6r')}
                  description={translate('text_1728584028187st1bmr7wdw9')}
                />

                <div className="flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
                  <section className="not-last-child:mb-6">
                    <CenteredPage.PageSectionTitle
                      title={translate('text_1728584028187on239g4adt5')}
                      description={translate('text_1728584028187im92nik4ff8')}
                    />
                    <NameAndCodeGroup
                      form={form}
                      fields={{ name: 'name', code: 'code' }}
                      disableAutoGenerateCode={isEdition}
                      nameProps={{ autoFocus: true }}
                    />
                    {shouldDisplayDescription ? (
                      <ToggleableFieldRow
                        rowClassName="flex items-center gap-2"
                        tooltipClassName=""
                        removeDataTest={CREATE_DUNNING_DELETE_DESCRIPTION_TEST_ID}
                        onRemove={() => {
                          form.setFieldValue('description', '')
                          setShouldDisplayDescription(false)
                        }}
                      >
                        <form.AppField name="description">
                          {(field) => (
                            <field.TextInputField
                              className="flex-1"
                              label={translate('text_623b42ff8ee4e000ba87d0c8')}
                              placeholder={translate('text_1728584028187uqs16ra27ef')}
                              rows="3"
                              multiline
                            />
                          )}
                        </form.AppField>
                      </ToggleableFieldRow>
                    ) : (
                      <ToggleableFieldAddButton
                        label={translate('text_642d5eb2783a2ad10d670324')}
                        dataTest={CREATE_DUNNING_SHOW_DESCRIPTION_TEST_ID}
                        onClick={() => setShouldDisplayDescription(true)}
                      />
                    )}
                  </section>

                  <section className="not-last-child:mb-6">
                    <CenteredPage.PageSectionTitle
                      title={translate('text_1742392390147aoog6603wwy')}
                      description={translate('text_1742392390147fju3ihxmtin')}
                    />

                    <div className="flex flex-col gap-6">
                      {thresholds.map((_threshold, index) => {
                        const key = `thresholds[${index}]` as const

                        return (
                          <div key={key} className="flex flex-1 items-center gap-4">
                            <form.AppField name={`${key}.currency`}>
                              {(field) => (
                                <field.ComboBoxField
                                  className="w-30"
                                  data={Object.values(CurrencyEnum).map((currency) => ({
                                    label: currency,
                                    value: currency,
                                    disabled: thresholds.some(
                                      (localThreshold) => localThreshold.currency === currency,
                                    ),
                                  }))}
                                  placeholder={translate('text_632c6e59b73f9a54d4c7224b')}
                                  disableClearable
                                />
                              )}
                            </form.AppField>
                            <form.AppField name={`${key}.amountCents`}>
                              {(field) => (
                                <field.AmountInputField
                                  className="flex-1"
                                  currency={CurrencyEnum.Usd}
                                  beforeChangeFormatter={['positiveNumber']}
                                />
                              )}
                            </form.AppField>
                            {index > 0 && (
                              <Tooltip
                                placement="top-end"
                                title={translate('text_63aa085d28b8510cd46443ff')}
                              >
                                <Button
                                  icon="trash"
                                  variant="quaternary"
                                  data-test={`${CREATE_DUNNING_DELETE_THRESHOLD_TEST_ID}-${index}`}
                                  onClick={() => {
                                    form.setFieldValue(
                                      'thresholds',
                                      thresholds.filter(
                                        (_localThreshold, localIndex) => localIndex !== index,
                                      ),
                                    )
                                  }}
                                />
                              </Tooltip>
                            )}
                          </div>
                        )
                      })}

                      <div>
                        <Button
                          startIcon="plus"
                          variant="inline"
                          data-test={CREATE_DUNNING_ADD_THRESHOLD_TEST_ID}
                          onClick={() =>
                            form.setFieldValue('thresholds', [
                              ...thresholds,
                              { currency: undefined, amountCents: '' },
                            ])
                          }
                        >
                          {translate('text_1728584028187rmbbvaboadk')}
                        </Button>
                      </div>
                    </div>
                  </section>

                  <section className="not-last-child:mb-6">
                    <CenteredPage.PageSectionTitle
                      title={translate('text_1742392390147pcg2p300roc')}
                      description={
                        <Typography variant="caption">
                          <span className="mr-1">
                            {hasPaymentProviderExcludingGoCardless
                              ? translate('text_1728584028187l2wdjy4s5cs')
                              : translate('text_17291534666709ytr7mi4jjl')}
                          </span>
                          <button
                            type="button"
                            className="h-auto p-0 text-blue-600 hover:underline focus:underline"
                            data-test={CREATE_DUNNING_PREVIEW_EMAIL_TEST_ID}
                            onClick={() => previewCampaignEmailDrawerRef.current?.openDrawer()}
                          >
                            {translate('text_1728584028187udjepvgj8ra')}
                          </button>
                        </Typography>
                      }
                    />

                    {renderAttemptsField({
                      name: 'daysBetweenAttempts',
                      label: translate('text_1728584028187al65i47z3qn'),
                      unit: translate('text_638dc196fb209d551f3d814d'),
                    })}
                    {renderAttemptsField({
                      name: 'maxAttempts',
                      label: translate('text_17285840281879mpfdrz2mmi'),
                      unit: translate('text_172858402818763zwy2u9e3t'),
                    })}
                    {shouldDisplayBCCEmails ? (
                      <ToggleableFieldRow
                        rowClassName="flex flex-1 items-center gap-4"
                        tooltipClassName=""
                        removeDataTest={CREATE_DUNNING_DELETE_BCC_EMAILS_TEST_ID}
                        onRemove={() => {
                          form.setFieldValue('bccEmails', '')
                          setShouldDisplayBCCEmails(false)
                        }}
                      >
                        <form.AppField name="bccEmails">
                          {(field) => (
                            <field.TextInputField
                              className="flex-1"
                              beforeChangeFormatter={['lowercase']}
                              label={translate('text_1742392390147xtfe9hub59a')}
                              placeholder={translate('text_1742392390147xia24oyubb3')}
                              helperText={translate('text_1742392390147638s3zam327')}
                            />
                          )}
                        </form.AppField>
                      </ToggleableFieldRow>
                    ) : (
                      <ToggleableFieldAddButton
                        label={translate('text_1742392390147d9jizkapiou')}
                        dataTest={CREATE_DUNNING_SHOW_BCC_EMAILS_TEST_ID}
                        onClick={() => setShouldDisplayBCCEmails(true)}
                      />
                    )}
                  </section>
                </div>
              </>
            )}
          </CenteredPage.Container>

          <CenteredPage.StickyFooter>
            <Button
              variant="quaternary"
              data-test={CREATE_DUNNING_CANCEL_BUTTON_TEST_ID}
              onClick={() =>
                isDirty ? openDirtyAttributesWarning() : navigate(DUNNINGS_SETTINGS_ROUTE)
              }
            >
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <form.AppForm>
              <form.SubmitButton variant="primary" dataTest={CREATE_DUNNING_SUBMIT_BUTTON_TEST_ID}>
                {translate(
                  isEdition ? 'text_17295436903260tlyb1gp1i7' : 'text_1742392390147u5hy5yetful',
                )}
              </form.SubmitButton>
            </form.AppForm>
          </CenteredPage.StickyFooter>
        </form>
      </CenteredPage.Wrapper>

      <PreviewCampaignEmailDrawer ref={previewCampaignEmailDrawerRef} />
    </>
  )
}

export default CreateDunning
