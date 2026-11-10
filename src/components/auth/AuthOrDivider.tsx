import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const AuthOrDivider = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center justify-center gap-4 before:flex-1 before:border before:border-grey-300 before:content-[''] after:flex-1 after:border after:border-grey-300 after:content-['']">
      <Typography variant="captionHl" color="grey500">
        {translate('text_6303351deffd2a0d70498675').toUpperCase()}
      </Typography>
    </div>
  )
}
