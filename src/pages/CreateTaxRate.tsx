import { useRef, useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { object, string, number } from 'yup'
import styled from 'styled-components'
import { InputAdornment } from '@mui/material'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { Typography, Button, Skeleton, Tooltip } from '~/components/designSystem'
import { theme, PageHeader, Card } from '~/styles'
import {
  Main,
  Content,
  Title,
  Subtitle,
  Side,
  SkeletonHeader,
  ButtonContainer,
  SectionTitle,
  LineSplit,
} from '~/styles/mainObjectsForm'
import { FORM_ERRORS_ENUM, useCreateEditTaxRate } from '~/hooks/useCreateEditTaxRate'
import { TaxRateCodeSnippet } from '~/components/taxRates/TaxRateCodeSnippet'
import { TextInputField } from '~/components/form'
import { TaxRateFormInput } from '~/components/taxRates/types'

const CreateTaxRate = () => {
  const { isEdition, errorCode, loading, onClose, onSave, taxRate } = useCreateEditTaxRate()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useInternationalization()
  const formikProps = useFormik<TaxRateFormInput>({
    initialValues: {
      code: taxRate?.code || '',
      description: taxRate?.description || '',
      name: taxRate?.name || '',
      // @ts-ignore
      value: taxRate?.value ? String(taxRate?.value) : '',
    },
    validationSchema: object().shape({
      code: string().required(''),
      description: string(),
      name: string().required(''),
      value: number().max(100, 'text_645bb193927b375079d28b88').required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
    !!formikProps.initialValues.description
  )

  useEffect(() => {
    setShouldDisplayDescription(!!formikProps.initialValues.description)
  }, [formikProps.initialValues.description])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_645bb193927b375079d289b5' : 'text_645bb193927b375079d289af')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => (formikProps.dirty ? warningDialogRef.current?.openDialog() : onClose())}
        />
      </PageHeader>

      <Content>
        <Main>
          <div>
            {loading && !taxRate ? (
              <>
                <SkeletonHeader>
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(5)}
                  />
                  <Skeleton
                    variant="text"
                    width="inherit"
                    height={12}
                    marginBottom={theme.spacing(4)}
                  />
                  <Skeleton variant="text" width={120} height={12} />
                </SkeletonHeader>

                {[0, 1, 2].map((skeletonCard) => (
                  <Card key={`skeleton-${skeletonCard}`}>
                    <Skeleton
                      variant="text"
                      width={280}
                      height={12}
                      marginBottom={theme.spacing(9)}
                    />
                    <Skeleton
                      variant="text"
                      width="inherit"
                      height={12}
                      marginBottom={theme.spacing(4)}
                    />
                    <Skeleton variant="text" width={120} height={12} />
                  </Card>
                ))}
              </>
            ) : (
              <>
                <div>
                  <Title variant="headline">
                    {translate(
                      isEdition ? 'text_645bb193927b375079d28a0d' : 'text_645bb193927b375079d28a51'
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_645bb193927b375079d28a17' : 'text_645bb193927b375079d28a71'
                    )}
                  </Subtitle>
                </div>

                <Card>
                  <SectionTitle variant="subhead">
                    {translate('text_645bb193927b375079d28a91')}
                  </SectionTitle>

                  <LineSplit>
                    <TextInputField
                      name="name"
                      label={translate('text_645bb193927b375079d28ab1')}
                      placeholder={translate('text_645bb193927b375079d28ace')}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      formikProps={formikProps}
                    />
                    <TextInputField
                      name="code"
                      beforeChangeFormatter="code"
                      label={translate('text_645bb193927b375079d28aea')}
                      placeholder={translate('text_645bb193927b375079d28b02')}
                      formikProps={formikProps}
                      infoText={translate('text_645bb193927b375079d28b7a')}
                    />
                  </LineSplit>

                  {shouldDisplayDescription ? (
                    <InlineDescription>
                      <TextArea
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        multiline
                        name="description"
                        label={translate('text_645bb193927b375079d28b22')}
                        placeholder={translate('text_645bb193927b375079d28b36')}
                        rows="3"
                        formikProps={formikProps}
                      />
                      <CloseDescriptionTooltip
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
                      </CloseDescriptionTooltip>
                    </InlineDescription>
                  ) : (
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test="show-description"
                    >
                      {translate('text_645bb193927b375079d28b16')}
                    </Button>
                  )}

                  <TextInputField
                    name="value"
                    label={translate('text_645bb193927b375079d28b2c')}
                    beforeChangeFormatter={['positiveNumber', 'decimal']}
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

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                    data-test="submit"
                  >
                    {translate(
                      isEdition ? 'text_645bb193927b375079d28ab7' : 'text_645bb193927b375079d28b8e'
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <TaxRateCodeSnippet
            loading={loading}
            taxRate={formikProps.values}
            isEdition={isEdition}
          />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_645bb193927b375079d289cb')}
        description={translate('text_645bb193927b375079d289d9')}
        continueText={translate('text_645bb193927b375079d289f9')}
        onContinue={onClose}
      />
    </div>
  )
}

export default CreateTaxRate

const InlineDescription = styled.div`
  display: flex;
  align-items: center;
`

const TextArea = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};

  textarea {
    min-height: 38px;
    resize: vertical;
  }
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`
