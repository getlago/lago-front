import clsns from 'classnames'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Icon, Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { MultipleComboBoxData } from './types'

import { Radio } from '../Radio'

export const ITEM_HEIGHT = 56

interface MultipleComboBoxItemProps {
  id: string
  option: MultipleComboBoxData
  selected?: boolean
  multipleComboBoxProps: React.HTMLAttributes<HTMLLIElement>
  virtualized?: boolean
  addValueRedirectionUrl?: string
}

export const MultipleComboBoxItem = ({
  id,
  option: { customValue, value, label, disabled, labelNode },
  selected,
  virtualized,
  multipleComboBoxProps,
  addValueRedirectionUrl,
}: MultipleComboBoxItemProps) => {
  const { className, ...allProps } = multipleComboBoxProps

  return (
    <ItemWrapper data-test={`multipleComboBox-item-${label}`}>
      <ConditionalWrapper
        condition={!!addValueRedirectionUrl}
        invalidWrapper={(children) => <>{children}</>}
        validWrapper={(children) => <Link to={addValueRedirectionUrl as string}>{children}</Link>}
      >
        {/* @ts-ignore */}
        <Item
          id={id}
          $virtualized={virtualized}
          className={clsns(
            {
              'combo-box-item--disabled': disabled,
            },
            className,
          )}
          data-test={value}
          key={value}
          {...allProps}
        >
          {customValue ? (
            <>
              <AddCustomValueIcon color="dark" name="plus" />
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
      </ConditionalWrapper>
    </ItemWrapper>
  )
}

const ItemWrapper = styled.div`
  a {
    &:focus,
    &:active,
    &:hover {
      outline: none;
      text-decoration: none;
    }
  }
`

const AddCustomValueIcon = styled(Icon)`
  margin-right: ${theme.spacing(4)};
`

export const Item = styled.div<{ $virtualized?: boolean }>`
  && {
    min-height: ${ITEM_HEIGHT}px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    border-radius: 12px;
    cursor: pointer;
    margin: 0 ${theme.spacing(2)};
    width: ${({ $virtualized }) => ($virtualized ? 'initial' : 'inherit')};
    box-sizing: border-box;
  }

  &.combo-box-item--disabled {
    cursor: auto;
  }
`
