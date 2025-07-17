import { Avatar, Chip, Selector, Typography } from '~/components'

import Stripe from '../../public/images/stripe.svg'

export const SelectorSection = () => {
  const onClick = () => {
    // eslint-disable-next-line no-alert
    alert('Clicked')
  }

  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Selector
      </Typography>

      <div className="flex flex-col gap-4">
        <Selector
          title="A simple selector"
          subtitle="with more info"
          icon={
            <Avatar variant="connector-full">
              <Stripe />
            </Avatar>
          }
          endIcon={
            <Chip icon="validate-filled" iconSize="medium" iconColor="success" label="With chip" />
          }
          onClick={onClick}
          fullWidth
        />
        <Selector
          title="A simple selector selected"
          subtitle="Subtitle first"
          titleFirst={false}
          selected
          icon="target"
          endIcon={<Chip label="With chip" />}
          onClick={onClick}
        />
        <Selector
          title="Non clickable selector"
          subtitle="Alexandre Monjol"
          titleFirst={false}
          icon="user"
        />
        <Selector
          title="A simple selector disabled"
          subtitle="Subtitle first"
          titleFirst={false}
          disabled
          icon={
            <Avatar variant="connector">
              <Stripe />
            </Avatar>
          }
          endIcon={<Chip label="With chip" />}
          onClick={onClick}
        />
      </div>
    </div>
  )
}
