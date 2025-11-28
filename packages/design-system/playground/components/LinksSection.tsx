import { Typography } from '~/components'

export const LinksSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Links
      </Typography>

      <div className="flex flex-col gap-6">
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
