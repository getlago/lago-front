import { Skeleton, Typography } from '~/components'

export const SkeletonSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Skeleton
      </Typography>

      <div className="flex flex-row flex-wrap gap-20">
        <section>
          <Typography className="mb-4" variant="subhead1">
            Connector avatar
          </Typography>
          <div className="flex flex-col gap-4">
            <Skeleton variant="connectorAvatar" size="small" />
            <Skeleton variant="connectorAvatar" size="medium" />
            <Skeleton variant="connectorAvatar" size="large" />
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            User avatar
          </Typography>
          <div className="flex flex-col gap-4">
            <Skeleton variant="userAvatar" size="small" />
            <Skeleton variant="userAvatar" size="medium" />
            <Skeleton variant="userAvatar" size="large" />
          </div>
        </section>

        <section>
          <Typography className="mb-4" variant="subhead1">
            Circular
          </Typography>
          <div className="flex flex-row gap-4">
            <Skeleton className="mb-4" size="large" variant="circular" />
            <Skeleton className="mb-4" size="large" variant="circular" color="dark" />
          </div>
        </section>

        <section className="flex-1">
          <Typography className="mb-4" variant="subhead1">
            Text
          </Typography>
          <div className="flex flex-col gap-4">
            <Skeleton variant="text" textVariant="note" />
            <Skeleton variant="text" textVariant="caption" />
            <Skeleton variant="text" textVariant="headline" />
            <Skeleton variant="text" textVariant="note" color="dark" />
            <Skeleton variant="text" textVariant="caption" color="dark" />
            <Skeleton variant="text" textVariant="headline" color="dark" />
          </div>
        </section>
      </div>
    </div>
  )
}
