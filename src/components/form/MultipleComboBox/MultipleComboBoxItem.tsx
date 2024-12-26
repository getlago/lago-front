import { cx } from 'class-variance-authority'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import { ConditionalWrapper } from '~/components/ConditionalWrapper'
import { Icon, Typography } from '~/components/designSystem'
import { ITEM_HEIGHT, theme } from '~/styles'

import { MultipleComboBoxData } from './types'

import { Checkbox } from '../Checkbox'
import { ComboboxItem } from '../ComboBox'

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
  option: { customValue, value, label, description, disabled, labelNode },
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
        <ComboboxItem
          id={id}
          virtualized={virtualized}
          className={cx(
            {
              'cursor-auto': disabled,
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
            <Checkbox
              disabled={disabled}
              name={value}
              value={!!selected}
              sublabel={description}
              label={labelNode || label || value}
            />
          )}
        </ComboboxItem>
      </ConditionalWrapper>
    </ItemWrapper>
  )
}

const ItemWrapper = styled.div`
  display: flex;
  align-items: center;
  min-height: ${ITEM_HEIGHT}px;

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
