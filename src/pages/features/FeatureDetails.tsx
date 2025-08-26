import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button, NavigationTab, Popper, Skeleton, Typography } from '~/components/designSystem'
import {
  DeleteFeatureDialog,
  DeleteFeatureDialogRef,
} from '~/components/features/DeleteFeatureDialog'
import { FeatureDetailsActivityLogs } from '~/components/features/FeatureDetailsActivityLogs'
import { FeatureDetailsOverview } from '~/components/features/FeatureDetailsOverview'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { FeatureDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { FEATURE_DETAILS_ROUTE, FEATURES_ROUTE, UPDATE_FEATURE_ROUTE } from '~/core/router'
import {
  FeatureForDeleteFeatureDialogFragmentDoc,
  useGetFeatureForDetailsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

gql`
  query getFeatureForDetails($feature: ID!) {
    feature(id: $feature) {
      id
      name
      code
      ...FeatureForDeleteFeatureDialog
    }
  }

  ${FeatureForDeleteFeatureDialogFragmentDoc}
`

const FeatureDetails = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { featureId } = useParams()

  const deleteDialogRef = useRef<DeleteFeatureDialogRef>(null)

  const { data: featureResult, loading: isFeatureLoading } = useGetFeatureForDetailsQuery({
    variables: {
      feature: featureId as string,
    },
  })

  const feature = featureResult?.feature

  const shouldShowActions = hasPermissions(['featuresCreate', 'featuresUpdate', 'featuresDelete'])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="overflow-hidden">
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              navigate(FEATURES_ROUTE)
            }}
          />
          {isFeatureLoading && !feature ? (
            <Skeleton variant="text" className="w-50" />
          ) : (
            <Typography
              variant="bodyHl"
              color="textSecondary"
              noWrap
              data-test="feature-details-name"
            >
              {feature?.name || feature?.code}
            </Typography>
          )}
        </PageHeader.Group>

        {shouldShowActions && !!feature && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down" data-test="feature-details-actions">
                {translate('text_626162c62f790600f850b6fe')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  data-test="feature-details-edit"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigate(generatePath(UPDATE_FEATURE_ROUTE, { featureId: feature.id }))
                    closePopper()
                  }}
                >
                  {translate('text_1756217474408noiuzsd087w')}
                </Button>
                {!!feature && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleteDialogRef.current?.openDialog({
                        feature,
                        callback: () => {
                          navigate(FEATURES_ROUTE)
                        },
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_1752693359315sd2ms0qxvi3')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader.Wrapper>

      <DetailsPage.Header
        isLoading={isFeatureLoading}
        icon="switch"
        title={feature?.name || '-'}
        description={feature?.code || ''}
      />

      <NavigationTab
        className="px-4 md:px-12"
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: generatePath(FEATURE_DETAILS_ROUTE, {
              featureId: featureId as string,
              tab: FeatureDetailsTabsOptionsEnum.overview,
            }),

            component: (
              <DetailsPage.Container>
                <FeatureDetailsOverview />
              </DetailsPage.Container>
            ),
          },

          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: generatePath(FEATURE_DETAILS_ROUTE, {
              featureId: featureId as string,
              tab: FeatureDetailsTabsOptionsEnum.activityLogs,
            }),
            component: <FeatureDetailsActivityLogs featureId={featureId as string} />,
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      <DeleteFeatureDialog ref={deleteDialogRef} />
    </>
  )
}

export default FeatureDetails
