import { generatePath } from 'react-router-dom'

import { NavigationTab, Typography } from '~/components/designSystem'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import { SettingsPaddedContainer, SettingsPageHeaderContainer } from '~/components/layouts/Settings'
import { MEMBERS_ROUTE, MEMBERS_TAB_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { membersTabOptions } from './common/membersConst'
import MembersInvitationList from './MembersInvitationList'
import MembersList from './MembersList'

const Members = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_63208b630aaf8df6bbfb2655')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

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
                  MEMBERS_ROUTE,
                  generatePath(MEMBERS_TAB_ROUTE, {
                    tab: membersTabOptions.members,
                  }),
                ],
                link: generatePath(MEMBERS_TAB_ROUTE, {
                  tab: membersTabOptions.members,
                }),

                component: <MembersList />,
              },
              {
                title: translate('text_1728310120853rutc5q05ax6'),
                link: generatePath(MEMBERS_TAB_ROUTE, {
                  tab: membersTabOptions.invitations,
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
