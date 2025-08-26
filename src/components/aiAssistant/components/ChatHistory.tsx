import { Typography } from 'lago-design-system'

export const ChatHistory = () => {
  return (
    <div className="flex flex-col gap-1">
      <Typography variant="captionHl" color="grey700">
        Recent conversations
      </Typography>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="caption" color="grey600">
            Overdue Invoices – July
          </Typography>
          <Typography
            variant="caption"
            color="grey600"
            className="inline-block h-7 rounded-lg border border-grey-400 px-2"
          >
            1h
          </Typography>
        </div>
        <div className="flex items-center justify-between gap-2">
          <Typography variant="caption" color="grey600">
            Overdue Invoices – July
          </Typography>
          <Typography
            variant="caption"
            color="grey600"
            className="inline-block h-7 rounded-lg border border-grey-400 px-2"
          >
            1h
          </Typography>
        </div>
      </div>
    </div>
  )
}
