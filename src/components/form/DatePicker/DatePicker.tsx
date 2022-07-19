import { useState, useEffect } from 'react'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker'
import { PopperProps as MuiPopperProps } from '@mui/material'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import _omit from 'lodash/omit'

import { TextInput, TextInputProps } from '~/components/form'
import { theme } from '~/styles'
import { Button, Tooltip } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export interface DatePickerProps
  extends Omit<TextInputProps, 'value' | 'onChange' | 'beforeChangeFormatter' | 'password'> {
  className?: string
  value?: string | null
  placeholder?: string
  error?: string
  helperText?: string
  disableFuture?: boolean
  disablePast?: boolean
  placement?: MuiPopperProps['placement']
  onChange: (value?: string | null) => void
}

type OveridableComponentProps = {
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined
}

export const DatePicker = ({
  className,
  value,
  error,
  disableFuture,
  disablePast,
  placeholder,
  disabled,
  placement = 'bottom-end',
  onChange,
  ...props
}: DatePickerProps) => {
  const [localDate, setLocalDate] = useState<DateTime | null>(
    /**
     * Date will be passed to the parent as ISO
     * So we need to make sure to re-transform to DateTime for the component to read it
     */
    !!value ? DateTime.fromISO(value) : null
  )
  const isInvalid = !!localDate && !localDate.isValid
  const { translate } = useInternationalization()

  useEffect(() => {
    setLocalDate(!!value ? DateTime.fromISO(value) : null)
  }, [value])

  return (
    <LocalizationProvider dateAdapter={AdapterLuxon}>
      <Container className={className}>
        <MuiDatePicker
          inputFormat="MM/dd/yyyy"
          disableFuture={disableFuture}
          disabled={disabled}
          disablePast={disablePast}
          value={localDate}
          PopperProps={{
            disablePortal: true,
            placement,
            style: { paddingBottom: theme.spacing(4) },
            modifiers: [
              {
                name: 'flip',
                enabled: false,
              },
              {
                name: 'offset',
                enabled: true,
                options: {
                  offset: [0, 8],
                },
              },
            ],
          }}
          PaperProps={{
            style: {
              border: `1px solid ${theme.palette.grey[200]}`,
              boxShadow: '0px 6px 8px 0px #19212E1F',
              width: '352px',
              padding: `${theme.spacing(6)} 0 ${theme.spacing(6)} 0`,
              boxSizing: 'border-box',
              height: '408px',
            },
          }}
          onChange={(date) => {
            setLocalDate(date as unknown as DateTime)

            // To avoid breaking dates in the parent, we do not pass it unless it's valid
            const formattedDate = (date as unknown as DateTime)?.toISO()

            if ((date as unknown as DateTime)?.isValid || !date) {
              onChange(formattedDate)
            }
          }}
          renderInput={({ inputRef, inputProps, InputProps }) => {
            return (
              <TextInput
                {...props}
                error={isInvalid ? translate('text_62cd78ea9bff25e3391b2459') : error}
                ref={inputRef}
                placeholder={placeholder || translate('text_62cd78ea9bff25e3391b243d')}
                inputProps={_omit(inputProps, 'placeholder', 'error')}
                disabled={disabled}
                InputProps={{
                  endAdornment: (
                    <Tooltip
                      title={translate('text_62cd78ea9bff25e3391b2437')}
                      placement="top-end"
                      disableHoverListener={disabled}
                    >
                      <CalendarButton
                        disabled={disabled}
                        icon="calendar"
                        size="small"
                        variant="quaternary"
                        // @ts-ignore
                        onClick={InputProps?.endAdornment?.props?.children?.props?.onClick}
                      />
                    </Tooltip>
                  ),
                }}
              />
            )
          }}
          components={{
            SwitchViewButton: ({ onClick }: OveridableComponentProps) => {
              return (
                <Button
                  variant="quaternary"
                  size="small"
                  onClick={onClick}
                  disabled={disabled}
                  icon="chevron-down"
                />
              )
            },
            LeftArrowButton: ({ onClick }: OveridableComponentProps) => {
              return (
                <Button
                  variant="quaternary"
                  onClick={onClick}
                  disabled={disabled}
                  icon="chevron-left"
                />
              )
            },
            RightArrowButton: ({ onClick }: OveridableComponentProps) => {
              return (
                <Button
                  variant="quaternary"
                  onClick={onClick}
                  disabled={disabled}
                  icon="chevron-right"
                />
              )
            },
          }}
        />
      </Container>
    </LocalizationProvider>
  )
}

const Container = styled.div`
  position: relative;

  .MuiCalendarPicker-root {
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

  .MuiCalendarPicker-viewTransitionContainer {
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

  .MuiCalendarPicker-viewTransitionContainer {
    min-height: 304px;

    > *:first-child {
      overflow: hidden;
    }
  }

  .MuiCalendarPicker-root,
  .PrivatePickersSlideTransition-root,
  .MuiPaper-root > div > div:first-child {
    overflow-x: visible;
  }

  .MuiPaper-root > *:first-child {
    margin: 0 18px; // TODO

    > *:first-child {
      width: inherit;
      margin: 0;
    }
  }

  .MuiYearPicker-root {
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
  }
`

const CalendarButton = styled(Button)`
  && {
    margin-right: ${theme.spacing(4)};
  }
`
