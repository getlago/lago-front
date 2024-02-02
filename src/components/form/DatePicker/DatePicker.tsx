import { gql } from '@apollo/client'
import { PopperProps as MuiPopperProps } from '@mui/material'
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DateTime, Settings } from 'luxon'
import { useEffect, useState } from 'react'
import styled, { css } from 'styled-components'

import { Button, Icon, Tooltip } from '~/components/designSystem'
import { TextInputProps } from '~/components/form'
import { getTimezoneConfig } from '~/core/timezone'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { theme } from '~/styles'

gql`
  fragment OrganizationForDatePicker on Organization {
    id
    timezone
  }
`

enum DATE_PICKER_ERROR_ENUM {
  invalid = 'invalid',
}
export interface DatePickerProps
  extends Omit<
    TextInputProps,
    'value' | 'onChange' | 'beforeChangeFormatter' | 'password' | 'onError'
  > {
  className?: string
  value?: string | DateTime | null
  placeholder?: string
  error?: string
  helperText?: string
  defaultZone?: string // Overrides the default timezone of the date picker
  disabled?: boolean
  disableFuture?: boolean
  disablePast?: boolean
  placement?: MuiPopperProps['placement']
  onError?: (err: keyof typeof DATE_PICKER_ERROR_ENUM | undefined) => void
  onChange: (value?: string | null) => void
}

export const DatePicker = ({
  className,
  value,
  error,
  defaultZone,
  disableFuture,
  disablePast,
  placeholder,
  disabled = false,
  placement = 'bottom-end',
  onError,
  onChange,
  helperText,
  ...props
}: DatePickerProps) => {
  const { organization } = useOrganizationInfos()

  const [localDate, setLocalDate] = useState<DateTime | null>(
    /**
     * Date will be passed to the parent as ISO
     * So we need to make sure to re-transform to DateTime for the component to read it
     */
    !!value ? (typeof value === 'string' ? DateTime.fromISO(value) : value) : null,
  )

  const isInvalid = !!localDate && !localDate.isValid
  const { translate } = useInternationalization()

  useEffect(() => {
    if (defaultZone) Settings.defaultZone = defaultZone

    return () => {
      // Reset timezone to default
      if (defaultZone) Settings.defaultZone = getTimezoneConfig(organization?.timezone).name
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setLocalDate(!!value ? (typeof value === 'string' ? DateTime.fromISO(value) : value) : null)
  }, [value])

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Container className={className}>
        <MuiDatePicker
          format="MM/dd/yyyy"
          disableFuture={disableFuture}
          disabled={disabled}
          disablePast={disablePast}
          value={localDate}
          onChange={(date) => {
            setLocalDate(!date ? date : (date as unknown as DateTime).toUTC())

            // To avoid breaking dates in the parent, we do not pass it unless it's valid
            const formattedDate = !date ? undefined : (date as unknown as DateTime)?.toUTC().toISO()

            if ((date as unknown as DateTime)?.isValid || !date) {
              onError && onError(undefined)
              onChange(formattedDate)
            } else {
              onError && onError(DATE_PICKER_ERROR_ENUM.invalid)
            }
          }}
          slots={{
            day: (dayProps) => (
              <DayButton
                $isToday={dayProps.today}
                variant={dayProps.selected ? 'primary' : 'quaternary'}
                disabled={disabled}
                onClick={() => dayProps.onDaySelect(dayProps.day)}
              >
                {dayProps.day.day}
              </DayButton>
            ),
            switchViewButton: () => (
              <Button variant="quaternary" disabled={disabled} icon="chevron-down" size="small" />
            ),
            leftArrowIcon: () => <Icon name="chevron-left" />,
            rightArrowIcon: () => <Icon name="chevron-right" />,
            clearButton: () => (
              <Button
                className="button-clear-date"
                disabled={disabled}
                icon="close-circle-filled"
                size="small"
                variant="quaternary"
              />
            ),
            openPickerButton: (pickerProps) => (
              <Tooltip
                className="open-picker-tooltip"
                disableHoverListener={disabled}
                placement="top-end"
                title={translate('text_62cd78ea9bff25e3391b2437')}
              >
                <Button
                  disabled={disabled}
                  icon="calendar"
                  onClick={pickerProps.onClick}
                  size="small"
                  variant="quaternary"
                />
              </Tooltip>
            ),
          }}
          slotProps={{
            popper: {
              placement,
              modifiers: [
                {
                  name: 'flip',
                  enabled: placement === 'auto',
                },
                {
                  name: 'offset',
                  enabled: true,
                  options: {
                    // @ts-ignore
                    offset: ({ reference }) => {
                      // Re-calculate picker position if placed on the left.
                      // Removes the input width and twice the picker icon "box" (24*2)
                      if (placement.includes('left')) {
                        return [0, -(reference.width - 48)]
                      }

                      return [0, 8]
                    },
                  },
                },
              ],
            },
            textField: {
              placeholder: placeholder || translate('text_62cd78ea9bff25e3391b243d'),
              error: !!error || isInvalid,
              helperText: !!error || isInvalid ? error : helperText,
            },
            openPickerButton: {
              style: {
                padding: 0,
                marginRight: 0,
                height: 'fit-content',
              },
            },
            desktopPaper: {
              style: {
                border: `1px solid ${theme.palette.grey[200]}`,
                boxShadow: '0px 6px 8px 0px #19212E1F',
                width: '352px',
                padding: `${theme.spacing(6)} 0`,
                boxSizing: 'border-box',
              },
            },
          }}
        />
      </Container>
    </LocalizationProvider>
  )
}

const Container = styled.div`
  position: relative;

  .open-picker-tooltip {
    font-size: 0;
  }

  .MuiDateCalendar-root {
    width: 100%;

    // prettier-ignore
    div[role=row] {
      gap: 4px;
      margin: 2px;

      &:first-child {
        margin-top: 6px; // To allow the display of the focus
      }

      &:last-child {
        margin-bottom: 6px; // To allow the display of the focus
      }
    }

    > div:first-child {
      margin-bottom: ${theme.spacing(4)};
      padding-left: 0;
      min-height: 40px;
      padding-right: 6px;
      margin-top: 0;

      > div {
        overflow: visible;

        &:first-child {
          margin: 0 auto 0 6px;
        }

        > div {
          font-size: 16px;
          line-height: 28px;
          font-weight: 400;
          color: ${theme.palette.text.secondary};
          margin-right: ${theme.spacing(1)};

          > div {
            margin-right: 0;
          }
        }
      }
    }
  }

  .MuiDateCalendar-viewTransitionContainer {
    > div > div {
      gap: 4px;
    }

    .MuiTypography-caption {
      width: 40px;
      font-size: 16px;
      line-height: 28px;
      font-weight: 400;
      color: ${theme.palette.text.secondary};
      margin: 0;
    }
  }

  .MuiDateCalendar-viewTransitionContainer {
    min-height: 304px;

    > *:first-child {
      overflow: hidden;
    }
  }

  .MuiDateCalendar-root,
  .PrivatePickersSlideTransition-root,
  .MuiPaper-root > div > div:first-child {
    overflow-x: visible;
  }

  .MuiPaper-root > *:first-child {
    margin: 0 18px;

    > *:first-child {
      width: inherit;
      margin: 0;
    }
  }

  .MuiYearCalendar-root {
    margin: 0;
  }

  .PrivatePickersYear-root {
    flex-basis: unset;
  }

  .PrivatePickersYear-yearButton {
    margin: 0;
    height: 40px;
    border-radius: 12px;
    font-size: 16px;
    line-height: 28px;
    font-weight: 400;
    padding: 0;
    color: ${theme.palette.grey[600]};

    &:hover {
      background-color: ${theme.palette.grey[200]};
    }

    &.Mui-selected {
      background-color: ${theme.palette.primary[600]} !important;
      color: ${theme.palette.background.default};

      &.Mui-focusVisible {
        background-color: ${theme.palette.primary[600]};
      }
    }

    &:focus {
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
      outline: 'none';
      background-color: ${theme.palette.background.default};
      z-index: 1;
    }

    &.Mui-focusVisible {
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
      outline: 'none';
      background-color: ${theme.palette.background.default};
      z-index: 1;
    }
  }

  .MuiPickersDay-root {
    border-radius: 12px;
    color: ${theme.palette.grey[600]};
    height: 40px;
    width: 40px;
    margin: 0;
    font-size: 16px;
    line-height: 28px;
    font-weight: 400;

    &:hover {
      background-color: ${theme.palette.grey[200]};
    }

    &.MuiPickersDay-today {
      border: 1px solid ${theme.palette.grey[500]};
      background-color: ${theme.palette.background.default};
    }

    &.Mui-selected {
      background-color: ${theme.palette.primary[600]} !important;
      color: ${theme.palette.background.default};

      &.Mui-focusVisible {
        background-color: ${theme.palette.primary[600]};
      }
    }

    &.Mui-focusVisible,
    &:focus {
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
      outline: 'none';
      background-color: ${theme.palette.background.default};
      z-index: 1;
    }

    &.Mui-disabled {
      color: ${theme.palette.grey[400]} !important;
    }
  }

  .button-clear-date {
    opacity: 0;
    animation: fadeIn 0.2s ease-in-out forwards;
  }

  .MuiInputBase-root:hover {
    .button-clear-date {
      opacity: 1;
    }
  }
`

const DayButton = styled(Button)<{ $isToday?: boolean }>`
  height: 40px;
  width: 40px;

  ${({ $isToday }) =>
    $isToday &&
    css`
      border: 1px solid ${theme.palette.grey[500]};
    `}
`

// TODO
// - Input don't take style from parent
// - Hide other months days
// - remove big gap at the bottom of the picker / check size
