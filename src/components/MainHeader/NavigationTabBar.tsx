import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import { Icon, IconName } from 'lago-design-system'
import { MouseEvent, useMemo } from 'react'
import { matchPath } from 'react-router-dom'

import { Link, useLocation } from '~/core/router'
import { isModifiedClick } from '~/core/utils/isModifiedClick'
import { spaceActivatesAnchorProps } from '~/core/utils/spaceActivatesAnchor'
import { tw } from '~/styles/utils'

import { isTabActive } from './utils'

const TAB_CLASSNAME =
  'relative my-2 h-9 justify-between gap-1 overflow-visible rounded-xl p-2 text-grey-600 no-underline [min-height:unset] [min-width:unset] first:-ml-2 last:-mr-2 hover:bg-grey-100 hover:text-grey-700 hover:no-underline focus:rounded-xl focus:ring-0'

export const NAVIGATION_TAB_BAR_TEST_ID = 'navigation-tab-bar'

export type NavigationTabBarItem = {
  link?: string
  title: string
  match?: string[]
  icon?: IconName
  disabled?: boolean
  hidden?: boolean
  dataTest?: string
}

type NavigationTabBarProps = {
  name?: string
  className?: string
  tabs: Array<NavigationTabBarItem>
}

const a11yProps = (index: number) => {
  return {
    id: `tab-bar-${index}`,
    'aria-controls': `tab-bar-panel-${index}`,
  }
}

/**
 * NavigationTabBar — renders only the tab buttons (no content panels).
 * Tab content is resolved by the page via useMainHeaderTabContent hook.
 * Tabs are URL-managed: clicking a tab navigates to its link.
 */
export const NavigationTabBar = ({
  className,
  name = 'Navigation tab',
  tabs,
}: NavigationTabBarProps) => {
  const { strippedPathname } = useLocation()
  const nonHiddenTabs = tabs.filter((t) => !t.hidden)

  // Active tab is derived state — computed from URL, no useState/useEffect needed.
  const activeTabIndex = useMemo(() => {
    const idx = nonHiddenTabs.findIndex((tab) => isTabActive(tab, strippedPathname))

    return idx === -1 ? 0 : idx
  }, [nonHiddenTabs, strippedPathname])

  const renderTab = (tab: NavigationTabBarItem, tabIndex: number) => {
    const sharedProps = {
      disableFocusRipple: true,
      disableRipple: true,
      role: 'tab',
      className: TAB_CLASSNAME,
      disabled: tab.disabled,
      icon: tab.icon ? <Icon name={tab.icon} /> : undefined,
      iconPosition: 'start' as const,
      label: <Typography variant="captionHl">{tab.title}</Typography>,
      value: tabIndex,
      ...a11yProps(tabIndex),
      'data-test': tab.dataTest || undefined,
    }

    // A disabled tab stays a button: MUI only forwards `disabled` to real
    // buttons, an anchor would still be followable.
    if (!!tab.link && !tab.disabled) {
      const link = tab.link

      return (
        <Tab
          key={tab.title}
          {...sharedProps}
          {...spaceActivatesAnchorProps}
          component={Link}
          to={link}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            if (!isModifiedClick(event) && !!matchPath(link, strippedPathname)) {
              event.preventDefault()
            }
          }}
        />
      )
    }

    return <Tab key={tab.title} {...sharedProps} component="button" />
  }

  return (
    <div className={tw('flex flex-row shadow-b', className)} data-test={NAVIGATION_TAB_BAR_TEST_ID}>
      <Tabs
        className="min-h-13 w-full flex-1 items-center overflow-visible"
        variant="scrollable"
        role="navigation"
        scrollButtons={false}
        aria-label={name}
        value={activeTabIndex}
      >
        {nonHiddenTabs.map((tab, tabIndex) => renderTab(tab, tabIndex))}
      </Tabs>
    </div>
  )
}
