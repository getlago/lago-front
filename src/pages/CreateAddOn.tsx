import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { AddOnCodeSnippet } from '~/components/addOns/AddOnCodeSnippet'
import { Button } from '~/components/designSystem/Button'
import { Card } from '~/components/designSystem/Card'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { TaxesSelectorSection } from '~/components/taxes/TaxesSelectorSection'
import { FORM_ERRORS_ENUM, SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME } from '~/core/constants/form'
import { ADD_ON_DETAILS_ROUTE, ADD_ONS_ROUTE, useNavigate } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { scrollToTop } from '~/core/utils/domUtils'
import { CreateAddOnInput, CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCreateEditAddOn } from '~/hooks/useCreateEditAddOn'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { PageHeader } from '~/styles'
import { Main, Side, Subtitle, Title } from '~/styles/mainObjectsForm'

import { addOnFormSchema, AddOnFormValues } from './createAddOn/validationSchema'

export const CREATE_ADD_ON_FORM_ID = 'create-add-on-form'
export const CREATE_ADD_ON_DESCRIPTION_DELETE_TEST_ID = 'create-add-on-description-delete'
export const CREATE_ADD_ON_AMOUNT_INPUT_TEST_ID = 'create-add-on-amount-input'

const CreateAddOn = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organization } = useOrganizationInfos()
  const { addOnId } = useParams()
  const { isEdition, loading, addOn, errorCode, onSave } = useCreateEditAddOn()
  const centralizedDialog = useCentralizedDialog()

  const onCloseRedirection = () => {
    if (isEdition && !!addOnId) {
      return navigate(generatePath(ADD_ON_DETAILS_ROUTE, { addOnId }))
    }

    return navigate(ADD_ONS_ROUTE)
  }

  const form = useAppForm({
    defaultValues: {
      name: addOn?.name || '',
      code: addOn?.code || '',
      description: addOn?.description || '',
      amountCents: addOn?.amountCents
        ? String(
            deserializeAmount(
              addOn.amountCents,
              addOn.amountCurrency || organization?.defaultCurrency,
            ),
          )
        : addOn?.amountCents || undefined,
      amountCurrency: addOn?.amountCurrency || organization?.defaultCurrency || CurrencyEnum.Usd,
      taxes: addOn?.taxes || [],
    } as AddOnFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: addOnFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave(value as unknown as Parameters<typeof onSave>[0])
    },
  })

  useEffect(() => {
    if (addOn) {
      form.reset({
        name: addOn.name || '',
        code: addOn.code || '',
        description: addOn.description || '',
        amountCents: addOn.amountCents
          ? String(
              deserializeAmount(
                addOn.amountCents,
                addOn.amountCurrency || organization?.defaultCurrency,
              ),
            )
          : addOn.amountCents || undefined,
        amountCurrency: addOn.amountCurrency || organization?.defaultCurrency || CurrencyEnum.Usd,
        taxes: addOn.taxes || [],
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOn?.id])

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
    !!addOn?.description,
  )

  useEffect(() => {
    setShouldDisplayDescription(!!addOn?.description)
  }, [addOn?.description])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      form.setFieldMeta('code', (meta) => ({
        ...meta,
        errorMap: {
          ...meta.errorMap,
          onDynamic: { message: 'text_632a2d437e341dcc76817556' },
        },
      }))
      scrollToTop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const codeValue = useStore(form.store, (state) => state.values.code)

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      form.setFieldMeta('code', (meta) => ({
        ...meta,
        errorMap: { ...meta.errorMap, onDynamic: undefined },
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeValue])

  const formValues = useStore(form.store, (state) => state.values)
  const amountCurrency = useStore(form.store, (state) => state.values.amountCurrency)
  const isDirty = useStore(form.store, (state) => state.isDirty)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.handleSubmit()
  }

  return (
    <div>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_629728388c4d2300e2d37fc2' : 'text_629728388c4d2300e2d37fbc')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            isDirty
              ? centralizedDialog.open({
                  title: translate('text_665deda4babaf700d603ea13'),
                  description: translate('text_665dedd557dc3c00c62eb83d'),
                  actionText: translate('text_645388d5bdbd7b00abffa033'),
                  colorVariant: 'danger',
                  onAction: onCloseRedirection,
                })
              : onCloseRedirection()
          }
        />
      </PageHeader.Wrapper>
      <form
        id={CREATE_ADD_ON_FORM_ID}
        className="min-height-minus-nav flex"
        onSubmit={handleFormSubmit}
      >
        <Main>
          <div>
            {loading ? (
              <>
                <div className="px-8">
                  <Skeleton variant="text" className="mb-5 w-70" />
                  <Skeleton variant="text" className="mb-4" />
                  <Skeleton variant="text" className="w-30" />
                </div>

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
                  <Typography variant="subhead1">
                    {translate('text_629728388c4d2300e2d38079')}
                  </Typography>

                  <NameAndCodeGroup
                    form={form}
                    fields={{ name: 'name', code: 'code' }}
                    disableAutoGenerateCode={isEdition}
                    nameProps={{
                      autoFocus: true,
                      label: translate('text_629728388c4d2300e2d38091'),
                      placeholder: translate('text_629728388c4d2300e2d380a5'),
                      className: 'flex-1',
                    }}
                    codeProps={{
                      label: translate('text_629728388c4d2300e2d380b7'),
                      placeholder: translate('text_629728388c4d2300e2d380d9'),
                      infoText: translate('text_629778b2a517d100c19bc524'),
                      className: 'flex-1',
                    }}
                  />

                  {shouldDisplayDescription ? (
                    <div className="flex items-center">
                      <form.AppField name="description">
                        {(field) => (
                          <field.TextInputField
                            className="mr-3 flex-1"
                            multiline
                            label={translate('text_629728388c4d2300e2d380f1')}
                            placeholder={translate('text_629728388c4d2300e2d38103')}
                            rows="3"
                          />
                        )}
                      </form.AppField>
                      <Tooltip
                        className="mt-6"
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          data-test={CREATE_ADD_ON_DESCRIPTION_DELETE_TEST_ID}
                          onClick={() => {
                            form.setFieldValue('description', '')
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
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </Card>

                <Card>
                  <Typography variant="subhead1">
                    {translate('text_629728388c4d2300e2d38117')}
                  </Typography>

                  <div className="flex flex-row items-start gap-3">
                    <form.AppField name="amountCents">
                      {(field) => (
                        <field.AmountInputField
                          className="flex-1"
                          currency={amountCurrency || CurrencyEnum.Usd}
                          data-test={CREATE_ADD_ON_AMOUNT_INPUT_TEST_ID}
                          beforeChangeFormatter={['positiveNumber']}
                          label={translate('text_629728388c4d2300e2d3812d')}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="amountCurrency">
                      {(field) => (
                        <field.ComboBoxField
                          containerClassName="max-w-30 mt-7"
                          data={Object.values(CurrencyEnum).map((currencyType) => ({
                            value: currencyType,
                          }))}
                          disableClearable
                        />
                      )}
                    </form.AppField>
                  </div>

                  <TaxesSelectorSection
                    title={translate('text_1760729707267seik64l67k8')}
                    taxes={formValues.taxes || []}
                    comboboxSelector={SEARCH_TAX_INPUT_FOR_ADD_ON_CLASSNAME}
                    onUpdate={(newTaxArray) => {
                      form.setFieldValue('taxes', newTaxArray)
                    }}
                  />
                </Card>

                <div className="px-6 pb-20">
                  <form.AppForm>
                    <form.SubmitButton
                      disabled={isEdition && !isDirty}
                      fullWidth
                      size="large"
                      dataTest="submit"
                    >
                      {translate(
                        isEdition
                          ? 'text_629728388c4d2300e2d38170'
                          : 'text_629728388c4d2300e2d38179',
                      )}
                    </form.SubmitButton>
                  </form.AppForm>
                </div>
              </>
            )}
          </div>
        </Main>
        <Side>
          <AddOnCodeSnippet loading={loading} addOn={formValues as unknown as CreateAddOnInput} />
        </Side>
      </form>
    </div>
  )
}

export default CreateAddOn
