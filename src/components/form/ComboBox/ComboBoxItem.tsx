import styled from 'styled-components'
import clsns from 'classnames'

import { theme } from '~/styles'
import { Icon, Typography } from '~/components/designSystem'

import { ComboBoxData } from './types'

import { Radio } from '../Radio'

export const ITEM_HEIGHT = 56

interface ComboBoxItemProps {
  id: string
  option: ComboBoxData
  selected?: boolean
  comboboxProps: React.HTMLAttributes<HTMLLIElement>
}

export const ComboBoxItem = ({
  id,
  option: { customValue, value, label, disabled },
  selected,
  comboboxProps,
}: ComboBoxItemProps) => {
  const { className, ...allProps } = comboboxProps

  return (
    // @ts-ignore
    <Item
      id={id}
      className={clsns(
        'combo-box-item',
        {
          'combo-box-item--selected': selected,
          'combo-box-item--disabled': disabled,
        },
        className
      )}
      key={value}
      {...allProps}
    >
      {customValue ? (
        <>
          <AddCustomValueIcon name={'plus'} />
          <Typography variant="body" noWrap>
            {label}
          </Typography>
        </>
      ) : (
        <Radio
          disabled={disabled}
          name={value}
          value={value}
          checked={!!selected}
          label={label || value}
        />
      )}
    </Item>
  )
}

const AddCustomValueIcon = styled(Icon)`
  margin-right: ${theme.spacing(4)};
`

const Item = styled.div`
  min-height: ${ITEM_HEIGHT}px;
  box-sizing: border-box;
  padding: 14px ${theme.spacing(4)};
  display: flex;
  align-items: center;
  border-radius: 12px;
  cursor: pointer;
  width: 100%;

  &.combo-box-item--disabled {
    cursor: auto;
  }
`
