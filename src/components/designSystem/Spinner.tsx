import { Icon } from 'lago-design-system'

export const Spinner = () => {
  return (
    <div className="flex size-full items-center justify-center">
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}
