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
  virtualized?: boolean
}

export const ComboBoxItem = ({
  id,
  option: { customValue, value, label, disabled, labelNode },
  selected,
  virtualized,
  comboboxProps,
}: ComboBoxItemProps) => {
  const { className, ...allProps } = comboboxProps

  return (
    // @ts-ignore
    <Item
      id={id}
      $virtualized={virtualized}
      className={clsns(
        {
          'combo-box-item--disabled': disabled,
        },
        className
      )}
      data-test={value}
      key={value}
      {...allProps}
    >
      {customValue ? (
        <>
          <AddCustomValueIcon name="plus" />
          <Typography variant="body" noWrap>
            {labelNode ?? label}
          </Typography>
        </>
      ) : (
        <Radio
          disabled={disabled}
          name={value}
          value={value}
          checked={!!selected}
          label={labelNode || label || value}
        />
      )}
    </Item>
  )
}

const AddCustomValueIcon = styled(Icon)`
  margin-right: ${theme.spacing(4)};
`

export const Item = styled.div<{ $virtualized?: boolean }>`
  && {
    padding: 0 ${theme.spacing(4)};
    min-height: ${ITEM_HEIGHT}px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    border-radius: 12px;
    cursor: pointer;
    margin-left: ${theme.spacing(2)};
    margin-right: ${theme.spacing(2)};
    width: ${({ $virtualized }) => ($virtualized ? 'initial' : 'inherit')};
    box-sizing: border-box;
  }

  &.combo-box-item--disabled {
    cursor: auto;
  }
`
