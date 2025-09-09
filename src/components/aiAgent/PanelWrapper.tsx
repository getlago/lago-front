import { Button, Typography } from 'lago-design-system'

import { useInternationalization } from '~/hooks/core/useInternationalization'

export const AIWrapper = ({
  children,
  title,
  isBeta,
  onBackButton,
}: {
  children: React.ReactNode
  title: string
  isBeta: boolean
  onBackButton?: () => void
}) => {
  const { translate } = useInternationalization()

  return (
    <div>
      <div className="flex flex-row justify-between gap-4 px-6 py-5 shadow-b">
        <div className="flex flex-1 items-center gap-2 truncate">
          {!!onBackButton && (
            <Button size="small" variant="quaternary" icon="arrow-left" onClick={onBackButton} />
          )}
          <Typography variant="bodyHl" className="!truncate" color="grey700">
            {title}
          </Typography>
          {isBeta && (
            <Typography variant="noteHl" className="uppercase" noWrap color="warning700">
              {translate('text_65d8d71a640c5400917f8a13')}
            </Typography>
          )}
        </div>
      </div>
      <div className="height-minus-nav flex flex-col justify-between overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
