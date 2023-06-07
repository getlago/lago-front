import { DateTime } from 'luxon'
import { useCallback, useMemo, useRef, useState } from 'react'
import { InputAdornment } from '@mui/material'
import _get from 'lodash/get'
import { useFormik } from 'formik'
import { gql } from '@apollo/client'
import { array, number, object, string } from 'yup'
import styled, { css } from 'styled-components'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Avatar, Button, Popper, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import {
  CreateInvoiceInput,
  CurrencyEnum,
  useCreateInvoiceMutation,
  useGetAddonListForInfoiceLazyQuery,
  useGetInfosForCreateInvoiceQuery,
} from '~/generated/graphql'
import ErrorImage from '~/public/images/maneki/error.svg'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, HEADER_TABLE_HEIGHT, MenuPopper, PageHeader, theme } from '~/styles'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { AmountInputField, ComboBox, ComboBoxField, TextInputField } from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import { getCurrencySymbol, intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  EditInvoiceItemDescriptionDialog,
  EditInvoiceItemDescriptionDialogRef,
} from '~/components/invoices/EditInvoiceItemDescriptionDialog'
import { addToast } from '~/core/apolloClient'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { CountryCodes } from '~/core/countryCodes'

const ADD_ITEM_INPUT_NAME = 'addItemInput'

gql`
  mutation createInvoice($input: CreateInvoiceInput!) {
    createInvoice(input: $input) {
      id
    }
  }

  query getInfosForCreateInvoice($id: ID!) {
    customer(id: $id) {
      id
      addressLine1
      addressLine2
      city
      country
      currency
      email
      name
      legalName
      legalNumber
      taxIdentificationNumber
      state
      vatRate
      zipcode
    }
    organization {
      id
      addressLine1
      addressLine2
      city
      country
      email
      name
      legalName
      legalNumber
      taxIdentificationNumber
      logoUrl
      state
      zipcode
      billingConfiguration {
        id
        vatRate
      }
    }
  }

  query getAddonListForInfoice($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        name
        description
        amountCents
        amountCurrency
      }
    }
  }
`

const CELL_HEIGHT = 68

const CreateInvoice = () => {
  const navigate = useNavigate()
  const { id: customerId } = useParams()
  const [showAddItem, setShowAddItem] = useState(false)
  const { translate } = useInternationalization()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const editDescriptionDialogRef = useRef<EditInvoiceItemDescriptionDialogRef>(null)
  const handleClosePage = useCallback(() => {
    navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
  }, [navigate, customerId])

  const { data, loading, error } = useGetInfosForCreateInvoiceQuery({
    variables: { id: customerId as string },
    skip: !customerId,
    notifyOnNetworkStatusChange: true,
  })
  const { customer, organization } = data || {}
  const localVatRate =
    typeof customer?.vatRate === 'number'
      ? customer?.vatRate
      : typeof organization?.billingConfiguration?.vatRate === 'number'
      ? organization?.billingConfiguration?.vatRate
      : 0

  const [getAddOns, { data: addOnData }] = useGetAddonListForInfoiceLazyQuery({
    variables: { limit: 20 },
  })

  const [createInvoice] = useCreateInvoiceMutation({
    onCompleted({ createInvoice: createInvoiceResult }) {
      if (!!createInvoiceResult) {
        addToast({
          severity: 'success',
          translateKey: 'text_6453819268763979024ad144',
        })
        navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: customerId as string }))
      }
    },
  })

  const formikProps = useFormik<CreateInvoiceInput>({
    initialValues: {
      customerId: customerId || '',
      currency: data?.customer?.currency || CurrencyEnum.Usd,
      fees: [],
    },
    validationSchema: object().shape({
      customerId: string().required(''),
      currency: string().required(''),
      fees: array()
        .of(
          object().shape({
            addOnId: string().required(''),
            description: string(),
            units: number().min(1, 'text_645381a65b99559adf6401f0').required(''),
          })
        )
        .required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async ({ fees, ...values }) => {
      await createInvoice({
        variables: {
          input: {
            ...values,
            fees: fees.map(({ unitAmountCents, ...fee }) => {
              return {
                ...fee,
                unitAmountCents: Number(serializeAmount(unitAmountCents, currency) || 0),
              }
            }),
          },
        },
      })
    },
  })
  const currency = formikProps.values.currency || CurrencyEnum.Usd
  const hasAnyFee = formikProps.values.fees.length > 0

  const addOns = useMemo(() => {
    if (!addOnData || !addOnData?.addOns || !addOnData?.addOns?.collection) return []

    return addOnData?.addOns?.collection.map(({ id, name, amountCents, amountCurrency }) => {
      return {
        label: name,
        labelNode: (
          <Item>
            {name} -&nbsp;
            <Typography color="textPrimary">
              (
              {intlFormatNumber(deserializeAmount(amountCents, amountCurrency) || 0, {
                currencyDisplay: 'symbol',
                currency: amountCurrency,
              })}
              )
            </Typography>
          </Item>
        ),
        value: id,
      }
    })
  }, [addOnData])

  const calculation = useMemo(() => {
    const subTotal = formikProps.values.fees.reduce((acc, fee) => {
      acc += (fee?.units || 0) * (fee?.unitAmountCents || 0)
      return acc
    }, 0)

    const vatAmount = (subTotal * localVatRate) / 100

    const total = subTotal + vatAmount

    return { subTotal, vatAmount, total }
  }, [formikProps.values.fees, localVatRate])

  const { subTotal, vatAmount, total } = calculation

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_6453819268763979024acfe9')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty ? warningDialogRef.current?.openDialog() : handleClosePage()
          }
        />
      </PageHeader>

      <PageWrapper>
        <CenteredWrapper>
          <BorderedCard $disableChildSpacing>
            {loading ? (
              <>
                <InvoiceHeader>
                  <Skeleton variant="text" width={120} height={12} />
                  <Skeleton
                    className="rounded-conector-skeleton"
                    variant="connectorAvatar"
                    size="medium"
                  />
                </InvoiceHeader>
                <div>
                  <InlineSkeleton>
                    <Skeleton variant="text" width={104} height={12} marginRight={52} />
                    <Skeleton variant="text" width={96} height={12} />
                  </InlineSkeleton>
                  <InlineSkeleton>
                    <Skeleton variant="text" width={104} height={12} marginRight={52} />
                    <Skeleton variant="text" width={96} height={12} />
                  </InlineSkeleton>
                </div>
                <InlineSkeletonBlocks>
                  <div>
                    <InfoSkeleton variant="text" width={104} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                  </div>
                  <div>
                    <InfoSkeleton variant="text" width={104} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                    <InfoSkeleton variant="text" width={184} height={12} />
                  </div>
                </InlineSkeletonBlocks>
              </>
            ) : (
              <>
                <InvoiceHeader>
                  <Typography variant="headline" color="textSecondary">
                    {translate('text_6453819268763979024acff5')}
                  </Typography>
                  {!!organization?.logoUrl && (
                    <Avatar size="medium" variant="connector">
                      <img src={organization?.logoUrl} alt="company-logo" />
                    </Avatar>
                  )}
                </InvoiceHeader>

                <InlineTopInfo>
                  <Typography variant="caption" color="grey600">
                    {translate('text_6453819268763979024ad01b')}
                  </Typography>
                  <Typography>{DateTime.now().toFormat('LLL. dd, yyyy')}</Typography>
                </InlineTopInfo>

                <FromToInfoWrapper>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_6453819268763979024ad027')}
                    </Typography>
                    <Typography variant="body" color="grey700" forceBreak>
                      {organization?.legalName || organization?.name}
                    </Typography>
                    {organization?.legalNumber && (
                      <Typography variant="body" color="grey700">
                        {organization?.legalNumber}
                      </Typography>
                    )}
                    {!!(
                      organization?.addressLine1 ||
                      organization?.addressLine2 ||
                      organization?.state ||
                      organization?.country ||
                      organization?.city ||
                      organization?.zipcode
                    ) && (
                      <>
                        {organization?.addressLine1 && (
                          <Typography variant="body" color="grey700">
                            {organization?.addressLine1}
                          </Typography>
                        )}
                        {organization?.addressLine2 && (
                          <Typography variant="body" color="grey700">
                            {organization?.addressLine2}
                          </Typography>
                        )}
                        {(organization?.zipcode || organization?.city || organization?.state) && (
                          <Typography variant="body" color="grey700">
                            {organization?.zipcode} {organization?.city} {organization?.state}
                          </Typography>
                        )}
                        {organization?.country && (
                          <Typography variant="body" color="grey700">
                            {CountryCodes[organization?.country]}
                          </Typography>
                        )}
                      </>
                    )}
                    {organization?.email && (
                      <Typography variant="body" color="grey700">
                        {organization?.email}
                      </Typography>
                    )}
                    {organization?.taxIdentificationNumber && (
                      <Typography variant="body" color="grey700">
                        {translate('text_648053ee819b60364c675c78', {
                          taxIdentificationNumber: organization.taxIdentificationNumber,
                        })}
                      </Typography>
                    )}
                  </div>
                  <div>
                    <Typography variant="caption" color="grey600">
                      {translate('text_6453819268763979024ad03f')}
                    </Typography>
                    <Typography variant="body" color="grey700" forceBreak>
                      {customer?.legalName || customer?.name}
                    </Typography>
                    {customer?.legalNumber && (
                      <Typography variant="body" color="grey700">
                        {customer?.legalNumber}
                      </Typography>
                    )}
                    {!!(
                      customer?.addressLine1 ||
                      customer?.addressLine2 ||
                      customer?.state ||
                      customer?.country ||
                      customer?.city ||
                      customer?.zipcode
                    ) && (
                      <>
                        {customer?.addressLine1 && (
                          <Typography variant="body" color="grey700">
                            {customer?.addressLine1}
                          </Typography>
                        )}
                        {customer?.addressLine2 && (
                          <Typography variant="body" color="grey700">
                            {customer?.addressLine2}
                          </Typography>
                        )}
                        {(customer?.zipcode || customer?.city || customer?.state) && (
                          <Typography variant="body" color="grey700">
                            {customer?.zipcode} {customer?.city} {customer?.state}
                          </Typography>
                        )}
                        {customer?.country && (
                          <Typography variant="body" color="grey700">
                            {CountryCodes[customer?.country]}
                          </Typography>
                        )}
                      </>
                    )}
                    {customer?.email && (
                      <Typography variant="body" color="grey700">
                        {customer?.email}
                      </Typography>
                    )}
                    {customer?.taxIdentificationNumber && (
                      <Typography variant="body" color="grey700">
                        {translate('text_648053ee819b60364c675c78', {
                          taxIdentificationNumber: customer.taxIdentificationNumber,
                        })}
                      </Typography>
                    )}
                  </div>
                </FromToInfoWrapper>

                <InvoiceTableWrapper>
                  <CurrencyComboBoxField
                    disableClearable
                    data={Object.values(CurrencyEnum).map((currencyType) => ({
                      value: currencyType,
                    }))}
                    disabled={!!customer?.currency}
                    formikProps={formikProps}
                    label={translate('text_6453819268763979024ad057')}
                    name="currency"
                  />

                  <InvoiceTable>
                    <InvoiceTableHeader>
                      <Typography variant="bodyHl" color="grey500">
                        {translate('text_6453819268763979024ad071')}
                      </Typography>
                      <Typography variant="bodyHl" color="grey500">
                        {translate('text_6453819268763979024ad07d')}
                      </Typography>
                      <Typography variant="bodyHl" color="grey500">
                        {translate('text_6453819268763979024ad089')}
                      </Typography>
                      <Typography variant="bodyHl" color="grey500">
                        {translate('text_6453819268763979024ad097')}
                      </Typography>
                      {/* Action column */}
                      <div></div>
                    </InvoiceTableHeader>
                    {!!formikProps?.values?.fees?.length &&
                      formikProps?.values?.fees?.map((fee, i) => {
                        const unitValidationErrorKey = _get(formikProps.errors, `fees.${i}.units`)

                        return (
                          <InvoiceItem key={`item-${i}`}>
                            <div>
                              <Typography variant="body" color="grey700" noWrap>
                                {fee.name}
                              </Typography>
                              {!!fee.description && (
                                <Typography variant="body" color="grey600" noWrap>
                                  {fee.description}
                                </Typography>
                              )}
                            </div>
                            <Tooltip
                              placement="top-end"
                              title={translate(`${unitValidationErrorKey}`)}
                              disableHoverListener={!unitValidationErrorKey}
                            >
                              <TextInputField
                                displayErrorText={false}
                                formikProps={formikProps}
                                placeholder={translate('text_62824f0e5d93bc008d268d00')}
                                name={`fees.${i}.units`}
                                type="number"
                                beforeChangeFormatter={['int', 'positiveNumber']}
                              />
                            </Tooltip>
                            <AmountInputField
                              formikProps={formikProps}
                              name={`fees.${i}.unitAmountCents`}
                              currency={currency}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    {getCurrencySymbol(currency)}
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <Typography variant="body" color="grey700">
                              {!fee.units
                                ? '-'
                                : intlFormatNumber((fee.units || 0) * (fee.unitAmountCents || 0), {
                                    style: 'currency',
                                    currency,
                                  })}
                            </Typography>
                            <Popper
                              PopperProps={{ placement: 'bottom-end' }}
                              opener={() => (
                                <Button icon="dots-horizontal" variant="quaternary" size="small" />
                              )}
                            >
                              {({ closePopper }) => (
                                <MenuPopper>
                                  <Button
                                    startIcon="text"
                                    variant="quaternary"
                                    align="left"
                                    onClick={() => {
                                      editDescriptionDialogRef.current?.openDialog({
                                        description: fee.description || '',
                                        callback: (newDescription?: string) => {
                                          formikProps.setFieldValue(
                                            `fees.${i}.description`,
                                            newDescription
                                          )
                                        },
                                      })
                                      closePopper()
                                    }}
                                  >
                                    {translate('text_6453819268763979024ad124')}
                                  </Button>
                                  <Button
                                    startIcon="trash"
                                    variant="quaternary"
                                    align="left"
                                    onClick={() => {
                                      const fees = [...formikProps.values.fees]

                                      fees.splice(i, 1)
                                      formikProps.setFieldValue('fees', fees)

                                      closePopper()
                                    }}
                                  >
                                    {translate('text_6453819268763979024ad12c')}
                                  </Button>
                                </MenuPopper>
                              )}
                            </Popper>
                          </InvoiceItem>
                        )
                      })}
                    <InvoiceAddItemSection>
                      {showAddItem ? (
                        <InlineAddonInput>
                          <ComboBox
                            name={ADD_ITEM_INPUT_NAME}
                            data={addOns}
                            loading={loading}
                            searchQuery={getAddOns}
                            placeholder={translate('text_6453819268763979024ad0ad')}
                            onChange={(value) => {
                              const addOn = addOnData?.addOns?.collection.find(
                                (c) => c.id === value
                              )

                              if (!!addOn) {
                                formikProps.setFieldValue('fees', [
                                  ...formikProps.values.fees,
                                  {
                                    addOnId: addOn.id,
                                    name: addOn.name,
                                    description: addOn.description,
                                    units: 1,
                                    unitAmountCents: deserializeAmount(addOn.amountCents, currency),
                                  },
                                ])
                              }

                              setShowAddItem(false)
                            }}
                          />
                          <Tooltip
                            title={translate('text_628b8c693e464200e00e4a10')}
                            placement="top-end"
                          >
                            <Button
                              icon="trash"
                              variant="quaternary"
                              size="small"
                              onClick={() => setShowAddItem(false)}
                            />
                          </Tooltip>
                        </InlineAddonInput>
                      ) : (
                        <Button
                          variant="secondary"
                          startIcon="plus"
                          onClick={() => {
                            setShowAddItem(true)
                            setTimeout(() => {
                              document.getElementsByName(ADD_ITEM_INPUT_NAME)[0].focus()
                            }, 0)
                          }}
                        >
                          {translate('text_6453819268763979024ad0d7')}
                        </Button>
                      )}
                    </InvoiceAddItemSection>
                  </InvoiceTable>
                </InvoiceTableWrapper>
                <InvoiceFooter>
                  <div>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_6453819268763979024ad0db')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(subTotal, {
                              currency,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_6453819268763979024ad0e9')} ({localVatRate}%)
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(vatAmount, {
                              currency,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey600">
                        {translate('text_6453819268763979024ad0ff')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(total, {
                              currency,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                    <InvoiceFooterLine>
                      <Typography variant="bodyHl" color="grey700">
                        {translate('text_6453819268763979024ad10f')}
                      </Typography>
                      <Typography variant="body" color="grey700">
                        {!hasAnyFee
                          ? '-'
                          : intlFormatNumber(total, {
                              currency,
                            })}
                      </Typography>
                    </InvoiceFooterLine>
                  </div>
                </InvoiceFooter>
              </>
            )}
          </BorderedCard>
          {!loading && (
            <SubmitButtonWrapper>
              <Button
                fullWidth
                size="large"
                disabled={!formikProps.isValid || !formikProps.dirty}
                onClick={formikProps.submitForm}
              >
                {translate('text_6453819268763979024ad134')}
              </Button>
            </SubmitButtonWrapper>
          )}
        </CenteredWrapper>
      </PageWrapper>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_645388d5bdbd7b00abffa030')}
        description={translate('text_645388d5bdbd7b00abffa031')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={handleClosePage}
      />

      <EditInvoiceItemDescriptionDialog ref={editDescriptionDialogRef} />
    </>
  )
}

export default CreateInvoice

const PageWrapper = styled.div`
  width: 100%;
`

const BorderedCard = styled(Card)`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const CenteredWrapper = styled.div`
  max-width: 1024px;
  padding: 0 ${theme.spacing(4)};
  margin: ${theme.spacing(12)} auto;
  height: fit-content;

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }
`

const InvoiceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  .rounded-conector-skeleton {
    border-radius: 8px;
  }
`

const InlineSkeleton = styled.div`
  padding: ${theme.spacing(2)} 0;
  display: flex;
  align-items: center;
`

const InlineSkeletonBlocks = styled.div`
  display: flex;
  column-gap: ${theme.spacing(4)};

  > * {
    flex: 1;
  }
`

const InfoSkeleton = styled(Skeleton)`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`

const InlineTopInfo = styled.div`
  display: grid;
  grid-template-columns: 140px auto;
  column-gap: ${theme.spacing(4)};
  align-items: baseline;
`

const FromToInfoWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};

  > * {
    flex: 1;
  }
`

const InvoiceTableWrapper = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const CurrencyComboBoxField = styled(ComboBoxField)`
  width: 160px;
`

const Grid = () => css`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 80px 168px 160px 24px;
  gap: ${theme.spacing(3)};

  > *:nth-child(4) {
    display: flex;
    justify-content: flex-end;
  }
`

const InvoiceTable = styled.div`
  width: 100%;
`

const InvoiceTableHeader = styled.div`
  ${Grid()}
  height: ${HEADER_TABLE_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};

  > * {
    display: flex;
    align-items: center;
  }
`

const InvoiceItem = styled.div`
  ${Grid()}
  height: ${CELL_HEIGHT}px;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const InvoiceAddItemSection = styled.div`
  margin-top: ${theme.spacing(6)};
`

const InlineAddonInput = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > :first-child {
    flex: 1;
  }
`

const InvoiceFooter = styled.div`
  width: 100%;
  display: inline-block;

  > div {
    width: 472px;
    margin-left: auto;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(3)};
    }
  }
`

const InvoiceFooterLine = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    flex: 1;
    margin-right: ${theme.spacing(4)};
  }

  > *:last-child {
    width: 168px;
    text-align: end;
  }
`

const SubmitButtonWrapper = styled.div`
  margin: 0 32px;
`
