import { FC } from 'react'
import styled from 'styled-components'

import { Avatar, Icon, IconName, Typography, TypographyColor } from '~/components/designSystem'
import { TimezoneDate } from '~/components/TimezoneDate'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

interface ListItemProps {
  iconName: IconName
  labelColor: TypographyColor
  label: string
  date?: string
  timezone?: TimezoneEnum
  creditsColor: TypographyColor
  credits: string
  amount: string
  isBlurry?: boolean
  isPending?: boolean
}
export const ListItem: FC<ListItemProps> = ({
  iconName,
  labelColor,
  label,
  date,
  timezone,
  creditsColor,
  credits,
  amount,
  isBlurry,
  isPending,
  ...props
}) => {
  const { translate } = useInternationalization()

  return (
    <ListItemWrapper {...props}>
      <ListLeftWrapper>
        <ItemIcon size="big" variant="connector">
          <Icon name={isPending ? 'sync' : iconName} color="dark" />
        </ItemIcon>
        <ColumnWrapper>
          <Typography variant="bodyHl" color={isPending ? 'grey600' : labelColor}>
            {label}
          </Typography>
          {date && (
            <DateBlock variant="caption" color="grey600">
              <TimezoneDate
                mainTypographyProps={{ variant: 'caption', color: 'grey600' }}
                date={date}
                customerTimezone={timezone}
              />
              {isPending && (
                <span data-test="caption-pending">{` • ${translate(
                  'text_62da6db136909f52c2704c30',
                )}`}</span>
              )}
            </DateBlock>
          )}
        </ColumnWrapper>
      </ListLeftWrapper>
      <ListRightWrapper>
        <Typography
          variant="body"
          color={isPending ? 'grey600' : creditsColor}
          blur={isBlurry}
          data-test="credits"
        >
          {credits}
        </Typography>
        <Typography variant="caption" color="grey600" blur={isBlurry} data-test="amount">
          {amount}
        </Typography>
      </ListRightWrapper>
    </ListItemWrapper>
  )
}

const ListItemWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  box-shadow: ${theme.shadows[7]};
`

const ListLeftWrapper = styled.div`
  display: flex;
  align-items: center;

  &:last-child {
    align-items: flex-end;
  }
`

const ItemIcon = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const ListRightWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
`

const ColumnWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`

const DateBlock = styled(Typography)`
  display: flex;
  align-items: baseline;

  > * {
    margin-right: ${theme.spacing(1)};
  }
`
