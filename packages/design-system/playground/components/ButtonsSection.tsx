import { Button, Typography } from '~/components'

export const ButtonsSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Button
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            General use
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button variant="primary" size="large">
              Large
            </Button>
            <Button variant="primary" size="medium">
              Medium
            </Button>
            <Button variant="primary" size="small">
              Small
            </Button>
            <Button variant="primary" icon="coupon" size="large" />
            <Button variant="primary" icon="download" size="medium" />
            <Button variant="primary" icon="trash" size="small" />
            <Button variant="primary" endIcon="rocket">
              End Icon
            </Button>
            <Button variant="primary" startIcon="rocket">
              Start Icon
            </Button>
            <Button variant="primary" loading>
              Loading
            </Button>
            <Button
              variant="primary"
              onClick={async () => await new Promise((r) => setTimeout(r, 1000))}
            >
              With Promise
            </Button>
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Primary
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button variant="primary">Default</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
            <Button variant="primary" danger>
              Danger
            </Button>
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Secondary
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button variant="secondary">Default</Button>
            <Button variant="secondary" size="large">
              Large
            </Button>
            <Button variant="secondary" size="medium">
              Medium
            </Button>
            <Button variant="secondary" size="small">
              Small
            </Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
            <Button variant="secondary" danger>
              Danger
            </Button>
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Tertiary
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button variant="tertiary">Default</Button>
            <Button variant="tertiary" size="large">
              Large
            </Button>
            <Button variant="tertiary" size="medium">
              Medium
            </Button>
            <Button variant="tertiary" size="small">
              Small
            </Button>
            <Button variant="tertiary" disabled>
              Disabled
            </Button>
            <Button variant="tertiary" danger>
              Danger
            </Button>
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Quaternary
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button variant="quaternary">Default</Button>
            <Button variant="quaternary" size="large">
              Large
            </Button>
            <Button variant="quaternary" size="medium">
              Medium
            </Button>
            <Button variant="quaternary" size="small">
              small
            </Button>
            <Button variant="quaternary" startIcon="plus" size="small">
              Add
            </Button>
            <Button variant="quaternary" disabled>
              Disabled
            </Button>
            <Button variant="quaternary" danger>
              Danger
            </Button>
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Inline
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button variant="inline">Default</Button>
            <Button variant="inline" size="large">
              Large
            </Button>
            <Button variant="inline" size="medium">
              Medium
            </Button>
            <Button variant="inline" size="small">
              small
            </Button>
            <Button variant="inline" startIcon="plus" size="small">
              Add
            </Button>
            <Button variant="inline" disabled>
              Disabled
            </Button>
            <Button variant="inline" danger>
              Danger
            </Button>
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Google connect
          </Typography>
          <div className="mb-4 flex flex-wrap gap-4">
            <Button fullWidth startIcon="google" size="large" variant="tertiary">
              Log In with Google
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
