import { gql } from '@apollo/client'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { forwardRef, useId, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Drawer, DrawerRef } from '~/components/designSystem/Drawer'
import { Selector } from '~/components/designSystem/Selector'
import { ChargeTable } from '~/components/designSystem/Table/ChargeTable'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { ComboBox, ComboboxItem } from '~/components/form'
import { TextInput } from '~/components/form/TextInput/TextInput'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { LocalPrivilegeInput } from '~/components/plans/types'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_FEATURE_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME,
  SEARCH_FEATURE_SELECT_OPTIONS_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  LagoApiError,
  PrivilegeValueTypeEnum,
  useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery,
  useGetFeaturesListForPlanSectionLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useFieldContext } from '~/hooks/forms/formContext'
import { useAppForm } from '~/hooks/forms/useAppform'

gql`
  fragment FeatureEntitlementPrivilegeForPlan on PlanEntitlementPrivilegeObject {
    code
    name
    value
    valueType
    config {
      selectOptions
    }
  }

  fragment FeatureObjectEntitlementPrivilegeForPlan on FeatureObject {
    id
    code
    name
    privileges {
      id
      name
      code
      valueType
      config {
        selectOptions
      }
    }
  }

  query getFeatureDetailsForFeatureEntitlementPrivilegeSection($code: String) {
    feature(code: $code) {
      ...FeatureObjectEntitlementPrivilegeForPlan
    }
  }
`

export interface FeatureEntitlementFormValues {
  featureId: string
  featureName: string
  featureCode: string
  privileges: LocalPrivilegeInput[]
}

const privilegeSchema = z.object({
  privilegeCode: z.string().min(1),
  privilegeName: z.string().nullable(),
  value: z.string().min(1, 'text_1771342994699klxu2paz7g8'),
  id: z.string().optional(),
  valueType: z.custom<PrivilegeValueTypeEnum>(),
  config: z.object({ selectOptions: z.array(z.string()).nullable().optional() }).optional(),
})

const featureEntitlementSchema = z.object({
  featureId: z.string(),
  featureName: z.string(),
  featureCode: z.string().min(1, 'text_1771342994699klxu2paz7g8'),
  privileges: z.array(privilegeSchema),
})

const DEFAULT_VALUES: FeatureEntitlementFormValues = {
  featureId: '',
  featureName: '',
  featureCode: '',
  privileges: [],
}

const FEATURE_ENTITLEMENT_FORM_ID = 'feature-entitlement-drawer-form'

export interface FeatureEntitlementDrawerRef {
  openDrawer: (values?: FeatureEntitlementFormValues) => void
  closeDrawer: () => void
}

interface FeatureEntitlementDrawerProps {
  onSave: (values: FeatureEntitlementFormValues) => void
  existingFeatureCodes: string[]
}

export const FeatureEntitlementDrawer = forwardRef<
  FeatureEntitlementDrawerRef,
  FeatureEntitlementDrawerProps
>(({ onSave, existingFeatureCodes }, ref) => {
  const componentId = useId()
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)
  const [displayAddPrivilegeInput, setDisplayAddPrivilegeInput] = useState(false)

  const featureSearchClassName = useMemo(() => {
    const usableComponentId = componentId.replace(/:/g, '-')

    return `${SEARCH_FEATURE_SELECT_OPTIONS_INPUT_CLASSNAME}-${usableComponentId}`
  }, [componentId])

  const privilegeSearchClassName = useMemo(() => {
    const usableComponentId = componentId.replace(/:/g, '-')

    return `${SEARCH_FEATURE_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME}-${usableComponentId}`
  }, [componentId])

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: featureEntitlementSchema,
    },
    onSubmit: ({ value }) => {
      onSave({
        ...value,
        privileges: value.privileges || [],
      })
      drawerRef.current?.closeDrawer()
    },
  })

  useImperativeHandle(ref, () => ({
    openDrawer: (values?: FeatureEntitlementFormValues) => {
      if (values) {
        form.reset({ ...values, privileges: values.privileges ?? [] }, { keepDefaultValues: true })
      } else {
        form.reset()
      }
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => {
      drawerRef.current?.closeDrawer()
    },
  }))

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const values = useStore(form.store, (state) => state.values)

  const isAddMode = values.featureCode === ''

  const [getFeaturesList, { data: featuresListData, loading: isLoadingFeaturesList }] =
    useGetFeaturesListForPlanSectionLazyQuery()

  const { data: featureDetailsData, loading: featureDetailsLoading } =
    useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery({
      variables: { code: values.featureCode },
      skip: !values.featureCode,
      context: { silentErrorCodes: [LagoApiError.NotFound] },
    })

  const featuresListComboBoxData = useMemo(() => {
    if (!featuresListData?.features?.collection.length) return []

    return featuresListData.features.collection.map((feature) => {
      const { name, code } = feature

      return {
        value: code,
        label: `${name} (${code})`,
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
        disabled: existingFeatureCodes.includes(code),
      }
    })
  }, [featuresListData, existingFeatureCodes])

  const privilegesListComboBoxData = useMemo(() => {
    if (!featureDetailsData?.feature.privileges?.length) return []

    return featureDetailsData.feature.privileges.map((privilege) => {
      const { id, code, name } = privilege

      return {
        value: id,
        label: `${name} (${code})`,
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
        disabled: values.privileges?.some((p) => p.privilegeCode === code),
      }
    })
  }, [values.privileges, featureDetailsData?.feature.privileges])

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <Drawer
      ref={drawerRef}
      title={translate('text_63e26d8308d03687188221a6')}
      showCloseWarningDialog={isDirty}
      onClose={() => {
        form.reset()
        setDisplayAddPrivilegeInput(false)
      }}
      stickyBottomBar={({ closeDrawer }) => (
        <div className="flex justify-end gap-3">
          <Button variant="quaternary" onClick={closeDrawer}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.Subscribe selector={({ canSubmit }) => canSubmit}>
            {(canSubmit) => (
              <Button
                data-test="feature-entitlement-drawer-save"
                onClick={handleFormSubmit}
                disabled={!canSubmit}
              >
                {translate('text_17295436903260tlyb1gp1i7')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      )}
      stickyBottomBarClassName="md:py-0 flex items-center justify-end gap-3"
    >
      <form id={FEATURE_ENTITLEMENT_FORM_ID} onSubmit={handleFormSubmit}>
        <button type="submit" hidden aria-hidden="true" />

        <CenteredPage.SectionWrapper>
          <CenteredPage.PageTitle
            title={translate('text_63e26d8308d03687188221a6')}
            description={translate('text_17538642230602p03937fj0f')}
          />

          <CenteredPage.SubsectionWrapper>
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle title={translate('text_1773428494589gq89ubgz99i')} />

              {isAddMode ? (
                <form.AppField
                  name="featureCode"
                  listeners={{
                    onChange: ({ value }) => {
                      const selectedFeature = featuresListData?.features?.collection.find(
                        (feature) => feature.code === value,
                      )

                      if (!selectedFeature) return

                      form.setFieldValue('featureId', selectedFeature.id)
                      form.setFieldValue('featureName', selectedFeature.name || '')
                    },
                  }}
                >
                  {(field) => (
                    <field.ComboBoxField
                      disableClearable
                      containerClassName="w-full"
                      placeholder={translate('text_1753864223060h6i2e7303eb')}
                      loading={isLoadingFeaturesList}
                      data={featuresListComboBoxData}
                      className={featureSearchClassName}
                      searchQuery={getFeaturesList}
                    />
                  )}
                </form.AppField>
              ) : (
                <Selector
                  icon="switch"
                  title={values.featureName || values.featureCode}
                  subtitle={values.featureCode}
                />
              )}
            </CenteredPage.PageSection>

            {!!values.featureCode && (
              <CenteredPage.PageSection>
                <CenteredPage.PageSectionTitle
                  title={translate('text_17538642230604pul58koirl')}
                  description={translate('text_1753864223060yrey0yur60j')}
                />

                {values.privileges.length > 0 && (
                  <div className="flex flex-col gap-4 *:w-full *:flex-1">
                    <Alert type="info">{translate('text_1753864223060ysekqpoor2y')}</Alert>

                    <div className="-mx-4 -my-1 w-full overflow-auto px-4 py-1">
                      <ChargeTable
                        className="w-full"
                        name={`feature-entitlement-${values.featureCode}-privilege-table`}
                        data={values.privileges}
                        deleteTooltipContent={translate('text_17538642230608t3xmlgja96')}
                        onDeleteRow={(_row, index) => {
                          form.removeFieldValue('privileges', index)
                        }}
                        columns={[
                          {
                            size: 290,
                            title: (
                              <Typography variant="captionHl" className="px-4">
                                {translate('text_175386422306019wldpp8h5q')}
                              </Typography>
                            ),
                            content: (row) => (
                              <Typography variant="body" color="grey700" className="px-4">
                                {row.privilegeName || row.privilegeCode}
                              </Typography>
                            ),
                          },
                          {
                            size: 310,
                            title: (
                              <Typography variant="captionHl" className="px-4">
                                {translate('text_63fcc3218d35b9377840f5ab')}
                              </Typography>
                            ),
                            content: (row, rowIndex) => (
                              <form.AppField name={`privileges[${rowIndex}].value`}>
                                {() => <PrivilegeValueCell row={row} />}
                              </form.AppField>
                            ),
                          },
                        ]}
                      />
                    </div>
                  </div>
                )}

                {displayAddPrivilegeInput ? (
                  <div className="flex w-full items-center gap-3">
                    <ComboBox
                      disableClearable
                      containerClassName="w-full"
                      placeholder={translate('text_1753864223060yk3svyv4dpr')}
                      loading={featureDetailsLoading}
                      data={privilegesListComboBoxData}
                      className={privilegeSearchClassName}
                      onChange={(selectedPrivilege) => {
                        if (!selectedPrivilege) return

                        const selectedPrivilegeFullData =
                          featureDetailsData?.feature.privileges.find(
                            (privilege) => privilege.id === selectedPrivilege,
                          )

                        if (!selectedPrivilegeFullData) {
                          setDisplayAddPrivilegeInput(false)
                          return
                        }

                        form.setFieldValue('privileges', [
                          ...values.privileges,
                          {
                            privilegeCode: selectedPrivilegeFullData.code,
                            privilegeName: selectedPrivilegeFullData.name,
                            valueType: selectedPrivilegeFullData.valueType,
                            config: selectedPrivilegeFullData.config,
                            value: '',
                          },
                        ])

                        setDisplayAddPrivilegeInput(false)
                      }}
                    />

                    <Tooltip placement="top-end" title={translate('text_63ea0f84f400488553caa786')}>
                      <Button
                        variant="quaternary"
                        icon="trash"
                        onClick={() => {
                          setDisplayAddPrivilegeInput(false)
                        }}
                      />
                    </Tooltip>
                  </div>
                ) : (
                  <Button
                    align="left"
                    variant="inline"
                    startIcon="plus"
                    onClick={() => {
                      setDisplayAddPrivilegeInput(true)

                      scrollToAndClickElement({
                        selector: `.${privilegeSearchClassName} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                      })
                    }}
                  >
                    {translate('text_1753864223060n9hxs03sa15')}
                  </Button>
                )}
              </CenteredPage.PageSection>
            )}
          </CenteredPage.SubsectionWrapper>
        </CenteredPage.SectionWrapper>
      </form>
    </Drawer>
  )
})

FeatureEntitlementDrawer.displayName = 'FeatureEntitlementDrawer'

function PrivilegeValueCell({ row }: { row: LocalPrivilegeInput }) {
  const field = useFieldContext<string>()
  const { translate } = useInternationalization()

  const errors = useStore(field.store, (state) => state.meta.errors)
  const hasError = errors.length > 0
  const errorMessage = hasError ? translate(errors.map((e) => e.message).join('') as string) : ''

  if (row.valueType === PrivilegeValueTypeEnum.Select) {
    return (
      <Tooltip title={errorMessage} disableHoverListener={!hasError} placement="top">
        <ComboBox
          variant="outlined"
          value={field.state.value}
          error={hasError}
          placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
          data={
            row.config?.selectOptions?.map((option) => ({
              label: option,
              value: option,
            })) || []
          }
          onChange={(v) => field.handleChange(v)}
        />
      </Tooltip>
    )
  }

  if (row.valueType === PrivilegeValueTypeEnum.Boolean) {
    return (
      <Tooltip title={errorMessage} disableHoverListener={!hasError} placement="top">
        <ComboBox
          variant="outlined"
          value={field.state.value}
          error={hasError}
          placeholder={translate('text_1753864223060ji5l38phiya')}
          data={[
            { label: translate('text_65251f46339c650084ce0d57'), value: 'true' },
            { label: translate('text_65251f4cd55aeb004e5aa5ef'), value: 'false' },
          ]}
          onChange={(v) => field.handleChange(v)}
        />
      </Tooltip>
    )
  }

  return (
    <Tooltip title={errorMessage} disableHoverListener={!hasError} placement="top">
      <TextInput
        name={field.name}
        value={field.state.value}
        onChange={(value) => field.handleChange(String(value ?? ''))}
        onBlur={field.handleBlur}
        error={hasError}
        variant="outlined"
        placeholder={
          row.valueType === PrivilegeValueTypeEnum.Integer
            ? translate('text_1753864223060bxskzw3877s')
            : translate('text_1753864223060d5jej59ti86')
        }
        beforeChangeFormatter={
          row.valueType === PrivilegeValueTypeEnum.Integer ? ['int', 'positiveNumber'] : undefined
        }
      />
    </Tooltip>
  )
}
