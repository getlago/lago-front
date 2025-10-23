import { gql } from '@apollo/client'
import { Box } from '@mui/material'
import { FormikProps } from 'formik'
import { Icon } from 'lago-design-system'
import { FC, useId, useMemo, useState } from 'react'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem } from '~/components/form'
import { FeatureEntitlementSectionPrivilegeAccordion } from '~/components/plans/FeatureEntitlementSectionPrivilegeAccordion'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import {
  MUI_INPUT_BASE_ROOT_CLASSNAME,
  SEARCH_FEATURE_SELECT_OPTIONS_INPUT_CLASSNAME,
} from '~/core/constants/form'
import { scrollToAndClickElement } from '~/core/utils/domUtils'
import {
  FeatureEntitlementPrivilegeForPlanFragmentDoc,
  FeatureObjectEntitlementPrivilegeForPlanFragmentDoc,
  useGetFeaturesListForPlanSectionLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { PlanFormInput } from './types'

gql`
  fragment FeatureEntitlementForPlan on Plan {
    entitlements {
      code
      name
      privileges {
        ...FeatureEntitlementPrivilegeForPlan
      }
    }
  }

  query getFeaturesListForPlanSection($limit: Int, $page: Int, $searchTerm: String) {
    features(limit: $limit, page: $page, searchTerm: $searchTerm) {
      collection {
        id
        name
        code
        ...FeatureObjectEntitlementPrivilegeForPlan
      }
    }
  }

  ${FeatureEntitlementPrivilegeForPlanFragmentDoc}
  ${FeatureObjectEntitlementPrivilegeForPlanFragmentDoc}
`

interface FeatureEntitlementSectionProps {
  formikProps: FormikProps<PlanFormInput>
  isInSubscriptionForm?: boolean
  isEdition?: boolean
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const FeatureEntitlementSection: FC<FeatureEntitlementSectionProps> = ({
  formikProps,
  isInSubscriptionForm = false,
  isEdition = false,
  premiumWarningDialogRef,
}) => {
  const componentId = useId()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const [displayAddFeatureEntitlementInput, setDisplayAddFeatureEntitlementInput] = useState(false)

  const [getFeaturesList, { data: featuresListData, loading: isLoadingFeaturesList }] =
    useGetFeaturesListForPlanSectionLazyQuery()

  const featureSearchClassName = useMemo(() => {
    // Replace all colons with dashes to make the class name valid for querySelector
    const usableComponentId = componentId.replace(/:/g, '-')

    return `${SEARCH_FEATURE_SELECT_OPTIONS_INPUT_CLASSNAME}-${usableComponentId}`
  }, [componentId])

  const featuresListComboBoxData = useMemo(() => {
    if (!featuresListData?.features?.collection.length) return []

    return featuresListData.features.collection.map((feature) => {
      const { id, name, code } = feature

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
        disabled: formikProps.values.entitlements?.some(
          (entitlement) => entitlement.featureCode === code,
        ),
      }
    })
  }, [featuresListData, formikProps.values.entitlements])

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex flex-col gap-1">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63e26d8308d03687188221a6')}
        </Typography>

        <Typography
          variant="caption"
          color="grey600"
          html={translate('text_17538642230602p03937fj0f')}
        />
      </div>

      {!isPremium && (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-grey-100 px-6 py-4">
          <Box>
            <div className="flex items-center justify-start gap-2">
              <Typography variant="bodyHl" color="textSecondary">
                {translate('text_1753864223060kmmxk4a59aj')}
              </Typography>
              <Icon name="sparkles" />
            </div>
            <Typography variant="caption">{translate('text_17538642230601w4ue2sz9iy')}</Typography>
          </Box>
          <Button
            variant="tertiary"
            size="medium"
            endIcon="sparkles"
            onClick={() => {
              premiumWarningDialogRef?.current?.openDialog({
                mailtoSubject: translate('text_172434514289283gmf8bdhhe'),
              })
            }}
          >
            {translate('text_65ae73ebe3a66bec2b91d72d')}
          </Button>
        </div>
      )}

      {isPremium && (
        <>
          {!!formikProps.values.entitlements?.length && (
            <div className="flex w-full flex-col gap-4">
              {formikProps.values.entitlements.map((entitlement) => (
                <FeatureEntitlementSectionPrivilegeAccordion
                  key={`feature-entitlement-${entitlement.featureCode}`}
                  formikProps={formikProps}
                  entitlement={entitlement}
                  isCreatingPlan={!isEdition && !isInSubscriptionForm}
                />
              ))}
            </div>
          )}

          {displayAddFeatureEntitlementInput && (
            <div className="flex w-full items-center gap-3">
              <ComboBox
                disableClearable
                containerClassName="w-full"
                placeholder={translate('text_1753864223060h6i2e7303eb')}
                loading={isLoadingFeaturesList}
                data={featuresListComboBoxData}
                className={featureSearchClassName}
                searchQuery={getFeaturesList}
                onChange={(selectedFeatureId) => {
                  const selectedFeature = featuresListData?.features?.collection.find(
                    (feature) => feature.id === selectedFeatureId,
                  )

                  if (!selectedFeature) {
                    setDisplayAddFeatureEntitlementInput(false)
                    return
                  }

                  formikProps.setFieldValue('entitlements', [
                    ...(formikProps.values.entitlements || []),
                    {
                      featureId: selectedFeature.id,
                      featureName: selectedFeature.name,
                      featureCode: selectedFeature.code,
                      privileges: [],
                    },
                  ])

                  setDisplayAddFeatureEntitlementInput(false)
                }}
              />

              <Tooltip placement="top-end" title={translate('text_63ea0f84f400488553caa786')}>
                <Button
                  icon="trash"
                  variant="quaternary"
                  onClick={() => {
                    setDisplayAddFeatureEntitlementInput(false)
                  }}
                />
              </Tooltip>
            </div>
          )}

          {!displayAddFeatureEntitlementInput && (
            <Button
              variant="inline"
              startIcon="plus"
              onClick={() => {
                setDisplayAddFeatureEntitlementInput(true)

                scrollToAndClickElement({
                  selector: `.${featureSearchClassName} .${MUI_INPUT_BASE_ROOT_CLASSNAME}`,
                })
              }}
            >
              {translate('text_1753864223060devvklm7vk0')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}

FeatureEntitlementSection.displayName = 'FeatureEntitlementSection'
