import { Avatar, AvatarBadge, Icon, Tooltip, Typography } from '~/components'

import Stripe from '../../public/images/stripe.svg'

export const AvatarSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Avatar
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Variants
          </Typography>
          <div className="flex flex-wrap gap-4">
            <Tooltip title="Connector with icon">
              <Avatar variant="connector">
                <Icon name="pulse" color="dark" />
              </Avatar>
            </Tooltip>
            <Tooltip title="Connector with avatar badge">
              <Avatar variant="connector">
                <Icon name="pulse" color="dark" />
                <AvatarBadge icon="stop" color="error" />
              </Avatar>
            </Tooltip>
            <Tooltip title="Connector with image">
              <Avatar variant="connector-full">
                <Stripe />
              </Avatar>
            </Tooltip>
            <Tooltip title="Company">
              <Avatar
                variant="company"
                identifier="Lago Corp"
                initials={'Lago Corp'.split(' ').reduce((acc, n) => (acc = acc + n[0]), '')}
              />
            </Tooltip>
            <Tooltip title="User">
              <Avatar variant="user" identifier="Morguy" initials="ML" />
            </Tooltip>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Size
          </Typography>
          <div className="flex flex-row gap-4">
            <div className="flex flex-col flex-wrap gap-4">
              <Avatar variant="user" size="small" identifier="Morguy" initials="ML" />
              <Avatar variant="user" size="intermediate" identifier="Morguy" initials="ML" />
              <Avatar variant="user" size="medium" identifier="Morguy" initials="ML" />
              <Avatar variant="user" size="large" identifier="Morguy" initials="ML" />
            </div>
            <div className="flex flex-col flex-wrap gap-4">
              <Avatar variant="company" size="small" identifier="Lago Corp" />
              <Avatar variant="company" size="intermediate" identifier="Lago Corp" />
              <Avatar variant="company" size="medium" identifier="Lago Corp" />
              <Avatar variant="company" size="large" identifier="Lago Corp" />
            </div>
            <div className="flex flex-col flex-wrap gap-4">
              <Avatar variant="connector" size="tiny">
                <Icon name="pulse" color="dark" />
              </Avatar>
              <Avatar variant="connector" size="small">
                <Icon name="pulse" color="dark" />
              </Avatar>
              <Avatar variant="connector" size="intermediate">
                <Icon name="pulse" color="dark" />
              </Avatar>
              <Avatar variant="connector" size="medium">
                <Icon name="pulse" color="dark" />
              </Avatar>
              <Avatar variant="connector" size="big">
                <Icon name="pulse" color="dark" />
                <AvatarBadge icon="stop" color="info" size="big" />
              </Avatar>
              <Avatar variant="connector" size="large">
                <Icon name="pulse" color="dark" />
                <AvatarBadge icon="stop" color="warning" size="large" />
              </Avatar>
            </div>
            <div className="flex flex-col flex-wrap gap-4">
              <Avatar variant="connector" size="medium">
                <Stripe />
              </Avatar>
              <Avatar variant="connector" size="large">
                <Stripe />
              </Avatar>
            </div>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Colors
          </Typography>
          <Typography className="mb-4">
            Color is defined automatically based on initials or identifier
          </Typography>
          <div className="flex flex-wrap gap-4">
            <Avatar variant="company" identifier="AA" />
            <Avatar variant="company" identifier="AB" />
            <Avatar variant="company" identifier="AC" />
            <Avatar variant="company" identifier="AD" />
            <Avatar variant="company" identifier="AE" />
            <Avatar variant="company" identifier="AF" />
            <Avatar variant="company" identifier="AG" />
            <Avatar variant="company" identifier="AH" />
          </div>
        </section>
      </div>
    </div>
  )
}
