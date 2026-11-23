import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar } from '~/core/apolloClient'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RecaptchaNotice = (): JSX.Element | null => {
  const { translate } = useInternationalization()
  const { recaptchaSiteKey } = envGlobalVar()

  if (!recaptchaSiteKey) return null

  return (
    <Typography
      className="text-center"
      variant="caption"
      color="grey600"
      html={translate('text_179390753309316odlsgqxbw')}
    />
  )
}
