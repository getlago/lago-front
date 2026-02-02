import { Icon } from 'lago-design-system'
import { HTMLAttributes } from 'react'

import { ButtonLink, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type FreemiumBlockProps = HTMLAttributes<HTMLDivElement> & {
  translationKeys: {
    title: string
    description: string
    emailSubject: string
    emailBody: string
  }
}

export const FreemiumBlock = ({ translationKeys, ...props }: FreemiumBlockProps) => {
  const { translate } = useInternationalization()

  const { title, description, emailSubject, emailBody } = translationKeys

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg bg-grey-100 px-6 py-4"
      {...props}
    >
      <div>
        <div className="flex items-center gap-2">
          <Typography variant="bodyHl" color="textSecondary">
            {translate(title)}
          </Typography>
          <Icon name="sparkles" />
        </div>
        <Typography variant="caption">{translate(description)}</Typography>
      </div>

      <ButtonLink
        buttonProps={{
          variant: 'tertiary',
          size: 'medium',
          endIcon: 'sparkles',
        }}
        type="button"
        external
        to={`mailto:hello@getlago.com?subject=${translate(emailSubject)}&body=${translate(emailBody)}`}
      >
        {translate('text_65ae73ebe3a66bec2b91d72d')}
      </ButtonLink>
    </div>
  )
}
