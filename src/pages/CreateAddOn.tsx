import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { number, object, string } from 'yup'

import { AddOnFormInput } from '~/components/addOns/types'
import { Button, Card, Chip, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { AmountInputField, ComboBox, ComboBoxField, TextInputField } from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import {
  FORM_ERRORS_ENUM,
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME,
} from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ADD_ON_DETAILS_ROUTE, ADD_ONS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  CurrencyEnum,
  TaxOnAddOnEditCreateFragmentDoc,
  useGetTaxesForAddOnFormLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PageHeader, theme } from '~/styles'
import {
  ButtonContainer,
  Content,
  Main,
  Side,
  SkeletonHeader,
  Subtitle,
  Title,
} from '~/styles/mainObjectsForm'

import { AddOnCodeSnippet } from '../components/addOns/AddOnCodeSnippet'

gql`
  query getTaxesForAddOnForm($limit: Int, $page: Int, $searchTerm: String) {
    taxes(limit: $limit, page: $page, searchTerm: $searchTerm) {
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
  const navigate = useNavigate()
  const { organization } = useOrganizationInfos()
  const { addOnId } = useParams()
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
        ? String(
            deserializeAmount(
              addOn?.amountCents,
              addOn?.amountCurrency || organization?.defaultCurrency,
            ),
          )
        : addOn?.amountCents || undefined,
      amountCurrency: addOn?.amountCurrency || organization?.defaultCurrency || CurrencyEnum.Usd,
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
          style: 'percent',
        })})`,
        labelNode: (
          <Item>
            {name}&nbsp;
            <Typography color="textPrimary">
              (
              {intlFormatNumber(Number(rate) / 100 || 0, {
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
    !!formikProps.initialValues.description,
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
            formikProps.dirty
              ? warningDialogRef.current?.openDialog()
              : isEdition && addOnId
                ? navigate(generatePath(ADD_ON_DETAILS_ROUTE, { addOnId }))
                : navigate(ADD_ONS_ROUTE)
          }
        />
      </PageHeader>
      <Content>
        <Main>
          <div>
            {loading ? (
              <>
                <SkeletonHeader>
                  <Skeleton variant="text" className="mb-5 w-70" />
                  <Skeleton variant="text" className="mb-4" />
                  <Skeleton variant="text" className="w-30" />
                </SkeletonHeader>

                {[0, 1].map((skeletonCard) => (
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
                      isEdition ? 'text_629728388c4d2300e2d38041' : 'text_629728388c4d2300e2d3803d',
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_629728388c4d2300e2d38065' : 'text_629728388c4d2300e2d38061',
                    )}
                  </Subtitle>
                </div>

                <Card>
                  <Typography variant="subhead">
                    {translate('text_629728388c4d2300e2d38079')}
                  </Typography>

                  <div className="flex flex-wrap gap-3">
                    <TextInputField
                      className="min-w-[110px] flex-1"
                      name="name"
                      label={translate('text_629728388c4d2300e2d38091')}
                      placeholder={translate('text_629728388c4d2300e2d380a5')}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      formikProps={formikProps}
                    />
                    <TextInputField
                      className="min-w-[110px] flex-1"
                      name="code"
                      beforeChangeFormatter="code"
                      label={translate('text_629728388c4d2300e2d380b7')}
                      placeholder={translate('text_629728388c4d2300e2d380d9')}
                      formikProps={formikProps}
                      infoText={translate('text_629778b2a517d100c19bc524')}
                    />
                  </div>

                  {shouldDisplayDescription ? (
                    <div className="flex items-center">
                      <TextArea
                        multiline
                        name="description"
                        label={translate('text_629728388c4d2300e2d380f1')}
                        placeholder={translate('text_629728388c4d2300e2d38103')}
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
                    </div>
                  ) : (
                    <Button
                      className="self-start"
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
                  <Typography variant="subhead">
                    {translate('text_629728388c4d2300e2d38117')}
                  </Typography>

                  <div className="flex flex-row items-end gap-3">
                    <AmountInputField
                      className="flex-1"
                      name="amountCents"
                      currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                      beforeChangeFormatter={['positiveNumber']}
                      label={translate('text_629728388c4d2300e2d3812d')}
                      formikProps={formikProps}
                    />
                    <ComboBoxField
                      className="max-w-30"
                      name="amountCurrency"
                      data={Object.values(CurrencyEnum).map((currencyType) => ({
                        value: currencyType,
                      }))}
                      disableClearable
                      formikProps={formikProps}
                    />
                  </div>

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
                            type="secondary"
                            size="medium"
                            deleteIcon="trash"
                            icon="percentage"
                            deleteIconLabel={translate('text_63aa085d28b8510cd46443ff')}
                            onDelete={() => {
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
                              (t) => t.id === newTaxId,
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
                      className="self-start"
                      startIcon="plus"
                      variant="quaternary"
                      onClick={() => {
                        setShouldDisplayTaxesInput(true)

                        setTimeout(() => {
                          const element = document.querySelector(
                            `.${SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                          ) as HTMLElement

                          if (!element) return

                          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
                      isEdition ? 'text_629728388c4d2300e2d38170' : 'text_629728388c4d2300e2d38179',
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
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={() => navigate(ADD_ONS_ROUTE)}
      />
    </div>
  )
}

const TextArea = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
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
