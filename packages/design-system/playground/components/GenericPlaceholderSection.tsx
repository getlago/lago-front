import { GenericPlaceholder, Typography } from '~/components'

import EmptyImage from '../../public/images/maneki/empty.svg'
import ErrorImage from '../../public/images/maneki/error.svg'

export const GenericPlaceholderSection = () => {
  return (
    <div>
      <Typography className="mb-4" variant="headline">
        Generic Placeholder
      </Typography>

      <div className="flex flex-row gap-4">
        <GenericPlaceholder
          title="Something went wrong"
          subtitle="Please refresh the page or contact us if the error persists."
          buttonTitle="Refresh the page"
          buttonVariant="primary"
          buttonAction={() => location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
        <GenericPlaceholder
          title="This add-on cannot be found"
          subtitle="Could you enter another keyword?"
          image={<EmptyImage width="136" height="104" />}
        />
      </div>
    </div>
  )
}
