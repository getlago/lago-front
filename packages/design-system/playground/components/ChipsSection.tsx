import { Chip, Typography } from '~/components'

export const ChipsSection = () => {
  const onDelete = () => {
    // eslint-disable-next-line no-alert
    alert('Chip clicked')
  }

  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Chips
      </Typography>

      <div className="flex flex-col gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Variants
          </Typography>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row flex-wrap gap-4">
              <Chip label="I have an icon" icon="scissor" />
              <Chip label="I have an icon and delete" icon="percentage" onDelete={onDelete} />
              <Chip
                label="Tooltip on icon"
                icon="scissor"
                deleteIconLabel="Delete"
                onDelete={onDelete}
              />
              <Chip error label="I have an error" icon="scissor" onDelete={onDelete} />
            </div>
            <div className="flex flex-row flex-wrap gap-4">
              <Chip type="secondary" label="I have an icon" icon="scissor" />
              <Chip
                type="secondary"
                label="I have an icon and delete"
                icon="percentage"
                onDelete={onDelete}
              />
              <Chip
                type="secondary"
                label="Tooltip on icon"
                icon="scissor"
                deleteIconLabel="Delete"
                onDelete={onDelete}
              />
              <Chip
                error
                type="secondary"
                label="I have an error"
                icon="scissor"
                onDelete={onDelete}
              />
            </div>
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Sizes
          </Typography>
          <div className="flex flex-row flex-wrap gap-4">
            <Chip label="Small" size="small" />
            <Chip label="Default" />
            <Chip label="Big" size="big" />
          </div>
        </section>
      </div>
    </div>
  )
}
