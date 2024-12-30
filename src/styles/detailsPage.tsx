import { FC, PropsWithChildren, ReactNode } from 'react'

import { Typography, TypographyProps } from '~/components/designSystem'

interface DetailsInfoItemProps {
  label: string
  value: ReactNode | string
}
export const DetailsInfoItem = ({ label, value }: DetailsInfoItemProps) => {
  return (
    <div>
      <Typography variant="caption">{label}</Typography>
      <Typography variant="body" color="grey700">
        {value}
      </Typography>
    </div>
  )
}

export const DetailsSectionTitle: FC<PropsWithChildren<TypographyProps>> = ({
  children,
  ...props
}) => (
  <Typography className="flex h-18 items-center" {...props}>
    {children}
  </Typography>
)

export const DetailsInfoGrid = ({ grid }: { grid: Array<DetailsInfoItemProps | false> }) => {
  return (
    <div className="grid grid-cols-[repeat(2,minmax(auto,1fr))] gap-[16px_32px]">
      {grid.map((item, index) => {
        if (item) {
          return (
            <DetailsInfoItem
              key={`details-info-grid-${item.label}-${index}`}
              label={item.label}
              value={item.value}
            />
          )
        }
      })}
    </div>
  )
}
