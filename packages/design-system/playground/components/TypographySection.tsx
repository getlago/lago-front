import { Typography } from '~/components'

export const TypographySection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Typography
      </Typography>

      <div className="flex flex-row gap-6">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Variant
          </Typography>
          <div className="flex flex-col gap-2">
            <Typography variant="headline">Headline</Typography>
            <Typography variant="subhead1">Subhead</Typography>
            <Typography variant="bodyHl">BodyHl</Typography>
            <Typography variant="body">Body</Typography>
            <Typography variant="button">Button</Typography>
            <Typography variant="caption">Caption</Typography>
            <Typography variant="captionHl">CaptionHl</Typography>
            <Typography variant="captionCode">CaptionCode</Typography>
            <Typography variant="note">Note</Typography>
            <Typography variant="noteHl">NoteHl</Typography>
            <Typography blur>Amma blurred text</Typography>
            <Typography
              color="textSecondary"
              html="I'm a bit <b>special</b>, I <i>understand</i> html"
            />
          </div>
        </section>
        <section>
          <Typography className="mb-4" variant="subhead1">
            Color
          </Typography>
          <div className="flex flex-col gap-2">
            <Typography color="textSecondary">color textSecondary</Typography>
            <Typography color="textPrimary">color textPrimary</Typography>
            <Typography color="primary600">color primary600</Typography>
            <Typography color="grey700">color grey700</Typography>
            <Typography color="grey600">color grey600</Typography>
            <Typography color="grey500">color grey500</Typography>
            <Typography color="disabled">color disabled</Typography>
            <Typography color="danger600">color danger600</Typography>
            <Typography color="white">color white</Typography>
          </div>
        </section>
      </div>
    </div>
  )
}
