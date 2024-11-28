import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { array, boolean, number, object, string } from 'yup'

import { Alert, Button, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBoxField, SwitchField, TextInputField } from '~/components/form'
import {
  DefaultCampaignDialog,
  DefaultCampaignDialogRef,
} from '~/components/settings/dunnings/DefaultCampaignDialog'
import {
  PreviewCampaignEmailDrawer,
  PreviewCampaignEmailDrawerRef,
} from '~/components/settings/dunnings/PreviewCampaignEmailDrawer'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { DUNNINGS_SETTINGS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  DunningCampaignFormInput,
  useCreateEditDunningCampaign,
} from '~/hooks/useCreateEditDunningCampaign'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PageHeader } from '~/styles'

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

  const defaultCampaignDialogRef = useRef<DefaultCampaignDialogRef>(null)
  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const previewCampaignEmailDrawerRef = useRef<PreviewCampaignEmailDrawerRef>(null)

  const { organization: { defaultCurrency } = {} } = useOrganizationInfos()

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const formikProps = useFormik<DunningCampaignFormInput>({
    initialValues: {
      name: campaign?.name || '',
      code: campaign?.code || '',
      description: campaign?.description || '',
      thresholds: campaign?.thresholds
        ? campaign.thresholds.map((threshold) => ({
            ...threshold,
            amountCents: deserializeAmount(threshold.amountCents, threshold.currency),
          }))
        : [
            {
              currency: defaultCurrency ?? CurrencyEnum.Usd,
              amountCents: undefined,
            },
          ],
      daysBetweenAttempts: campaign?.daysBetweenAttempts
        ? String(campaign.daysBetweenAttempts)
        : '',
      maxAttempts: campaign?.maxAttempts ? String(campaign.maxAttempts) : '',
      appliedToOrganization: campaign?.appliedToOrganization || false,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      description: string(),
      thresholds: array()
        .of(
          object().shape({
            currency: string().required(''),
            amountCents: string().required(''),
          }),
        )
        .min(1, '')
        .test((thresholds) => {
          const currencies = thresholds?.map((t) => t.currency)

          return new Set(currencies).size === currencies?.length
        })
        .required(''),
      daysBetweenAttempts: number().min(1, '').required(''),
      maxAttempts: number().min(1, '').required(''),
      appliedToOrganization: boolean().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
    !!formikProps.initialValues.description,
  )

  const onSubmit = () => {
    if (
      // If the appliedToOrganization field has changed and is now true, open the default campaign dialog
      formikProps.initialValues.appliedToOrganization !==
        formikProps.values.appliedToOrganization &&
      formikProps.values.appliedToOrganization === true
    ) {
      defaultCampaignDialogRef.current?.openDialog({
        type: 'setDefault',
        onConfirm: () => formikProps.submitForm(),
      })
    } else {
      formikProps.submitForm()
    }
  }

  return (
    <>
      <div>
        <PageHeader>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate(
              isEdition ? 'text_17322041874138xkertqxbqz' : 'text_17285840281865oxs4lxfs6j',
            )}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              formikProps.dirty ? warningDirtyAttributesDialogRef.current?.openDialog() : onClose()
            }
          />
        </PageHeader>

        {loading ? (
          <div className="container mx-auto mb-15 mt-12 flex flex-col gap-12">
            <div>
              <Skeleton variant="text" className="mb-4 w-40" />
              <Skeleton variant="text" className="w-100" />
            </div>
            {[0, 1].map((_, index) => (
              <div key={`loading-${index}`}>
                <div className="flex flex-col gap-5 pb-12 shadow-b">
                  <Skeleton variant="text" className="w-40" />
                  <Skeleton variant="text" className="w-100" />
                  <Skeleton variant="text" className="w-74" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="container mx-auto mb-15 mt-12">
              {isEdition && (
                <Alert type="warning" className="mb-12">
                  {translate('text_1732187313660ghhrj235mxg')}
                </Alert>
              )}

              <div className="mb-12 not-last-child:mb-1">
                <Typography variant="headline" color="textSecondary">
                  {translate('text_1728584028187fg2ebhssz6r')}
                </Typography>
                <Typography variant="body">{translate('text_1728584028187st1bmr7wdw9')}</Typography>
              </div>

              <div className="flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1728584028187on239g4adt5')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1728584028187im92nik4ff8')}
                    </Typography>
                  </div>
                  <div className="flex items-start gap-6 *:flex-1">
                    <TextInputField
                      name="name"
                      formikProps={formikProps}
                      label={translate('text_6419c64eace749372fc72b0f')}
                      placeholder={translate('text_6584550dc4cec7adf861504f')}
                    />
                    <TextInputField
                      name="code"
                      beforeChangeFormatter="code"
                      formikProps={formikProps}
                      label={translate('text_62876e85e32e0300e1803127')}
                      placeholder={translate('text_6584550dc4cec7adf8615053')}
                    />
                  </div>
                  {shouldDisplayDescription ? (
                    <div className="flex items-center gap-2">
                      <TextInputField
                        className="flex-1"
                        name="description"
                        label={translate('text_623b42ff8ee4e000ba87d0c8')}
                        placeholder={translate('text_1728584028187uqs16ra27ef')}
                        rows="3"
                        multiline
                        formikProps={formikProps}
                      />

                      <Tooltip
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          onClick={() => {
                            formikProps.setFieldValue('description', '')
                            setShouldDisplayDescription(false)
                          }}
                        />
                      </Tooltip>
                    </div>
                  ) : (
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test="show-description"
                    >
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1728584028187jkklv61y8ik')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1728584028187dlpga1pd7f8')}
                    </Typography>
                  </div>

                  <div>
                    <Typography variant="captionHl" color="textSecondary" className="mb-1">
                      {translate('text_1728584028187gsi6wv2mf6y')}
                    </Typography>
                    <div className="flex flex-col gap-6">
                      {formikProps.values.thresholds.map((_threshold, index) => {
                        const key = `thresholds.${index}`

                        return (
                          <div key={key} className="flex flex-1 items-center gap-4">
                            <ComboBoxField
                              className="w-30"
                              name={`${key}.currency`}
                              formikProps={formikProps}
                              data={Object.values(CurrencyEnum).map((currency) => ({
                                label: currency,
                                value: currency,
                                disabled: formikProps.values.thresholds.some(
                                  (localThreshold) => localThreshold.currency === currency,
                                ),
                              }))}
                              placeholder={translate('text_632c6e59b73f9a54d4c7224b')}
                              disableClearable
                            />
                            <AmountInputField
                              className="flex-1"
                              name={`${key}.amountCents`}
                              formikProps={formikProps}
                              currency={CurrencyEnum.Usd}
                              beforeChangeFormatter={['positiveNumber']}
                            />
                            {index > 0 && (
                              <Tooltip
                                placement="top-end"
                                title={translate('text_63aa085d28b8510cd46443ff')}
                              >
                                <Button
                                  icon="trash"
                                  variant="quaternary"
                                  onClick={() => {
                                    const newThresholds = [...formikProps.values.thresholds]

                                    newThresholds.splice(index, 1)
                                    formikProps.setFieldValue('thresholds', newThresholds)
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
                          variant="quaternary"
                          onClick={() =>
                            formikProps.setFieldValue('thresholds', [
                              ...formikProps.values.thresholds,
                              { currency: undefined, amountCents: '' },
                            ])
                          }
                        >
                          {translate('text_1728584028187rmbbvaboadk')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1728584028187ij19lperkhf')}
                    </Typography>
                    <Typography variant="caption">
                      <span className="mr-1">
                        {hasPaymentProviderExcludingGoCardless
                          ? translate('text_1728584028187l2wdjy4s5cs')
                          : translate('text_17291534666709ytr7mi4jjl')}
                      </span>
                      <button
                        className="h-auto p-0 text-blue-600 hover:underline focus:underline"
                        onClick={() => previewCampaignEmailDrawerRef.current?.openDrawer()}
                      >
                        {translate('text_1728584028187udjepvgj8ra')}
                      </button>
                    </Typography>
                  </div>

                  <TextInputField
                    name="daysBetweenAttempts"
                    formikProps={formikProps}
                    label={translate('text_1728584028187al65i47z3qn')}
                    placeholder="0"
                    beforeChangeFormatter={['positiveNumber']}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {translate('text_638dc196fb209d551f3d814d')}
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextInputField
                    name="maxAttempts"
                    formikProps={formikProps}
                    label={translate('text_17285840281879mpfdrz2mmi')}
                    placeholder="0"
                    beforeChangeFormatter={['positiveNumber']}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {translate('text_172858402818763zwy2u9e3t')}
                        </InputAdornment>
                      ),
                    }}
                  />
                </section>

                <section className="not-last-child:mb-6">
                  <SwitchField
                    name="appliedToOrganization"
                    formikProps={formikProps}
                    label={translate('text_1728584028187cpxux50bk4n')}
                    subLabel={translate('text_1728584028187qei3xba4i02')}
                  />
                </section>
              </div>
            </div>

            <footer className="sticky bottom-0 mt-20 flex h-20 border border-grey-200 bg-white">
              <div className="container mx-auto flex h-full items-center justify-end">
                <div className="flex items-center gap-6">
                  <Button
                    variant="quaternary"
                    onClick={() =>
                      formikProps.dirty
                        ? warningDirtyAttributesDialogRef.current?.openDialog()
                        : navigate(DUNNINGS_SETTINGS_ROUTE)
                    }
                  >
                    {translate('text_6411e6b530cb47007488b027')}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!formikProps.isValid || !formikProps.dirty}
                    onClick={onSubmit}
                  >
                    {translate(
                      isEdition ? 'text_17295436903260tlyb1gp1i7' : 'text_1728584028187oqpu20oxuxq',
                    )}
                  </Button>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>
      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_6244277fe0975300fe3fb946')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={() => navigate(DUNNINGS_SETTINGS_ROUTE)}
      />
      <DefaultCampaignDialog ref={defaultCampaignDialogRef} />
      <PreviewCampaignEmailDrawer ref={previewCampaignEmailDrawerRef} />
    </>
  )
}

export default CreateDunning
