import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { FC, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  FeatureEntitlementDrawer,
  FeatureEntitlementDrawerRef,
  FeatureEntitlementFormValues,
} from '~/components/plans/drawers/FeatureEntitlementDrawer'
import {
  FeatureEntitlementPrivilegeForPlanFragmentDoc,
  FeatureObjectEntitlementPrivilegeForPlanFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanFormInput } from './types'

export const ADD_FEATURE_ENTITLEMENT_TEST_ID = 'add-feature-entitlement'
export const FEATURE_ENTITLEMENT_SELECTOR_TEST_ID = 'feature-entitlement-selector'

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
  isEdition?: boolean
  onDrawerSave: (values: FeatureEntitlementFormValues) => void
}

export const FeatureEntitlementSection: FC<FeatureEntitlementSectionProps> = ({
  formikProps,
  onDrawerSave,
}) => {
  const { translate } = useInternationalization()
  const featureEntitlementDrawerRef = useRef<FeatureEntitlementDrawerRef>(null)

  return (
    <CenteredPage.PageSection>
      <CenteredPage.PageSectionTitle
        title={translate('text_63e26d8308d03687188221a6')}
        description={translate('text_17538642230602p03937fj0f')}
      />

      {!!formikProps.values.entitlements?.length && (
        <div className="flex w-full flex-col gap-4">
          {formikProps.values.entitlements.map((entitlement) => {
            const openFeatureEntitlementDrawer = () => {
              featureEntitlementDrawerRef.current?.openDrawer({
                featureId: entitlement.featureId || '',
                featureName: entitlement.featureName,
                featureCode: entitlement.featureCode,
                privileges: entitlement.privileges || [],
              })
            }

            return (
              <Selector
                key={`feature-entitlement-${entitlement.featureCode}`}
                icon="switch"
                title={entitlement.featureName || entitlement.featureCode}
                subtitle={entitlement.featureCode}
                data-test={FEATURE_ENTITLEMENT_SELECTOR_TEST_ID}
                endContent={
                  <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
                }
                hoverActions={
                  <SelectorActions
                    actions={[
                      {
                        icon: 'pen',
                        tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
                        onClick: () => openFeatureEntitlementDrawer(),
                      },
                      {
                        icon: 'trash',
                        tooltipCopy: translate('text_63aa085d28b8510cd46443ff'),
                        onClick: () => {
                          formikProps.setFieldValue(
                            'entitlements',
                            formikProps.values.entitlements.filter(
                              (e) => e.featureCode !== entitlement.featureCode,
                            ),
                          )
                        },
                      },
                    ]}
                  />
                }
                onClick={() => openFeatureEntitlementDrawer()}
              />
            )
          })}
        </div>
      )}

      <Button
        align="left"
        variant="inline"
        startIcon="plus"
        data-test={ADD_FEATURE_ENTITLEMENT_TEST_ID}
        onClick={() => featureEntitlementDrawerRef.current?.openDrawer()}
      >
        {translate('text_1753864223060devvklm7vk0')}
      </Button>

      <FeatureEntitlementDrawer
        ref={featureEntitlementDrawerRef}
        existingFeatureCodes={formikProps.values.entitlements?.map((e) => e.featureCode) || []}
        onSave={onDrawerSave}
      />
    </CenteredPage.PageSection>
  )
}

FeatureEntitlementSection.displayName = 'FeatureEntitlementSection'
