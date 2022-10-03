import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { object, string, number } from 'yup'
import styled from 'styled-components'

import { useCreateEditAddOn, FORM_ERRORS_ENUM } from '~/hooks/useCreateEditAddOn'
import { PageHeader } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { ADD_ONS_ROUTE } from '~/core/router'
import { CreateAddOnInput, CurrencyEnum } from '~/generated/graphql'
import { theme, Card } from '~/styles'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { TextInputField, ComboBoxField } from '~/components/form'
import {
  Main,
  Content,
  Title,
  Subtitle,
  Side,
  Line,
  SkeletonHeader,
  ButtonContainer,
  LineAmount,
} from '~/styles/mainObjectsForm'

import { AddOnCodeSnippet } from '../components/addOns/AddOnCodeSnippet'

const CreateAddOn = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { isEdition, loading, addOn, errorCode, onSave } = useCreateEditAddOn()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const formikProps = useFormik<CreateAddOnInput>({
    initialValues: {
      name: addOn?.name || '',
      code: addOn?.code || '',
      description: addOn?.description || '',
      // @ts-ignore
      amountCents: addOn?.amountCents ? addOn?.amountCents / 100 : addOn?.amountCents || undefined,
      amountCurrency: addOn?.amountCurrency || CurrencyEnum.Usd,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      amountCents: number().min(1, 'text_62978ebe99054a011fc189e0').required(''),
      amountCurrency: string().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

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
          {translate(isEdition ? 'text_629728388c4d2300e2d37fc2' : 'text_629728388c4d2300e2d37fbc')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty ? warningDialogRef.current?.openDialog() : navigate(ADD_ONS_ROUTE)
          }
        />
      </PageHeader>

      <Content>
        <Main>
          <div>
            {loading ? (
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
                      isEdition ? 'text_629728388c4d2300e2d38041' : 'text_629728388c4d2300e2d3803d'
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_629728388c4d2300e2d38065' : 'text_629728388c4d2300e2d38061'
                    )}
                  </Subtitle>
                </div>
                <Card>
                  <SectionTitle variant="subhead">
                    {translate('text_629728388c4d2300e2d38079')}
                  </SectionTitle>

                  <Line>
                    <TextInputField
                      name="name"
                      label={translate('text_629728388c4d2300e2d38091')}
                      placeholder={translate('text_629728388c4d2300e2d380a5')}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      formikProps={formikProps}
                    />
                    <TextInputField
                      name="code"
                      beforeChangeFormatter="code"
                      label={translate('text_629728388c4d2300e2d380b7')}
                      placeholder={translate('text_629728388c4d2300e2d380d9')}
                      formikProps={formikProps}
                      infoText={translate('text_629778b2a517d100c19bc524')}
                    />
                  </Line>
                  <TextInputField
                    name="description"
                    label={translate('text_629728388c4d2300e2d380f1')}
                    placeholder={translate('text_629728388c4d2300e2d38103')}
                    rows="3"
                    multiline
                    formikProps={formikProps}
                  />
                </Card>
                <Card>
                  <SectionTitle variant="subhead">
                    {translate('text_629728388c4d2300e2d38117')}
                  </SectionTitle>

                  <LineAmount>
                    <TextInputField
                      name="amountCents"
                      beforeChangeFormatter={['positiveNumber', 'decimal']}
                      label={translate('text_629728388c4d2300e2d3812d')}
                      placeholder={translate('text_629728388c4d2300e2d3813d')}
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      name="amountCurrency"
                      data={Object.values(CurrencyEnum).map((currencyType) => ({
                        value: currencyType,
                      }))}
                      disableClearable
                      formikProps={formikProps}
                    />
                  </LineAmount>
                </Card>

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                  >
                    {translate(
                      isEdition ? 'text_629728388c4d2300e2d38170' : 'text_629728388c4d2300e2d38179'
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <AddOnCodeSnippet loading={loading} addOn={formikProps.values} />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_629728388c4d2300e2d37fe0' : 'text_629728388c4d2300e2d37fda'
        )}
        description={translate(
          isEdition ? 'text_629728388c4d2300e2d37ffa' : 'text_629728388c4d2300e2d37ff4'
        )}
        continueText={translate(
          isEdition ? 'text_629728388c4d2300e2d3802d' : 'text_629728388c4d2300e2d38027'
        )}
        onContinue={() => navigate(ADD_ONS_ROUTE)}
      />
    </div>
  )
}

const SectionTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(6)};
`

export default CreateAddOn
