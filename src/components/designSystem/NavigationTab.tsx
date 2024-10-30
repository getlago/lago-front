import { Tab, Tabs, Typography } from '@mui/material'
import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { tw } from '~/styles/utils'

import { Icon, IconName } from './Icon'
import { Skeleton } from './Skeleton'

type NavigationTabProps = {
  loading?: boolean
  name?: string
  className?: string
  tabs: {
    link: string
    title: string
    match?: string[]
    icon?: IconName
    disabled?: boolean
    hidden?: boolean
    component?: ReactNode
  }[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <>{children}</>}
    </div>
  )
}

const a11yProps = (index: number) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

export const NavigationTab = ({
  className,
  loading,
  name = 'Navigation tab',
  tabs,
}: NavigationTabProps) => {
  const navigate = useNavigate()
  const nonHiddenTabs = tabs.filter((t) => !t.hidden)

  // Default value is not 0 to prevent useEffect value udpate to flash first component
  const [value, setValue] = useState<number | null>(null)

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }

  // Make sure the active tab is selected when the page is loaded
  useEffect(() => {
    const activeTab = nonHiddenTabs.findIndex((tab) => {
      return tab.link === window.location.pathname
    })

    if (activeTab !== -1) {
      setValue(activeTab)
    } else {
      setValue(0)
    }

    // NOTE: window.location.pathname has to be watched for programatic navigation (without clicking on tabs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonHiddenTabs, window.location.pathname])

  // Prevent blink on first render
  if (value === null) return null

  return (
    <>
      <Tabs
        className={tw(
          'min-h-0 items-center overflow-visible shadow-b',
          {
            'min-h-13': nonHiddenTabs.length > 1,
          },
          className,
        )}
        variant="scrollable"
        role="navigation"
        scrollButtons={false}
        aria-label={name}
        onChange={handleChange}
        value={value}
      >
        {nonHiddenTabs.length >= 2
          ? nonHiddenTabs.map((tab, tabIndex) => {
              if (loading) {
                return (
                  <Skeleton
                    key={`loding-tab-${tabIndex}`}
                    className={tw('mr-0 h-3 w-20', {
                      'mr-4': tabIndex !== nonHiddenTabs.length - 1,
                    })}
                    variant="text"
                  />
                )
              }

              return (
                <Tab
                  key={`tab-${tabIndex}`}
                  disableFocusRipple
                  disableRipple
                  role="tab"
                  className="relative my-2 h-9 justify-between gap-1 overflow-visible rounded-xl p-2 text-grey-600 no-underline [min-height:unset] [min-width:unset] first:-ml-2 last:-mr-2 hover:bg-grey-100 hover:text-grey-700"
                  disabled={loading || tab.disabled}
                  icon={!!tab.icon ? <Icon name={tab.icon} /> : undefined}
                  iconPosition="start"
                  label={<Typography variant="captionHl">{tab.title}</Typography>}
                  value={tabIndex}
                  onClick={() => {
                    !!tab.link && navigate(tab.link)
                  }}
                  {...a11yProps(tabIndex)}
                />
              )
            })
          : null}
      </Tabs>
      {value !== null &&
        nonHiddenTabs.map((tab, index) => {
          return (
            <CustomTabPanel key={`custom-tab-panel-${index}`} value={value} index={index}>
              {tab.component}
            </CustomTabPanel>
          )
        })}
    </>
  )
}
