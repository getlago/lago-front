import { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import styled from 'styled-components'

import { ComboBox } from '~/components/form/ComboBox'
import { Typography } from '~/components/designSystem'
import { theme } from '~/styles'

import { decorators } from '../../.storybook/preview'

const ComboboxHeader = styled.div`
  display: flex;
  min-width: 0;

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
                🚀 •&#32;
              </Typography>
              <Typography component="span" variant="caption" noWrap>
                Frontend
              </Typography>
            </ComboboxHeader>
          ),
          Backend: (
            <ComboboxHeader>
              <Typography variant="captionHl" color="textSecondary">
                🔥 •&#32;
              </Typography>
              <Typography component="span" variant="caption" noWrap>
                Backend
              </Typography>
            </ComboboxHeader>
          ),
          Designer: (
            <ComboboxHeader>
              <Typography variant="captionHl" color="textSecondary">
                🎨 •&#32;
              </Typography>
              <Typography component="span" variant="caption" noWrap>
                Designer - Lorem ipsum dolor sit amet, consectetur adipisicing elit. Cumque
                temporibus ea ducimus non repellendus!
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
  data: [
    { value: 'Alex' },
    { value: 'Morguy' },
    { value: 'Mike' },
    { value: 'Jerem' },
    { value: 'Lovro' },
    { value: 'Romain' },
    { value: 'Vincent' },
  ],
}

export const Grouped = Template.bind({})
Grouped.args = {
  loading: false,
  disabled: false,
  allowAddValue: false,
  sortValues: true,
  placeholder: 'My values are grouped',
  loadingText: 'You need to remove the data to see me',
  emptyText: 'No values',
  disableClearable: false,
  virtualized: true,
  data: [
    { value: 'Alex', group: 'Frontend' },
    { value: 'Morguy', group: 'Frontend' },
    {
      value: 'Mike',
      group: 'Designer',
    },
    { value: 'Jerem', group: 'Backend' },
    { value: 'Lovro', group: 'Backend' },
    { value: 'Romain', group: 'Backend' },
    { value: 'Vincent', group: 'Backend' },
  ],
}
export const GroupedWithAdornment = Template.bind({})
GroupedWithAdornment.args = {
  loading: false,
  disabled: false,
  allowAddValue: false,
  sortValues: true,
  placeholder: 'My values are grouped',
  loadingText: 'You need to remove the data to see me',
  emptyText: 'No values',
  disableClearable: false,
  virtualized: true,
  data: [
    { value: 'Alex', group: 'Frontend' },
    { value: 'Morguy', group: 'Frontend' },
    {
      value: 'Mike',
      group: 'Designer',
    },
    { value: 'Jerem', group: 'Backend' },
    { value: 'Lovro', group: 'Backend' },
    { value: 'Romain', group: 'Backend' },
    { value: 'Vincent', group: 'Backend' },
  ],
  renderGroupInputStartAdornment: {
    Frontend: 'Frontend',
    Designer: 'Designer',
    Backend: 'Backend',
  },
}
