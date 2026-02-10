import { generatePath } from 'react-router-dom'

import { NavigationTab } from '~/components/designSystem/NavigationTab'
import { Typography } from '~/components/designSystem/Typography'
import { SettingsPaddedContainer, SettingsPageHeaderContainer } from '~/components/layouts/Settings'
import { TEAM_AND_SECURITY_GROUP_ROUTE, TEAM_AND_SECURITY_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import MembersInvitationList from './MembersInvitationList'
import MembersList from './MembersList'

import {
  teamAndSecurityGroupOptions,
  teamAndSecurityTabOptions,
} from '../common/teamAndSecurityConst'

const Members = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_63208b630aaf8df6bbfb2657')}</Typography>
          <Typography>{translate('text_63208b630aaf8df6bbfb2659')}</Typography>
        </SettingsPageHeaderContainer>

        <div>
          <NavigationTab
            tabs={[
              {
                title: translate('text_63208b630aaf8df6bbfb2655'),
                match: [
                  generatePath(TEAM_AND_SECURITY_GROUP_ROUTE, {
                    group: teamAndSecurityGroupOptions.members,
                  }),
                  generatePath(TEAM_AND_SECURITY_TAB_ROUTE, {
                    group: teamAndSecurityGroupOptions.members,
                    tab: teamAndSecurityTabOptions.members,
                  }),
                ],
                link: generatePath(TEAM_AND_SECURITY_TAB_ROUTE, {
                  group: teamAndSecurityGroupOptions.members,
                  tab: teamAndSecurityTabOptions.members,
                }),

                component: <MembersList />,
              },
              {
                title: translate('text_1728310120853rutc5q05ax6'),
                link: generatePath(TEAM_AND_SECURITY_TAB_ROUTE, {
                  group: teamAndSecurityGroupOptions.members,
                  tab: teamAndSecurityTabOptions.invitations,
                }),
                component: <MembersInvitationList />,
              },
            ]}
          />
        </div>
      </SettingsPaddedContainer>
    </>
  )
}

export default Members
