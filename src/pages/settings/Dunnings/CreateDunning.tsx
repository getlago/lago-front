import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBoxField, Switch, TextInputField } from '~/components/form'
import {
  DefaultCampaignDialog,
  DefaultCampaignDialogRef,
} from '~/components/settings/dunnings/DefaultCampaignDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { DUNNINGS_SETTINGS_ROUTE } from '~/core/router'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PageHeader } from '~/styles'
import { Divider } from '~/styles/mainObjectsForm'

const CreateDunning = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const defaultCampaignDialog = useRef<DefaultCampaignDialogRef>(null)
  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)

  const { organization: { defaultCurrency } = {} } = useOrganizationInfos()

  const formikProps = useFormik({
    initialValues: {
      name: '',
      code: '',
      description: '',
      thresholds: [
        {
          currency: defaultCurrency,
          amount: '0',
        },
      ],
      delays: '',
      retry: '',
      isDefault: false,
    },
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: () => {
      console.log('Submit')
    },
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
    !!formikProps.initialValues.description,
  )
  const [localThresholds, setLocalThresholds] = useState(formikProps.values.thresholds)

  return (
    <>
      <div>
        <PageHeader>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_17285840281865oxs4lxfs6j')}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              formikProps.dirty
                ? warningDirtyAttributesDialogRef.current?.openDialog()
                : navigate(DUNNINGS_SETTINGS_ROUTE)
            }
          />
        </PageHeader>

        <div className="container mx-auto mb-15 mt-12 flex flex-col gap-12">
          <div>
            <Typography variant="headline" color="textSecondary">
              {translate('text_1728584028187fg2ebhssz6r')}
            </Typography>
            <Typography variant="body">{translate('text_1728584028187st1bmr7wdw9')}</Typography>
          </div>

          <section className="not-last-child:mb-6">
            <div className="not-last-child:mb-2">
              <Typography variant="subhead">
                {translate('text_1728584028187on239g4adt5')}
              </Typography>
              <Typography variant="caption">
                {translate('text_1728584028187im92nik4ff8')}
              </Typography>
            </div>
            <div className="flex items-center gap-6 *:flex-1">
              <TextInputField
                name="name"
                formikProps={formikProps}
                label={translate('text_6419c64eace749372fc72b0f')}
                placeholder={translate('text_6584550dc4cec7adf861504f')}
              />
              <TextInputField
                name="code"
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

                <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
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

          <Divider />

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
                {localThresholds.map((_threshold, index) => {
                  const key = `thresholds.${index}`

                  return (
                    <div key={key} className="flex flex-1 items-center gap-4">
                      <ComboBoxField
                        className="w-30"
                        name={`${key}.currency`}
                        formikProps={formikProps}
                        data={Object.values(CurrencyEnum).map((currencyType) => ({
                          value: currencyType,
                        }))}
                        disableClearable
                      />
                      <AmountInputField
                        className="flex-1"
                        name={`${key}.amount`}
                        formikProps={formikProps}
                        currency={CurrencyEnum.Usd}
                      />
                      {localThresholds.length > 1 && (
                        <Tooltip
                          placement="top-end"
                          title={translate('text_63aa085d28b8510cd46443ff')}
                        >
                          <Button
                            icon="trash"
                            variant="quaternary"
                            onClick={() => {
                              const newThresholds = [...localThresholds]

                              newThresholds.splice(index, 1)
                              setLocalThresholds(newThresholds)
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
                      setLocalThresholds([...localThresholds, { currency: undefined, amount: '' }])
                    }
                  >
                    {translate('text_1728584028187rmbbvaboadk')}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <Divider />

          <section className="not-last-child:mb-6">
            <div className="not-last-child:mb-2">
              <Typography variant="subhead">
                {translate('text_1728584028187ij19lperkhf')}
              </Typography>
              <Typography variant="caption">
                {translate('text_1728584028187l2wdjy4s5cs')}
              </Typography>
            </div>

            <TextInputField
              name="delays"
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
              name="retry"
              formikProps={formikProps}
              label={translate('text_17285840281879mpfdrz2mmi')}
              placeholder="0"
              beforeChangeFormatter={['positiveNumber']}
              helperText={translate('text_17285840281874du2dlbui5u', {
                attempts: formikProps.values.retry,
              })}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    {translate('text_172858402818763zwy2u9e3t')}
                  </InputAdornment>
                ),
              }}
            />
          </section>

          <Divider />

          <section className="not-last-child:mb-6">
            <Switch
              name="isDefault"
              checked={formikProps.values.isDefault}
              onChange={() => {
                if (!formikProps.values.isDefault) {
                  defaultCampaignDialog.current?.openDialog({
                    type: 'setDefault',
                    onConfirm: () => formikProps.setFieldValue('isDefault', true),
                  })
                } else {
                  formikProps.setFieldValue('isDefault', !formikProps.values.isDefault)
                }
              }}
              label={translate('text_1728584028187cpxux50bk4n')}
              subLabel={translate('text_1728584028187qei3xba4i02')}
            />
          </section>
        </div>

        <footer className="sticky bottom-0 mt-20 flex h-20 border border-grey-200 bg-white">
          <div className="container mx-auto flex h-full items-center justify-end">
            <div className="flex items-center gap-6 px-11">
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
              <Button variant="primary" onClick={() => formikProps.submitForm()}>
                {translate('text_1728584028187oqpu20oxuxq')}
              </Button>
            </div>
          </div>
        </footer>
      </div>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_6244277fe0975300fe3fb946')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={() => navigate(DUNNINGS_SETTINGS_ROUTE)}
      />

      <DefaultCampaignDialog ref={defaultCampaignDialog} />
    </>
  )
}

export default CreateDunning
