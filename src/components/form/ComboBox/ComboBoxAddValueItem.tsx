import styled from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'
import { Icon, Typography } from '~/components/designSystem'

export const ITEM_HEIGHT = 56

interface ComboBoxAddValueItemProps {
  id: string
  value: string
  label?: string
  disabled?: boolean
  selected?: boolean
  selectedByNav?: boolean
  onClick: (value: string) => void
  onMouseEnter: (event: React.MouseEvent<HTMLDivElement>) => void
}

export const ComboBoxAddValueItem = ({
  id,
  value,
  label,
  disabled,
  selected,
  selectedByNav,
  onClick,
  onMouseEnter,
}: ComboBoxAddValueItemProps) => {
  return (
    <Item
      id={id}
      className={clsns('combo-box-item', {
        'combo-box-item--selected': selected,
        'combo-box-item--innerSelected': selectedByNav,
        'combo-box-item--disabled': disabled,
      })}
      onMouseEnter={onMouseEnter}
      key={value}
      onClick={!disabled ? () => onClick(value) : undefined}
    >
      <AddCustomValueIcon name={'plus'} />
      <Typography variant="body" noWrap>
        {label}
      </Typography>
    </Item>
  )
}

const AddCustomValueIcon = styled(Icon)`
  margin-right: ${theme.spacing(4)};
`

const Item = styled.div`
  min-height: ${ITEM_HEIGHT}px;
  box-sizing: border-box;
  padding: ${theme.spacing(4)};
  display: flex;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;

  &.combo-box-item--selected {
    background-color: ${theme.palette.primary[100]};
  }
  &.combo-box-item--disabled {
    cursor: auto;
  }

  &.combo-box-item--innerSelected {
    background-color: ${theme.palette.grey[100]};

    &.combo-box-item--selected {
      background-color: ${theme.palette.primary[200]};
    }
  }
`
