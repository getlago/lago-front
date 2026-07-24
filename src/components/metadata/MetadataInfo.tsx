import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type MetadataInfoProps = {
  metadata: Array<{ key: string; value?: string | null }>
}

export const MetadataInfo = ({ metadata }: MetadataInfoProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col">
      {metadata.map(({ key, value }, index) => (
        <div
          key={`plan-metadata-row-${key}-${index}`}
          className="grid grid-cols-2 gap-4 p-4 shadow-b last:shadow-none"
        >
          <div className="flex min-w-0 flex-col gap-1">
            <Typography variant="caption" color="grey600">
              {translate('text_63fcc3218d35b9377840f5a3')}
            </Typography>
            <Typography variant="body" color="grey700" className="break-words">
              {key}
            </Typography>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <Typography variant="caption" color="grey600">
              {translate('text_63fcc3218d35b9377840f5ab')}
            </Typography>
            <Typography variant="body" color="grey700" className="break-words">
              {value || '-'}
            </Typography>
          </div>
        </div>
      ))}
    </div>
  )
}
