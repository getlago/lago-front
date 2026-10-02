import { ReactNode } from 'react'

import { Avatar } from '~/components/designSystem/Avatar'
import { Chip } from '~/components/designSystem/Chip'

type ConnectionCodeChipProps = {
  code: string
  avatar?: ReactNode
  'data-test'?: string
}

export const ConnectionCodeChip = ({
  code,
  avatar,
  'data-test': dataTest,
}: ConnectionCodeChipProps): JSX.Element => (
  <Chip
    data-test={dataTest}
    label={
      <span className="flex items-center gap-2">
        {!!avatar && (
          <Avatar size="small" variant="connector-full">
            {avatar}
          </Avatar>
        )}
        {code}
      </span>
    }
  />
)
