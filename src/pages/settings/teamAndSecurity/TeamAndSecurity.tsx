import { generatePath } from 'react-router-dom'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { Typography } from '~/components/designSystem/Typography'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import {
  TEAM_AND_SECURITY_GROUP_ROUTE,
  TEAM_AND_SECURITY_ROOT_ROUTE,
  TEAM_AND_SECURITY_TAB_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import {
  teamAndSecurityGroupOptions,
  teamAndSecurityTabOptions,
} from './common/teamAndSecurityConst'
import Members from './members/Members'
import RolesList from './roles/rolesList/RolesList'

const TeamAndSecurity = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_177073440645951fhlh2ofdc')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <NavigationTab
        className="px-4 md:px-12"
        tabs={[
          {
            title: translate('text_63208b630aaf8df6bbfb2655'),
            match: [
              TEAM_AND_SECURITY_ROOT_ROUTE,
              generatePath(TEAM_AND_SECURITY_GROUP_ROUTE, {
                group: teamAndSecurityGroupOptions.members,
              }),
              generatePath(TEAM_AND_SECURITY_TAB_ROUTE, {
                group: teamAndSecurityGroupOptions.members,
                tab: teamAndSecurityTabOptions.members,
              }),
              generatePath(TEAM_AND_SECURITY_TAB_ROUTE, {
                group: teamAndSecurityGroupOptions.members,
                tab: teamAndSecurityTabOptions.invitations,
              }),
            ],
            link: generatePath(TEAM_AND_SECURITY_GROUP_ROUTE, {
              group: teamAndSecurityGroupOptions.members,
            }),
            component: <Members />,
          },
          {
            title: translate('text_1765448879791epmkg4xijkn'),
            match: [
              generatePath(TEAM_AND_SECURITY_GROUP_ROUTE, {
                group: teamAndSecurityGroupOptions.roles,
              }),
            ],
            link: generatePath(TEAM_AND_SECURITY_GROUP_ROUTE, {
              group: teamAndSecurityGroupOptions.roles,
            }),
            component: <RolesList />,
          },
        ]}
      />
    </>
  )
}

export default TeamAndSecurity
