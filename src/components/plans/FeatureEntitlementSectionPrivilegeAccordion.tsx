import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { Alert, Tooltip } from 'lago-design-system'
import { FC, useId, useMemo, useState } from 'react'

import { Accordion, Button, ChargeTable, Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem, TextInput } from '~/components/form'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_FEATURE_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  PrivilegeValueTypeEnum,
  useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery,
} from '~/generated/graphql'
import { TranslateFunc, useInternationalization } from '~/hooks/core/useInternationalization'

import { LocalEntitlementInput, PlanFormInput } from './types'

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

interface FeatureEntitlementSectionPrivilegeAccordionProps {
  formikProps: FormikProps<PlanFormInput>
  entitlement: LocalEntitlementInput
  isCreatingPlan?: boolean
}

export const FeatureEntitlementSectionPrivilegeAccordion: FC<
  FeatureEntitlementSectionPrivilegeAccordionProps
> = ({ formikProps, entitlement, isCreatingPlan }) => {
  const componentId = useId()
  const { translate } = useInternationalization()

  const [displayAddPrivilegeInput, setDisplayAddPrivilegeInput] = useState(false)

  const privilegeSearchClassName = useMemo(() => {
    // Replace all colons with dashes to make the class name valid for querySelector
    const usableComponentId = componentId.replace(/:/g, '-')

    return `${SEARCH_FEATURE_PRIVILEGE_SELECT_OPTIONS_INPUT_CLASSNAME}-${usableComponentId}`
  }, [componentId])

  const { data: featureDetailsData, loading: featureDetailsLoading } =
    useGetFeatureDetailsForFeatureEntitlementPrivilegeSectionQuery({
      variables: {
        code: entitlement.featureCode,
      },
    })

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
        disabled: entitlement.privileges?.some((p) => p.privilegeCode === code),
      }
    })
  }, [entitlement.privileges, featureDetailsData?.feature.privileges])

  return (
    <Accordion
      className="w-full"
      initiallyOpen={isCreatingPlan}
      summary={
        <div className="flex w-full items-center justify-between gap-4">
          <div className="flex flex-col">
            <Typography variant="bodyHl" color="grey700" noWrap>
              {entitlement.featureName || ''}
            </Typography>
            <Typography variant="caption" color="grey600" noWrap>
              {entitlement.featureCode}
            </Typography>
          </div>

          <Tooltip placement="top-end" title={translate('text_63ea0f84f400488553caa786')}>
            <Button
              icon="trash"
              variant="quaternary"
              onClick={() => {
                formikProps.setFieldValue(
                  'entitlements',
                  formikProps.values.entitlements.filter(
                    ({ featureCode }) => featureCode !== entitlement.featureCode,
                  ),
                )
              }}
            />
          </Tooltip>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            {translate('text_17538642230604pul58koirl')}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_1753864223060yrey0yur60j')}
          </Typography>
        </div>

        {!!entitlement.privileges?.length && (
          <div className="flex flex-col gap-4 *:w-full *:flex-1">
            <Alert type="info">{translate('text_1753864223060ysekqpoor2y')}</Alert>

            <div className="-mx-4 -my-1 w-full overflow-auto px-4 py-1">
              <ChargeTable
                className="w-full"
                name={`feature-entitlement-${entitlement.featureCode}-privilege-table`}
                data={entitlement.privileges || []}
                deleteTooltipContent={translate('text_17538642230608t3xmlgja96')}
                onDeleteRow={(row) => {
                  formikProps.setFieldValue(
                    'entitlements',
                    formikProps.values.entitlements.map((entitlementForUpdate) =>
                      entitlementForUpdate.featureCode === entitlement.featureCode
                        ? {
                            ...entitlementForUpdate,
                            privileges: entitlementForUpdate.privileges.filter(
                              (p) => p.privilegeCode !== row.privilegeCode,
                            ),
                          }
                        : entitlementForUpdate,
                    ),
                  )
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
                    content: (row, rowIndex) => {
                      return (
                        <PrivilegeValueInputComponent
                          translate={translate}
                          valueType={row.valueType}
                          value={row.value}
                          config={row.config}
                          onChange={(value) => {
                            formikProps.setFieldValue(
                              'entitlements',
                              formikProps.values.entitlements.map((entitlementForUpdate) =>
                                entitlementForUpdate.featureCode === entitlement.featureCode
                                  ? {
                                      ...entitlementForUpdate,
                                      privileges: [
                                        ...(entitlementForUpdate.privileges.map((p, pIndex) =>
                                          rowIndex === pIndex
                                            ? {
                                                ...p,
                                                value: value,
                                              }
                                            : p,
                                        ) || []),
                                      ],
                                    }
                                  : entitlementForUpdate,
                              ),
                            )
                          }}
                        />
                      )
                    },
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

                const selectedPrivilegeFullData = featureDetailsData?.feature.privileges.find(
                  (privilege) => privilege.id === selectedPrivilege,
                )

                if (!selectedPrivilegeFullData) {
                  setDisplayAddPrivilegeInput(false)
                  return
                }

                formikProps.setFieldValue(
                  'entitlements',
                  formikProps.values.entitlements.map((entitlementForUpdate) =>
                    entitlementForUpdate.featureCode === entitlement.featureCode
                      ? {
                          ...entitlementForUpdate,
                          privileges: [
                            ...(entitlementForUpdate.privileges || []),
                            {
                              privilegeCode: selectedPrivilegeFullData?.code,
                              privilegeName: selectedPrivilegeFullData?.name,
                              valueType: selectedPrivilegeFullData?.valueType,
                              config: selectedPrivilegeFullData?.config,
                              value: '',
                            },
                          ],
                        }
                      : entitlementForUpdate,
                  ),
                )

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
      </div>
    </Accordion>
  )
}

FeatureEntitlementSectionPrivilegeAccordion.displayName =
  'FeatureEntitlementSectionPrivilegeAccordion'

export const PrivilegeValueInputComponent: FC<{
  valueType: PrivilegeValueTypeEnum
  value: string | undefined
  onChange: (value: string | undefined) => void
  translate: TranslateFunc
  config?: {
    selectOptions?: string[] | null
  }
}> = ({ valueType, value, onChange, translate, config }) => {
  if (valueType === PrivilegeValueTypeEnum.Select) {
    return (
      <ComboBox
        variant="outlined"
        value={value}
        placeholder={translate('text_66ab42d4ece7e6b7078993b1')}
        data={
          config?.selectOptions?.map((option) => ({
            label: option,
            value: option,
          })) || []
        }
        onChange={(newValue) => {
          onChange(newValue)
        }}
      />
    )
  }

  if (valueType === PrivilegeValueTypeEnum.Boolean) {
    return (
      <ComboBox
        variant="outlined"
        value={value}
        placeholder={translate('text_1753864223060ji5l38phiya')}
        data={[
          {
            label: translate('text_65251f46339c650084ce0d57'),
            value: 'true',
          },
          {
            label: translate('text_65251f4cd55aeb004e5aa5ef'),
            value: 'false',
          },
        ]}
        onChange={(newValue) => {
          onChange(newValue)
        }}
      />
    )
  }

  return (
    <TextInput
      variant="outlined"
      value={value}
      placeholder={
        valueType === PrivilegeValueTypeEnum.Integer
          ? translate('text_1753864223060bxskzw3877s')
          : translate('text_1753864223060d5jej59ti86')
      }
      beforeChangeFormatter={
        valueType === PrivilegeValueTypeEnum.Integer ? ['int', 'positiveNumber'] : undefined
      }
      onChange={(newValue) => {
        onChange(String(newValue))
      }}
    />
  )
}
