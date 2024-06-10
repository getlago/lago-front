import { Box, Tab, Tabs, Typography } from '@mui/material'
import { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { theme } from '~/styles'

import { Icon, IconName } from './Icon'
import { Skeleton } from './Skeleton'

type NavigationTabProps = {
  leftPadding?: boolean
  loading?: boolean
  name?: string
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
  leftPadding = false,
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (nonHiddenTabs.length < 2 || value === null) return null

  return (
    <Box sx={{ width: '100%' }}>
      <TabsWrapper>
        <LocalTabs
          variant="scrollable"
          role="navigation"
          scrollButtons={false}
          aria-label={name}
          onChange={handleChange}
          value={value}
          $leftPadding={leftPadding}
        >
          {nonHiddenTabs.map((tab, tabIndex) => {
            if (loading) {
              return (
                <Skeleton
                  key={`loding-tab-${tabIndex}`}
                  variant="text"
                  width={80}
                  height={12}
                  marginRight={tabIndex !== nonHiddenTabs.length - 1 ? '16px' : 0}
                />
              )
            }

            return (
              <Tab
                key={`tab-${tabIndex}`}
                disableFocusRipple
                disableRipple
                role="tab"
                className="navigation-tab-item"
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
          })}
        </LocalTabs>
      </TabsWrapper>
      {value !== null &&
        nonHiddenTabs.map((tab, index) => {
          return (
            <CustomTabPanel key={`custom-tab-panel-${index}`} value={value} index={index}>
              {tab.component}
            </CustomTabPanel>
          )
        })}
    </Box>
  )
}

const TabsWrapper = styled.div`
  box-shadow: ${theme.shadows[7]};
`

const LocalTabs = styled(Tabs)<{ $leftPadding: boolean }>`
  align-items: center;
  overflow: visible;
  min-height: ${theme.spacing(13)};

  ${({ $leftPadding }) =>
    !!$leftPadding &&
    css`
      padding-left: ${theme.spacing(12)};

      ${theme.breakpoints.down('md')} {
        padding-left: ${theme.spacing(4)};
      }
    `};

  .MuiTabs-indicator {
    /* We hide the default MUI selected tab indicator. It's manually handled by us bellow */
    display: none;
  }

  .MuiTabs-flexContainer {
    overflow: visible;
    gap: ${theme.spacing(2)};
  }

  .MuiTabs-scroller {
    overflow-y: auto;
    height: min-content;
    padding-left: 16px;
    padding-right: 16px;
    margin-left: -16px;
    margin-right: -16px;
  }

  .navigation-tab-item {
    height: ${theme.spacing(9)};
    position: relative;
    border-radius: 12px;
    overflow: visible;
    margin: ${theme.spacing(2)} 0;
    color: ${theme.palette.grey[600]};
    text-decoration: none;
    padding: ${theme.spacing(2)};
    box-sizing: border-box;
    gap: ${theme.spacing(1)};
    justify-content: space-between;
    min-width: unset;
    min-height: unset;

    &:first-child {
      margin-left: -${theme.spacing(2)};
    }
    &:last-child {
      margin-right: -${theme.spacing(2)};
    }

    &:hover {
      color: ${theme.palette.grey[700]};
      background-color: ${theme.palette.grey[100]};
    }

    &.Mui-focusVisible {
      outline: 4px solid ${theme.palette.primary[100]};
    }

    &.Mui-selected {
      color: ${theme.palette.primary.main};

      &::after {
        content: '';
        display: block;
        height: 2px;
        background-color: ${theme.palette.primary.main};
        width: calc(100% - 16px);
        position: absolute;
        bottom: -8px;
      }
    }

    &.Mui-disabled {
      color: ${theme.palette.grey[400]};
    }
  }
`
