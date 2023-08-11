import { useRef, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { object, string, number } from 'yup'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { PageHeader } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { ADD_ONS_ROUTE } from '~/core/router'
import {
  CurrencyEnum,
  TaxOnAddOnEditCreateFragmentDoc,
  useGetTaxesForAddOnFormLazyQuery,
} from '~/generated/graphql'
import { theme, Card } from '~/styles'
import { Typography, Button, Skeleton, Tooltip, Chip } from '~/components/designSystem'
import { TextInputField, ComboBoxField, AmountInputField, ComboBox } from '~/components/form'
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
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  FORM_ERRORS_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME,
} from '~/core/constants/form'
import { AddOnFormInput } from '~/components/addOns/types'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'

import { AddOnCodeSnippet } from '../components/addOns/AddOnCodeSnippet'

gql`
  query getTaxesForAddOnForm($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        rate
        ...TaxOnAddOnEditCreate
      }
    }
  }

  ${TaxOnAddOnEditCreateFragmentDoc}
`

const CreateAddOn = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { isEdition, loading, addOn, errorCode, onSave } = useCreateEditAddOn()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const [getTaxes, { data: taxesData, loading: taxesLoading }] = useGetTaxesForAddOnFormLazyQuery({
    variables: { limit: 20 },
  })
  const { collection: taxesCollection } = taxesData?.taxes || {}

  const formikProps = useFormik<AddOnFormInput>({
    initialValues: {
      name: addOn?.name || '',
      code: addOn?.code || '',
      description: addOn?.description || '',
      amountCents: addOn?.amountCents
        ? String(deserializeAmount(addOn?.amountCents, addOn?.amountCurrency))
        : addOn?.amountCents || undefined,
      amountCurrency: addOn?.amountCurrency || CurrencyEnum.Usd,
      taxes: addOn?.taxes || [],
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      amountCents: number().min(0.01, 'text_62978ebe99054a011fc189e0').required(''),
      amountCurrency: string().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  const taxesDataForCombobox = useMemo(() => {
    if (!taxesCollection) return []

    const addOnTaxesIds = formikProps?.values?.taxes?.map((tax) => tax.id) || []

    return taxesCollection.map(({ id, name, rate }) => {
      return {
        label: `${name} (${intlFormatNumber(Number(rate) / 100 || 0, {
          minimumFractionDigits: 2,
          style: 'percent',
        })})`,
        labelNode: (
          <Item>
            {name}&nbsp;
            <Typography color="textPrimary">
              (
              {intlFormatNumber(Number(rate) / 100 || 0, {
                minimumFractionDigits: 2,
                style: 'percent',
              })}
              )
            </Typography>
          </Item>
        ),
        value: id,
        disabled: addOnTaxesIds.includes(id),
      }
    })
  }, [formikProps?.values?.taxes, taxesCollection])

  const [shouldDisplayTaxesInput, setShouldDisplayTaxesInput] = useState<boolean>(false)
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

                  {shouldDisplayDescription ? (
                    <InlineDescription>
                      <TextArea
                        name="description"
                        label={translate('text_629728388c4d2300e2d380f1')}
                        placeholder={translate('text_629728388c4d2300e2d38103')}
                        rows="3"
                        multiline
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
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </Card>
                <Card>
                  <SectionTitle variant="subhead">
                    {translate('text_629728388c4d2300e2d38117')}
                  </SectionTitle>

                  <LineAmount>
                    <AmountInputField
                      name="amountCents"
                      currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_629728388c4d2300e2d3812d')}
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

                  {!!formikProps?.values?.taxes?.length && (
                    <div>
                      <TaxLabel variant="captionHl" color="grey700">
                        {translate('text_64be910fba8ef9208686a8e3')}
                      </TaxLabel>
                      <InlineTaxesWrapper data-test="tax-chip-wrapper">
                        {formikProps?.values?.taxes?.map(({ id, name, rate }) => (
                          <Chip
                            key={id}
                            label={`${name} (${rate}%)`}
                            variant="secondary"
                            size="medium"
                            closeIcon="trash"
                            icon="percentage"
                            onCloseLabel={translate('text_63aa085d28b8510cd46443ff')}
                            onClose={() => {
                              const newTaxedArray =
                                formikProps?.values?.taxes?.filter((tax) => tax.id !== id) || []

                              formikProps.setFieldValue('taxes', newTaxedArray)
                            }}
                          />
                        ))}
                      </InlineTaxesWrapper>
                    </div>
                  )}

                  {shouldDisplayTaxesInput ? (
                    <div>
                      {!formikProps?.values?.taxes?.length && (
                        <TaxLabel variant="captionHl" color="grey700">
                          {translate('text_64be910fba8ef9208686a8e3')}
                        </TaxLabel>
                      )}
                      <InlineTaxInputWrapper>
                        <ComboBox
                          className={SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME}
                          data={taxesDataForCombobox}
                          searchQuery={getTaxes}
                          loading={taxesLoading}
                          placeholder={translate('text_64be910fba8ef9208686a8e7')}
                          emptyText={translate('text_64be91fd0678965126e5657b')}
                          onChange={(newTaxId) => {
                            const previousTaxes = [...(formikProps?.values?.taxes || [])]
                            const newTaxObject = taxesData?.taxes?.collection?.find(
                              (t) => t.id === newTaxId
                            )

                            formikProps.setFieldValue('taxes', [...previousTaxes, newTaxObject])
                            setShouldDisplayTaxesInput(false)
                          }}
                        />

                        <Tooltip
                          placement="top-end"
                          title={translate('text_63aa085d28b8510cd46443ff')}
                        >
                          <Button
                            icon="trash"
                            variant="quaternary"
                            onClick={() => {
                              setShouldDisplayTaxesInput(false)
                            }}
                          />
                        </Tooltip>
                      </InlineTaxInputWrapper>
                    </div>
                  ) : (
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      onClick={() => {
                        setShouldDisplayTaxesInput(true)

                        setTimeout(() => {
                          const element = document.querySelector(
                            `.${SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`
                          ) as HTMLElement

                          if (!element) return

                          element.scrollIntoView({ behavior: 'smooth' })
                          element.click()
                        }, 0)
                      }}
                      data-test="show-add-taxes"
                    >
                      {translate('text_64be910fba8ef9208686a8c9')}
                    </Button>
                  )}
                </Card>

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || !formikProps.dirty}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                    data-test="submit"
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
          <AddOnCodeSnippet isEdition={isEdition} loading={loading} addOn={formikProps.values} />
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

const TextArea = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};

  textarea {
    min-height: 38px;
    resize: vertical;
    white-space: pre-wrap;
  }
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`

const InlineDescription = styled.div`
  display: flex;
  align-items: center;
`

const TaxLabel = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
`

const InlineTaxInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }
`

const InlineTaxesWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};
  flex-wrap: wrap;
`

export default CreateAddOn
