import { Accordion, Typography } from '~/components'

export const AccordionSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Accordion
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Variant card
          </Typography>
          <div className="flex flex-col gap-4">
            <Accordion size="medium" summary="medium accordion">
              <Typography variant="body">Content of the accordion</Typography>
            </Accordion>
            <Accordion size="large" summary="large accordion">
              <Typography variant="body">Content of the accordion</Typography>
            </Accordion>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Variant borderless
          </Typography>
          <div className="flex flex-col gap-4">
            <Accordion
              variant="borderless"
              summary={
                <div>
                  <Typography variant="subhead1" className="mb-2">
                    borderless accordion
                  </Typography>
                  <Typography variant="caption">Caption</Typography>
                </div>
              }
            >
              <Typography variant="body">Content of the accordion</Typography>
            </Accordion>
          </div>
        </section>
      </div>
    </div>
  )
}
