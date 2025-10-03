import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import { number, object, string } from 'yup'

import { Button, Card, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { TextInput, TextInputField } from '~/components/form'
import { TaxCodeSnippet } from '~/components/taxes/TaxCodeSnippet'
import { TaxFormInput } from '~/components/taxes/types'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { scrollToTop } from '~/core/utils/domUtils'
import { updateNameAndMaybeCode } from '~/core/utils/updateNameAndMaybeCode'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditTax } from '~/hooks/useCreateEditTax'
import { PageHeader } from '~/styles'
import { Main, Side, Subtitle, Title } from '~/styles/mainObjectsForm'

const CreateTaxRate = () => {
  const { isEdition, errorCode, loading, onClose, onSave, tax } = useCreateEditTax()
  const leavingNotSavedChargesWarningDialogRef = useRef<WarningDialogRef>(null)
  const savingAppliedTaxRateWarningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useInternationalization()
  const formikProps = useFormik<TaxFormInput>({
    initialValues: {
      code: tax?.code || '',
      description: tax?.description || '',
      name: tax?.name || '',
      // @ts-expect-error rate is a number but we want to allow empty string to ease input reset and form dirty behaviour
      rate: isNaN(Number(tax?.rate)) ? '' : String(tax?.rate),
    },
    validationSchema: object().shape({
      code: string().required(''),
      description: string(),
      name: string().required(''),
      rate: number().max(100, 'text_645bb193927b375079d28b88').required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
    !!formikProps.initialValues.description,
  )

  useEffect(() => {
    setShouldDisplayDescription(!!formikProps.initialValues.description)
  }, [formikProps.initialValues.description])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      scrollToTop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  return (
    <div>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_645bb193927b375079d289b5' : 'text_645bb193927b375079d289af')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty
              ? leavingNotSavedChargesWarningDialogRef.current?.openDialog()
              : onClose()
          }
        />
      </PageHeader.Wrapper>
      <div className="min-height-minus-nav flex">
        <Main>
          <div>
            {loading && !tax ? (
              <>
                <div className="px-8">
                  <Skeleton variant="text" className="mb-5 w-70" />
                  <Skeleton variant="text" className="mb-4" />
                  <Skeleton variant="text" className="w-30" />
                </div>

                {[0, 1, 2].map((skeletonCard) => (
                  <Card key={`skeleton-${skeletonCard}`}>
                    <Skeleton variant="text" className="w-70" />
                    <Skeleton variant="text" />
                    <Skeleton variant="text" className="w-30" />
                  </Card>
                ))}
              </>
            ) : (
              <>
                <div>
                  <Title variant="headline">
                    {translate(
                      isEdition ? 'text_645bb193927b375079d28a0d' : 'text_645bb193927b375079d28a51',
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_645bb193927b375079d28a17' : 'text_645bb193927b375079d28a71',
                    )}
                  </Subtitle>
                </div>

                <Card>
                  <Typography variant="subhead1">
                    {translate('text_645bb193927b375079d28a91')}
                  </Typography>

                  <div className="flex gap-3">
                    <TextInput
                      className="flex-1"
                      name="name"
                      label={translate('text_645bb193927b375079d28ab1')}
                      placeholder={translate('text_645bb193927b375079d28ace')}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      value={formikProps.values.name || ''}
                      onChange={(name) => {
                        updateNameAndMaybeCode({ name, formikProps })
                      }}
                    />
                    <TextInputField
                      className="flex-1"
                      name="code"
                      disabled={tax?.autoGenerated}
                      beforeChangeFormatter="code"
                      label={translate('text_645bb193927b375079d28aea')}
                      placeholder={translate('text_645bb193927b375079d28b02')}
                      formikProps={formikProps}
                      infoText={translate('text_645bb193927b375079d28b7a')}
                    />
                  </div>

                  {shouldDisplayDescription ? (
                    <div className="flex items-center">
                      <TextInputField
                        className="mr-3 flex-1"
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        multiline
                        name="description"
                        label={translate('text_645bb193927b375079d28b22')}
                        placeholder={translate('text_645bb193927b375079d28b36')}
                        rows="3"
                        formikProps={formikProps}
                      />
                      <Tooltip
                        className="mt-6"
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
                      className="self-start"
                      startIcon="plus"
                      variant="inline"
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test="show-description"
                    >
                      {translate('text_645bb193927b375079d28b16')}
                    </Button>
                  )}

                  <TextInputField
                    name="rate"
                    disabled={tax?.autoGenerated}
                    label={translate('text_645bb193927b375079d28b2c')}
                    beforeChangeFormatter={['positiveNumber', 'quadDecimal']}
                    placeholder={translate('text_632d68358f1fedc68eed3e86')}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {translate('text_62a0b7107afa2700a65ef70a')}
                        </InputAdornment>
                      ),
                    }}
                    formikProps={formikProps}
                  />
                </Card>

                <div className="px-6 pb-20">
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    onClick={() =>
                      (tax?.customersCount || 0) > 0
                        ? savingAppliedTaxRateWarningDialogRef.current?.openDialog()
                        : formikProps.submitForm()
                    }
                    data-test="submit"
                  >
                    {translate(
                      isEdition ? 'text_645bb193927b375079d28ab7' : 'text_645bb193927b375079d28b8e',
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Main>
        <Side>
          <TaxCodeSnippet
            loading={loading}
            tax={formikProps.values}
            isEdition={isEdition}
            initialTaxCode={tax?.code}
          />
        </Side>
      </div>
      <WarningDialog
        ref={leavingNotSavedChargesWarningDialogRef}
        title={translate('text_645bb193927b375079d289cb')}
        description={translate('text_645bb193927b375079d289d9')}
        continueText={translate('text_645bb193927b375079d289f9')}
        onContinue={onClose}
      />
      <WarningDialog
        mode="info"
        ref={savingAppliedTaxRateWarningDialogRef}
        title={translate('text_6464a12047f2dd00affa924f', {
          name: tax?.name,
        })}
        description={translate(
          'text_6464a12047f2dd00affa9250',
          {
            customersCount: tax?.customersCount,
          },
          tax?.customersCount,
        )}
        continueText={translate('text_6464a12047f2dd00affa9252')}
        onContinue={formikProps.submitForm}
      />
    </div>
  )
}

export default CreateTaxRate
