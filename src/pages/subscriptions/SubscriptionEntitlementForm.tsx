import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { generatePath, useParams } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { ChargeTable } from '~/components/designSystem/Table/ChargeTable'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { ComboBox, ComboboxItem } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PrivilegeValueInputComponent } from '~/components/plans/PrivilegeValueInputComponent'
import { addToast } from '~/core/apolloClient'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_SUBSCRIPTION_ENTITLEMENT_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { CustomerSubscriptionDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import {
  CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE,
  PLAN_SUBSCRIPTION_DETAILS_ROUTE,
  useNavigate,
} from '~/core/router'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  CreateOrUpdateSubscriptionEntitlementInput,
  useCreateOrUpdateSubscriptionEntitlementMutation,
  useGetSubscriptionDataForEntitlementFormQuery,
  useGetSubscriptionEntitlementToEditQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'
import { useAppForm } from '~/hooks/forms/useAppform'
import {
  mapEntitlementToFormValues,
  mapPrivilegeConfigToFormValue,
  mapPrivilegesToApiInput,
} from '~/pages/subscriptions/subscriptionEntitlementForm/mappers'
import {
  SubscriptionEntitlementPrivilegeFormValue,
  subscriptionEntitlementValidationSchema,
} from '~/pages/subscriptions/subscriptionEntitlementForm/validationSchema'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

export const SUBSCRIPTION_ENTITLEMENT_FORM_ID = 'subscription-entitlement-form'

export const SUBSCRIPTION_ENTITLEMENT_FORM_CLOSE_BUTTON_TEST_ID =
  'subscription-entitlement-form-close-button'
export const SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_BUTTON_TEST_ID =
  'subscription-entitlement-form-cancel-button'
export const SUBSCRIPTION_ENTITLEMENT_FORM_SUBMIT_BUTTON_TEST_ID =
  'subscription-entitlement-form-submit-button'
export const SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID =
  'subscription-entitlement-form-feature-input'
export const SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID =
  'subscription-entitlement-form-add-privilege-button'
export const SUBSCRIPTION_ENTITLEMENT_FORM_PRIVILEGE_INPUT_TEST_ID =
  'subscription-entitlement-form-privilege-input'
export const SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_PRIVILEGE_BUTTON_TEST_ID =
  'subscription-entitlement-form-cancel-privilege-button'

gql`
  query getSubscriptionDataForEntitlementForm($subscriptionId: ID!) {
    subscriptionEntitlements(subscriptionId: $subscriptionId) {
      collection {
        code
        name
        privileges {
          code
          name
          value
          valueType
          config {
            selectOptions
          }
        }
      }
    }

    features(limit: 1000) {
      collection {
        code
        name
        privileges {
          code
          name
          valueType
          config {
            selectOptions
          }
        }
      }
    }
  }
  query getSubscriptionEntitlementToEdit($featureCode: String!, $subscriptionId: ID!) {
    subscriptionEntitlement(featureCode: $featureCode, subscriptionId: $subscriptionId) {
      code
      name
      privileges {
        code
        name
        value
        valueType
        config {
          selectOptions
        }
      }
    }
  }

  mutation createOrUpdateSubscriptionEntitlement(
    $input: CreateOrUpdateSubscriptionEntitlementInput!
  ) {
    createOrUpdateSubscriptionEntitlement(input: $input) {
      code
    }
  }
`

// The value cell is not a registered field wrapper, so the error has to be read
// off the field store by hand and shown as a tooltip: the inputs only take a
// boolean error flag, and helper text would change the row height.
const PrivilegeValueCell = ({
  privilege,
}: {
  privilege: SubscriptionEntitlementPrivilegeFormValue
}) => {
  const { translate } = useInternationalization()
  const field = useFieldContext<string>()

  const errorMessage = useStore(field.store, (state) => state.meta.errors)
    .map((error) => error?.message)
    .filter(Boolean)
    .join(' ')

  return (
    <Tooltip
      title={errorMessage ? translate(errorMessage) : ''}
      disableHoverListener={!errorMessage}
      placement="top"
    >
      <PrivilegeValueInputComponent
        translate={translate}
        name={field.name}
        valueType={privilege.valueType}
        value={field.state.value}
        config={privilege.config}
        error={!!errorMessage}
        onChange={(value) => field.handleChange(value || '')}
      />
    </Tooltip>
  )
}

const SubscriptionEntitlementForm = () => {
  const { entitlementCode = '', customerId = '', planId = '', subscriptionId = '' } = useParams()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const componentId = useId()
  const centralizedDialog = useCentralizedDialog()
  const [displayAddPrivilegeInput, setDisplayAddPrivilegeInput] = useState(false)

  const isEdition = !!entitlementCode

  const { data: subscriptionData, loading: subscriptionLoading } =
    useGetSubscriptionDataForEntitlementFormQuery({
      variables: { subscriptionId },
    })

  const { data: entitlementData, loading: entitlementLoading } =
    useGetSubscriptionEntitlementToEditQuery({
      variables: { featureCode: entitlementCode, subscriptionId },
      skip: !isEdition || !entitlementCode || !subscriptionId,
    })

  const isLoading = entitlementLoading

  const existingEntitlement = entitlementData?.subscriptionEntitlement

  const privilegeSearchClassName = useMemo(() => {
    // Replace all colons with dashes to make the class name valid for querySelector
    const usableComponentId = componentId.replace(/:/g, '-')

    return `${SEARCH_SUBSCRIPTION_ENTITLEMENT_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME}-${usableComponentId}`
  }, [componentId])

  const onLeave = useCallback(() => {
    if (!!customerId) {
      navigate(
        generatePath(CUSTOMER_SUBSCRIPTION_DETAILS_ROUTE, {
          customerId,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.entitlements,
        }),
      )
    } else if (!!planId) {
      navigate(
        generatePath(PLAN_SUBSCRIPTION_DETAILS_ROUTE, {
          planId,
          subscriptionId,
          tab: CustomerSubscriptionDetailsTabsOptionsEnum.entitlements,
        }),
      )
    }
  }, [customerId, navigate, planId, subscriptionId])

  const openDirtyAttributesWarning = useCallback(() => {
    centralizedDialog.open({
      title: translate('text_6244277fe0975300fe3fb940'),
      description: translate('text_17561254890579cfr8pj6afl'),
      actionText: translate('text_6244277fe0975300fe3fb94c'),
      colorVariant: 'danger',
      onAction: () => onLeave(),
    })
  }, [centralizedDialog, onLeave, translate])

  const [createOrUpdateEntitlement] = useCreateOrUpdateSubscriptionEntitlementMutation({
    onCompleted({ createOrUpdateSubscriptionEntitlement }) {
      if (!!createOrUpdateSubscriptionEntitlement?.code) {
        addToast({
          severity: 'success',
          translateKey: isEdition
            ? 'text_17558572087888xlvutbxm98'
            : 'text_17558572087886chozdb8kiz',
        })

        onLeave()
      }
    },
  })

  const form = useAppForm({
    defaultValues: mapEntitlementToFormValues(existingEntitlement),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: subscriptionEntitlementValidationSchema,
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(
        SUBSCRIPTION_ENTITLEMENT_FORM_ID,
        (formApi.state.errorMap.onDynamic || {}) as Record<string, unknown>,
      )
    },
    onSubmit: async ({ value }) => {
      const input = {
        subscriptionId,
        entitlement: {
          featureCode: value.code,
          privileges: mapPrivilegesToApiInput(value.privileges),
        },
      } satisfies CreateOrUpdateSubscriptionEntitlementInput

      await createOrUpdateEntitlement({
        variables: {
          input,
        },
      })
    },
  })

  const isDirty = useStore(form.store, (state) => !state.isDefaultValue)
  const featureCode = useStore(form.store, (state) => state.values.code)
  const privileges = useStore(form.store, (state) => state.values.privileges)

  useEffect(() => {
    if (existingEntitlement) {
      form.reset(mapEntitlementToFormValues(existingEntitlement))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingEntitlement])

  const featuresListComboboxData = useMemo(() => {
    if (!subscriptionData) return []

    const { subscriptionEntitlements, features } = subscriptionData

    return (features?.collection || []).map((item) => {
      const { code, name } = item

      return {
        label: `${name} (${code})`,
        value: code,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {code}
            </Typography>
          </ComboboxItem>
        ),
        disabled: subscriptionEntitlements?.collection?.some(
          (entitlement) => entitlement.code === code,
        ),
      }
    })
  }, [subscriptionData])

  const privilegesListComboBoxData = useMemo(() => {
    if (!subscriptionData?.features?.collection?.length) return []

    const feature = subscriptionData.features.collection.find((f) => f.code === featureCode)

    if (!feature) return []

    return (feature?.privileges || []).map((privilege) => ({
      value: privilege.code,
      label: `${privilege.name} (${privilege.code})`,
      labelNode: (
        <ComboboxItem>
          <Typography variant="body" color="grey700" noWrap>
            {privilege.name}
          </Typography>
          <Typography variant="caption" color="grey600" noWrap>
            {privilege.code}
          </Typography>
        </ComboboxItem>
      ),
      disabled: privileges.some((privilegeForUpdate) => privilegeForUpdate.code === privilege.code),
    }))
  }, [featureCode, privileges, subscriptionData?.features?.collection])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={SUBSCRIPTION_ENTITLEMENT_FORM_ID}
        className="flex min-h-full flex-col"
        onSubmit={handleSubmit}
      >
        <CenteredPage.Header>
          <div className="flex gap-2">
            <Typography variant="bodyHl" color="textSecondary" noWrap>
              {translate(
                isEdition ? 'text_17561254890571tcj63iu382' : 'text_1753864223060devvklm7vk0',
              )}
            </Typography>
            <Chip size="small" label={translate('text_65d8d71a640c5400917f8a13')} />
          </div>
          <Button
            variant="quaternary"
            icon="close"
            data-test={SUBSCRIPTION_ENTITLEMENT_FORM_CLOSE_BUTTON_TEST_ID}
            onClick={() => (isDirty ? openDirtyAttributesWarning() : onLeave())}
          />
        </CenteredPage.Header>

        <CenteredPage.Container>
          {isLoading && <FormLoadingSkeleton id="create-alert" />}
          {!isLoading && (
            <>
              <div className="not-last-child:mb-1">
                <Typography variant="headline" color="grey700">
                  {translate('text_1756125489057x892tvlnat0')}
                </Typography>
                <Typography variant="body" color="grey600">
                  {translate('text_17538642230602p03937fj0f')}
                </Typography>
              </div>

              <div className="flex flex-col gap-12">
                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead1">
                      {translate('text_17561254890572l8l58nidzn')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1756125489057oq6le0rt7mw')}
                    </Typography>
                  </div>
                  <div className="flex flex-col gap-12 *:flex-1">
                    <form.AppField name="code">
                      {(field) => (
                        <field.ComboBoxField
                          disableClearable={isEdition}
                          placeholder={translate('text_1753864223060h6i2e7303eb')}
                          disabled={isEdition}
                          loading={subscriptionLoading}
                          data={featuresListComboboxData}
                          dataTest={SUBSCRIPTION_ENTITLEMENT_FORM_FEATURE_INPUT_TEST_ID}
                        />
                      )}
                    </form.AppField>

                    {!!privileges.length && (
                      <div className="-mx-4 -my-1 w-full overflow-auto px-4 py-1">
                        <ChargeTable
                          className="w-full"
                          name={`feature-entitlement-${featureCode}-privilege-table`}
                          data={privileges}
                          deleteTooltipContent={translate('text_17538642230608t3xmlgja96')}
                          onDeleteRow={(_row, index) => {
                            form.removeFieldValue('privileges', index)
                          }}
                          columns={[
                            {
                              size: 300,
                              title: (
                                <Typography variant="captionHl" className="px-4">
                                  {translate('text_175386422306019wldpp8h5q')}
                                </Typography>
                              ),
                              content: (row) => (
                                <Typography variant="body" color="grey700" className="px-4">
                                  {row.name || row.code}
                                </Typography>
                              ),
                            },
                            {
                              size: 300,
                              title: (
                                <Typography variant="captionHl" className="px-4">
                                  {translate('text_63fcc3218d35b9377840f5ab')}
                                </Typography>
                              ),
                              content: (row, rowIndex) => (
                                <form.AppField name={`privileges[${rowIndex}].value`}>
                                  {() => <PrivilegeValueCell privilege={row} />}
                                </form.AppField>
                              ),
                            },
                          ]}
                        />
                      </div>
                    )}

                    {displayAddPrivilegeInput ? (
                      <div className="flex w-full items-center gap-3">
                        <ComboBox
                          disableClearable
                          containerClassName="w-full"
                          placeholder={translate('text_1753864223060yk3svyv4dpr')}
                          loading={subscriptionLoading}
                          data={privilegesListComboBoxData}
                          className={privilegeSearchClassName}
                          data-test={SUBSCRIPTION_ENTITLEMENT_FORM_PRIVILEGE_INPUT_TEST_ID}
                          onChange={(selectedPrivilege) => {
                            if (!selectedPrivilege) return

                            const selectedFeature = subscriptionData?.features?.collection.find(
                              (feature) => feature.code === featureCode,
                            )

                            const selectedPrivilegeFullData = selectedFeature?.privileges.find(
                              (privilege) => privilege.code === selectedPrivilege,
                            )

                            if (!selectedPrivilegeFullData) {
                              setDisplayAddPrivilegeInput(false)
                              return
                            }

                            form.pushFieldValue('privileges', {
                              code: selectedPrivilegeFullData.code,
                              config: mapPrivilegeConfigToFormValue(
                                selectedPrivilegeFullData.config,
                              ),
                              name: selectedPrivilegeFullData.name || '',
                              value: '',
                              valueType: selectedPrivilegeFullData.valueType,
                            })

                            setDisplayAddPrivilegeInput(false)
                          }}
                        />
                        <Tooltip
                          placement="top-end"
                          title={translate('text_63aa085d28b8510cd46443ff')}
                        >
                          <Button
                            variant="quaternary"
                            icon="trash"
                            data-test={
                              SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_PRIVILEGE_BUTTON_TEST_ID
                            }
                            onClick={() => {
                              setDisplayAddPrivilegeInput(false)
                            }}
                          />
                        </Tooltip>
                      </div>
                    ) : (
                      <Tooltip
                        title={translate('text_1756125489057qfgsq8im2b2')}
                        placement="top-start"
                        disableHoverListener={!!featureCode}
                      >
                        <Button
                          align="left"
                          variant="inline"
                          startIcon="plus"
                          disabled={!featureCode}
                          data-test={SUBSCRIPTION_ENTITLEMENT_FORM_ADD_PRIVILEGE_BUTTON_TEST_ID}
                          onClick={() => {
                            setDisplayAddPrivilegeInput(true)

                            scrollToAndClickElement({
                              selector: `.${privilegeSearchClassName} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                            })
                          }}
                        >
                          {translate('text_1753864223060n9hxs03sa15')}
                        </Button>
                      </Tooltip>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            data-test={SUBSCRIPTION_ENTITLEMENT_FORM_CANCEL_BUTTON_TEST_ID}
            onClick={() => (isDirty ? openDirtyAttributesWarning() : onLeave())}
          >
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.AppForm>
            <form.SubmitButton
              dataTest={SUBSCRIPTION_ENTITLEMENT_FORM_SUBMIT_BUTTON_TEST_ID}
              disabled={isLoading}
            >
              {translate(
                isEdition ? 'text_17432414198706rdwf76ek3u' : 'text_17561254890574dcio8alli4',
              )}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>
    </CenteredPage.Wrapper>
  )
}

export default SubscriptionEntitlementForm
