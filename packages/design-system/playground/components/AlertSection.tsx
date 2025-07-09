import { Alert, Typography } from '~/components'

export const AlertSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Alert
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Full width
          </Typography>
          <div className="flex flex-col gap-4">
            <Alert
              fullWidth
              className="md:px-12"
              type="danger"
              ButtonProps={{
                label: 'Retry',
                // eslint-disable-next-line no-alert
                onClick: () => alert('Retry clicked'),
              }}
            >
              <div>
                <Typography variant="body" color="grey700">
                  Invoice could not be fully refreshed.
                </Typography>
                <Typography variant="caption">
                  An issue with your tax provider connection occurred. Please contact the Lago team
                  to solve this issue.
                </Typography>
              </div>
            </Alert>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Variants
          </Typography>
          <div className="flex flex-col gap-4">
            <Alert type="info">I&apos;m an info alert</Alert>
            <Alert type="success">I&apos;m a success alert</Alert>
            <Alert type="warning">I&apos;m a warning alert</Alert>
            <Alert type="danger">I&apos;m a danger alert</Alert>
          </div>
        </section>
      </div>
    </div>
  )
}
