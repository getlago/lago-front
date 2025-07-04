import { ButtonLink, Typography } from '~/components'

export const LinksSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Links
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Link in navigation tabs with <code>{'<ButtonLink/>'}</code>
          </Typography>
          <div className="flex flex-wrap gap-4">
            <ButtonLink type="tab" icon="rocket" to={'/'}>
              Non active Link
            </ButtonLink>
            <ButtonLink type="tab" active icon="plug" to={'/'}>
              Active
            </ButtonLink>
            <ButtonLink
              type="tab"
              icon="plug"
              external
              to="https://www.youtube.com/watch?v=h6fcK_fRYaI&ab_channel=Kurzgesagt%E2%80%93InaNutshell"
            >
              External
            </ButtonLink>
            <ButtonLink type="tab" disabled to={'/'}>
              Disabled
            </ButtonLink>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Button Links with <code>{'<ButtonLink/>'}</code>
          </Typography>
          <div className="flex flex-row gap-4">
            <ButtonLink type="button" to={'/'}>
              Internal
            </ButtonLink>
            <ButtonLink
              type="button"
              external
              to="https://www.youtube.com/watch?v=h6fcK_fRYaI&ab_channel=Kurzgesagt%E2%80%93InaNutshell"
            >
              External
            </ButtonLink>

            <ButtonLink
              type="button"
              buttonProps={{ variant: 'tertiary', startIcon: 'bell' }}
              to={'/'}
            >
              With Button Props
            </ButtonLink>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Simple links with <code>{'<a/>'}</code>
          </Typography>
          <div className="flex flex-wrap gap-4">
            <a target="_blank" href="https://main-app.staging.getlago.com/coupons" rel="noreferrer">
              Normal Link
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
