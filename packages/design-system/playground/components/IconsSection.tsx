import { AiBadge, ALL_ICONS, Icon, IconName, Typography } from '~/components'

export const IconsSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Icons
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            General use
          </Typography>
          <div className="flex flex-wrap gap-4">
            {Object.keys(ALL_ICONS).map((iconName, i) => (
              <Icon key={`icon-${i}`} name={iconName as IconName} />
            ))}
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Colors
          </Typography>
          <div className="flex flex-wrap gap-4">
            <Icon name="plug" color="success" />
            <Icon name="plug" color="error" />
            <Icon name="plug" color="warning" />
            <Icon name="plug" color="info" />
            <Icon name="plug" color="light" />
            <Icon name="plug" color="dark" />
            <Icon name="plug" color="skeleton" />
            <Icon name="plug" color="disabled" />
            <Icon name="plug" color="input" />
            <Icon name="plug" color="primary" />
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Animation
          </Typography>
          <div className="flex flex-wrap gap-4">
            <Icon name="processing" animation="spin" />
            <Icon name="star-filled" animation="pulse" />
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Size
          </Typography>
          <div className="flex flex-wrap gap-4">
            <Icon name="puzzle" size="small" />
            <Icon name="puzzle" size="medium" />
            <Icon name="puzzle" size="large" />
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            AI Badge
          </Typography>
          <AiBadge />
        </section>
      </div>
    </div>
  )
}
