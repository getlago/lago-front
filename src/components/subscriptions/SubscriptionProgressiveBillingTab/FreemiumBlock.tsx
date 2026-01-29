import { Icon } from 'lago-design-system'

import { ButtonLink, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const FreemiumBlock = () => {
  const { translate } = useInternationalization()

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-grey-100 px-6 py-4">
      <div>
        <div className="flex items-center gap-2">
          <Typography variant="bodyHl" color="textSecondary">
            {translate('text_1724345142892pcnx5m2k3r2')}
          </Typography>
          <Icon name="sparkles" />
        </div>
        <Typography variant="caption">{translate('text_1724345142892ljzi79afhmc')}</Typography>
      </div>

      <ButtonLink
        buttonProps={{
          variant: 'tertiary',
          size: 'medium',
          endIcon: 'sparkles',
        }}
        type="button"
        external
        to={`mailto:hello@getlago.com?subject=${translate('text_172434514289283gmf8bdhh3')}&body=${translate('text_1724346450317iqs2rtvx1tp')}`}
      >
        {translate('text_65ae73ebe3a66bec2b91d72d')}
      </ButtonLink>
    </div>
  )
}
