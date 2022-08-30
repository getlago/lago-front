import { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import styled from 'styled-components'

import { ComboBox } from '~/components/form/ComboBox'
import { Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { decorators } from '../../.storybook/preview'

const ComboboxHeader = styled.div`
  display: flex;

  > * {
    white-space: nowrap;

    &:first-child {
      margin-right: ${theme.spacing(1)};
    }
    &:last-child {
      min-width: 0;
    }
  }
`

export default {
  title: 'Form/ComboBox',
  component: ComboBox,
  decorators,
  argTypes: {
    label: {
      options: ['String', 'ReactNode'],
      defaultValue: 'ReactNode',
      mapping: {
        String: "Who's the best designer in town ?",
        ReactNode: (
          <Typography color="textSecondary">
            Who&apos;s the{' '}
            <Typography component="span" variant="bodyHl">
              best
            </Typography>{' '}
            designer in town ?
          </Typography>
        ),
      },
    },
    data: {
      options: ['Simple', 'Grouped'],
      defaultValue: 'Simple',
      mapping: {
        Simple: [
          { value: 'Alex' },
          { value: 'Morguy' },
          { value: 'Mike' },
          { value: 'Jerem' },
          { value: 'Lovro' },
          { value: 'Romain' },
          { value: 'Vincent' },
        ],
        Grouped: [
          { value: 'Alex', group: 'Frontend' },
          { value: 'Morguy', group: 'Frontend' },
          { value: 'Mike', group: 'Designer' },
          { value: 'Jerem', group: 'Backend' },
          { value: 'Lovro', group: 'Backend' },
          { value: 'Romain', group: 'Backend' },
          { value: 'Vincent', group: 'Backend' },
        ],
      },
    },
    error: { type: 'string' },
    value: { table: { disable: true } },
    onChange: { table: { disable: true } },
    PopperProps: { table: { disable: true } },
    name: { table: { disable: true } },
    renderGroupHeader: {
      options: ['Null', 'WithCustomHeader'],
      mapping: {
        Null: undefined,
        WithCustomHeader: {
          Frontend: (
            <ComboboxHeader>
              <Typography variant="captionHl" color="textSecondary">
                The good •&#32;
              </Typography>
              <Typography component="span" variant="caption" noWrap>
                Frontend
              </Typography>
            </ComboboxHeader>
          ),
          Backend: (
            <ComboboxHeader>
              <Typography variant="captionHl" color="textSecondary">
                The bad •&#32;
              </Typography>
              <Typography component="span" variant="caption" noWrap>
                Backend
              </Typography>
            </ComboboxHeader>
          ),
          Designer: (
            <ComboboxHeader>
              <Typography variant="captionHl" color="textSecondary">
                The ugly •&#32;
              </Typography>
              <Typography component="span" variant="caption" noWrap>
                Designer
              </Typography>
            </ComboboxHeader>
          ),
        },
      },
    },
  },
} as ComponentMeta<typeof ComboBox>

const Template: ComponentStory<typeof ComboBox> = (props) => {
  const [value, setValue] = useState<string | undefined>()

  return <ComboBox {...props} value={value} onChange={(v) => setValue(v)} />
}

export const Default = Template.bind({})
Default.args = {
  loading: false,
  disabled: false,
  allowAddValue: false,
  sortValues: true,
  infoText: "Beware, we're watching you",
  placeholder: 'TELL ME !',
  loadingText: 'You need to remove the data to see me',
  emptyText: 'No values',
  disableClearable: false,
  virtualized: true,
}
