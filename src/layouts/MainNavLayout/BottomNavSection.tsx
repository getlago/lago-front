import { Stack } from '@mui/material'
import { IconName } from 'lago-design-system'

import { Skeleton, VerticalMenu } from '~/components/designSystem'
import { envGlobalVar } from '~/core/apolloClient'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import {
  ONLY_DEV_DESIGN_SYSTEM_ROUTE,
  ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE,
  SETTINGS_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { usePermissions } from '~/hooks/usePermissions'
import { NavLayout } from '~/layouts/NavLayout'

const { appEnv } = envGlobalVar()

interface TabProps {
  title: string
  icon: IconName
  link?: string
  match?: string[]
  external?: boolean
  onAction?: () => void
  canBeClickedOnActive?: boolean
  hidden?: boolean
}

export const BOTTOM_NAV_SECTION_TEST_ID = 'bottom-nav-section'

interface BottomNavSectionProps {
  isLoading: boolean
  onItemClick: () => void
}

export const BottomNavSection = ({ isLoading, onItemClick }: BottomNavSectionProps) => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const { openPanel: openInspector } = useDeveloperTool()

  const tabs: TabProps[] = [
    {
      title: 'Design System',
      icon: 'rocket' as IconName,
      link: ONLY_DEV_DESIGN_SYSTEM_ROUTE,
      match: [ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, ONLY_DEV_DESIGN_SYSTEM_ROUTE],
      hidden: ![AppEnvEnum.qa, AppEnvEnum.development].includes(appEnv),
    },
    {
      title: translate('text_62728ff857d47b013204c726'),
      icon: 'settings',
      link: SETTINGS_ROUTE,
      hidden: !hasPermissions(['organizationView']),
    },
    {
      title: translate('text_6271200984178801ba8bdeac'),
      icon: 'terminal',
      onAction: openInspector,
      canBeClickedOnActive: true,
      hidden: !hasPermissions(['developersManage']),
    },
  ]

  return (
    <NavLayout.NavSection
      className="sticky bottom-0 bg-white p-4 animate-shadow-top"
      data-test={BOTTOM_NAV_SECTION_TEST_ID}
    >
      <VerticalMenu
        loading={isLoading}
        loadingComponent={
          <Stack flex={1} gap={4}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Stack
                key={`skeleton-lower-nav-${i}`}
                flex={1}
                gap={3}
                direction={'row'}
                paddingTop={3}
              >
                <Skeleton variant="circular" size="small" />
                <Skeleton variant="text" className="w-30" />
              </Stack>
            ))}
          </Stack>
        }
        onClick={onItemClick}
        tabs={tabs}
      />
    </NavLayout.NavSection>
  )
}
