import { Button } from '~/components/designSystem/Button'
import { Typography } from '~/components/designSystem/Typography'
import { MenuPopper } from '~/styles/designSystem/PopperComponents'

interface LinkPastePopupProps {
  url: string
  onDisplayAsCard: () => void
  onKeepAsText: () => void
}

export const LinkPastePopup = ({ url, onDisplayAsCard, onKeepAsText }: LinkPastePopupProps) => {
  return (
    <div className="w-72 overflow-hidden rounded-xl bg-white shadow-md">
      <MenuPopper>
        <div className="border-b border-grey-200 px-3 py-2">
          <Typography variant="captionHl" color="grey600" noWrap>
            {url}
          </Typography>
        </div>
        <Button variant="quaternary" align="left" fullWidth onClick={onDisplayAsCard}>
          <Typography variant="bodyHl" color="grey700">
            Display as card
          </Typography>
        </Button>
        <Button variant="quaternary" align="left" fullWidth onClick={onKeepAsText}>
          <Typography variant="bodyHl" color="grey700">
            Keep as text
          </Typography>
        </Button>
      </MenuPopper>
    </div>
  )
}
