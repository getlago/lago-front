import { gql } from '@apollo/client'
import { ReactNode } from 'react'
import { generatePath } from 'react-router'

import { Button } from '~/components/designSystem/Button'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { NavigationTab } from '~/components/designSystem/NavigationTab'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsWithTabsPaddedContainer,
} from '~/components/layouts/Settings'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { GovernanceSettingsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { GOVERNANCE_SETTINGS_ROUTE, GOVERNANCE_SETTINGS_TAB_ROUTE } from '~/core/router'
import {
  UsageAttributionTypeRoleEnum,
  useGetGovernanceEntitiesRoleCountsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import EmptyImage from '~/public/images/maneki/empty.svg'
import ErrorImage from '~/public/images/maneki/error.svg'

import { useGovernanceEntityDrawer } from './drawers/governanceEntity/useGovernanceEntityDrawer'
import { GovernanceEntitiesTable } from './GovernanceEntitiesTable'

gql`
  query getGovernanceEntitiesRoleCounts {
    hierarchical: usageAttributionTypes(role: hierarchical, limit: 1) {
      metadata {
        totalCount
      }
    }
    flat: usageAttributionTypes(role: flat, limit: 1) {
      metadata {
        totalCount
      }
    }
  }
`

export const GOVERNANCE_SETTINGS_HIERARCHICAL_TAB_TEST_ID = 'governance-settings-hierarchical-tab'
export const GOVERNANCE_SETTINGS_FLAT_TAB_TEST_ID = 'governance-settings-flat-tab'
export const GOVERNANCE_SETTINGS_CREATE_BUTTON_TEST_ID = 'governance-settings-create-button'

const GovernanceSettings = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openDrawer } = useGovernanceEntityDrawer()

  const { data, error, loading } = useGetGovernanceEntitiesRoleCountsQuery({
    fetchPolicy: 'no-cache',
  })

  const hasHierarchical = (data?.hierarchical.metadata.totalCount ?? 0) > 0
  const hasFlat = (data?.flat.metadata.totalCount ?? 0) > 0
  const hasBothRoles = hasHierarchical && hasFlat

  const renderContent = (): ReactNode => {
    if (loading) return <SettingsListItemLoadingSkeleton count={2} />

    if (!hasHierarchical && !hasFlat) {
      return (
        <GenericPlaceholder
          title={translate('text_1790230812563plypvciyybb')}
          subtitle={translate('text_1790230812563ek3dytzhy3g')}
          image={<EmptyImage width="136" height="104" />}
        />
      )
    }

    if (!hasBothRoles) {
      return (
        <GovernanceEntitiesTable
          role={
            hasHierarchical
              ? UsageAttributionTypeRoleEnum.Hierarchical
              : UsageAttributionTypeRoleEnum.Flat
          }
        />
      )
    }

    return (
      <NavigationTab
        tabPanelClassName="min-h-0 flex-1 flex-col [&:not([hidden])]:flex"
        tabs={[
          {
            title: translate('text_1790230812563cibrddwcit4'),
            dataTest: GOVERNANCE_SETTINGS_HIERARCHICAL_TAB_TEST_ID,
            match: [
              GOVERNANCE_SETTINGS_ROUTE,
              generatePath(GOVERNANCE_SETTINGS_TAB_ROUTE, {
                tab: GovernanceSettingsTabsOptionsEnum.hierarchical,
              }),
            ],
            link: generatePath(GOVERNANCE_SETTINGS_TAB_ROUTE, {
              tab: GovernanceSettingsTabsOptionsEnum.hierarchical,
            }),
            component: <GovernanceEntitiesTable role={UsageAttributionTypeRoleEnum.Hierarchical} />,
          },
          {
            title: translate('text_17902308125635bb6aqr2wbe'),
            dataTest: GOVERNANCE_SETTINGS_FLAT_TAB_TEST_ID,
            link: generatePath(GOVERNANCE_SETTINGS_TAB_ROUTE, {
              tab: GovernanceSettingsTabsOptionsEnum.flat,
            }),
            component: <GovernanceEntitiesTable role={UsageAttributionTypeRoleEnum.Flat} />,
          },
        ]}
      />
    )
  }

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

  const Container = hasBothRoles ? SettingsWithTabsPaddedContainer : SettingsPaddedContainer

  return (
    <>
      <MainHeader.Configure
        entity={{
          viewName: translate('text_1790230812563a2wurigu4e9'),
          metadata: translate('text_17902308125636879mvzof83'),
        }}
      />

      <Container className="min-h-0 flex-1 pb-0">
        <SettingsListWrapper className="min-h-0 flex-1">
          <SettingsListItem className="min-h-0 flex-1">
            <SettingsListItemHeader
              label={translate('text_1790230812563tvbie14jfl9')}
              sublabel={translate('text_1790230812563hs9lunmy1sc')}
              action={
                hasPermissions(['usageAttributionTypesCreate']) ? (
                  <Button
                    variant="inline"
                    disabled={loading}
                    onClick={() => openDrawer()}
                    data-test={GOVERNANCE_SETTINGS_CREATE_BUTTON_TEST_ID}
                  >
                    {translate('text_645bb193927b375079d28ad2')}
                  </Button>
                ) : undefined
              }
            />

            {renderContent()}
          </SettingsListItem>
        </SettingsListWrapper>
      </Container>
    </>
  )
}

export default GovernanceSettings
