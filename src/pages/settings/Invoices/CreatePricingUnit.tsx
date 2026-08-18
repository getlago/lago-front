import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { INVOICE_SETTINGS_ROUTE, useNavigate } from '~/core/router'
import {
  LagoApiError,
  useCreatePricingUnitMutation,
  useGetSinglePricingUnitQuery,
  useUpdatePricingUnitMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import {
  createPricingUnitValidationSchema,
  CreatePricingUnitValues,
} from './createPricingUnit/validationSchema'

gql`
  fragment PricingUnit on PricingUnit {
    id
    name
    code
    description
    shortName
  }

  query getSinglePricingUnit($id: ID!) {
    pricingUnit(id: $id) {
      id
      ...PricingUnit
    }
  }

  mutation createPricingUnit($input: CreatePricingUnitInput!) {
    createPricingUnit(input: $input) {
      id
      ...PricingUnit
    }
  }

  mutation updatePricingUnit($input: UpdatePricingUnitInput!) {
    updatePricingUnit(input: $input) {
      id
      ...PricingUnit
    }
  }
`

export const CREATE_PRICING_UNIT_FORM_ID = 'create-pricing-unit-form'
export const CREATE_PRICING_UNIT_CLOSE_BUTTON_TEST_ID = 'create-pricing-unit-close-button'
export const CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID = 'create-pricing-unit-submit-button'
export const CREATE_PRICING_UNIT_DESCRIPTION_DELETE_TEST_ID =
  'create-pricing-unit-description-delete-button'
export const CREATE_PRICING_UNIT_SHOW_DESCRIPTION_TEST_ID = 'show-description'

const CreatePricingUnit = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { pricingUnitId = '' } = useParams()
  const centralizedDialog = useCentralizedDialog()
  const isEdition = !!pricingUnitId

  const openDirtyAttributesWarning = () =>
    centralizedDialog.open({
      title: translate('text_6244277fe0975300fe3fb940'),
      description: translate('text_175025748172630micceie8p'),
      actionText: translate('text_6244277fe0975300fe3fb94c'),
      colorVariant: 'danger',
      onAction: () => navigate(INVOICE_SETTINGS_ROUTE),
    })

  const { data: pricingUnitData, loading: pricingUnitLoading } = useGetSinglePricingUnitQuery({
    variables: {
      id: pricingUnitId,
    },
    skip: !pricingUnitId,
  })

  const [create] = useCreatePricingUnitMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ createPricingUnit }) {
      if (!!createPricingUnit?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1750318746536n39old34rpc',
        })
      }
      navigate(INVOICE_SETTINGS_ROUTE)
    },
  })

  const [update] = useUpdatePricingUnitMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted({ updatePricingUnit }) {
      if (!!updatePricingUnit?.id) {
        addToast({
          severity: 'success',
          translateKey: 'text_1750318746535n43q7vkxq1h',
        })
      }
      navigate(INVOICE_SETTINGS_ROUTE)
    },
  })

  const defaultValues: CreatePricingUnitValues = {
    name: pricingUnitData?.pricingUnit?.name || '',
    code: pricingUnitData?.pricingUnit?.code || '',
    description: pricingUnitData?.pricingUnit?.description || '',
    shortName: pricingUnitData?.pricingUnit?.shortName || '',
  }

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createPricingUnitValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const { code, ...values } = value
      let res

      if (!!pricingUnitId) {
        res = await update({
          variables: {
            input: {
              ...values,
              id: pricingUnitId,
            },
          },
        })
      } else {
        res = await create({
          variables: {
            input: {
              code,
              ...values,
            },
          },
        })
      }

      const { errors } = res

      if (!!errors && hasDefinedGQLError('ValueAlreadyExist', errors)) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              code: {
                message: translate('text_632a2d437e341dcc76817556'),
                path: ['code'],
              },
            },
          },
        })
      }
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(CREATE_PRICING_UNIT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  useEffect(() => {
    if (pricingUnitData?.pricingUnit) {
      form.reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingUnitData])

  const isDirty = useStore(form.store, (state) => state.isDirty)

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
    !!pricingUnitData?.pricingUnit?.description,
  )

  useEffect(() => {
    setShouldDisplayDescription(!!pricingUnitData?.pricingUnit?.description)
  }, [pricingUnitData?.pricingUnit?.description])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={CREATE_PRICING_UNIT_FORM_ID}
        className="flex min-h-full flex-col"
        onSubmit={handleSubmit}
      >
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {isEdition
              ? translate('text_17502574817266iopiux8fb8')
              : translate('text_1750257481726l1npjihgs20')}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            data-test={CREATE_PRICING_UNIT_CLOSE_BUTTON_TEST_ID}
            onClick={() =>
              isDirty ? openDirtyAttributesWarning() : navigate(INVOICE_SETTINGS_ROUTE)
            }
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {pricingUnitLoading && <FormLoadingSkeleton id="create-pricing-unit" />}

          {!pricingUnitLoading && (
            <>
              <Alert type="info">{translate('text_1750424999814th7cu8hbg7u')}</Alert>

              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="textSecondary">
                  {translate('text_17502505476284yyq70yy6mx')}
                </Typography>
                <Typography variant="body">{translate('text_1750257831368z0azd7znlhf')}</Typography>
              </div>

              <div className="flex flex-col gap-12">
                <div className="not-last-child:mb-2">
                  <Typography variant="subhead1">
                    {translate('text_17502574817266uy9bvk3i8u')}
                  </Typography>
                  <Typography variant="caption">
                    {translate('text_17502578313682gsr5pls9a3')}
                  </Typography>
                </div>
                <div className="flex flex-col gap-6">
                  <NameAndCodeGroup
                    form={form}
                    fields={{ name: 'name', code: 'code' }}
                    disableCodeInput={isEdition}
                    disableAutoGenerateCode={isEdition}
                    nameProps={{
                      autoFocus: true,
                      label: translate('text_6419c64eace749372fc72b0f'),
                      placeholder: translate('text_6584550dc4cec7adf861504f'),
                    }}
                    codeProps={{
                      label: translate('text_62876e85e32e0300e1803127'),
                      placeholder: translate('text_6584550dc4cec7adf8615053'),
                    }}
                  />

                  <form.AppField name="shortName">
                    {(field) => (
                      <field.TextInputField
                        label={translate('text_175025054762801ioe61wdye')}
                        placeholder={translate('text_1750250547628xh8057w5j8p')}
                        helperText={translate('text_1750257831368e6n6ys36s6u')}
                      />
                    )}
                  </form.AppField>

                  {shouldDisplayDescription ? (
                    <div className="flex items-center gap-2">
                      <form.AppField name="description">
                        {(field) => (
                          <field.TextInputField
                            className="flex-1"
                            label={translate('text_623b42ff8ee4e000ba87d0c8')}
                            placeholder={translate('text_1750257831368ae3rtaclhjy')}
                            rows="3"
                            multiline
                          />
                        )}
                      </form.AppField>

                      <Tooltip
                        className="mt-7"
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          data-test={CREATE_PRICING_UNIT_DESCRIPTION_DELETE_TEST_ID}
                          onClick={() => {
                            form.setFieldValue('description', '')
                            setShouldDisplayDescription(false)
                          }}
                        />
                      </Tooltip>
                    </div>
                  ) : (
                    <Button
                      startIcon="plus"
                      variant="inline"
                      fitContent
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test={CREATE_PRICING_UNIT_SHOW_DESCRIPTION_TEST_ID}
                    >
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            onClick={() =>
              isDirty ? openDirtyAttributesWarning() : navigate(INVOICE_SETTINGS_ROUTE)
            }
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton
              dataTest={CREATE_PRICING_UNIT_SUBMIT_BUTTON_TEST_ID}
              disabled={isEdition && !isDirty}
            >
              {isEdition
                ? translate('text_17295436903260tlyb1gp1i7')
                : translate('text_1750319326160woun10ws3h1')}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default CreatePricingUnit
