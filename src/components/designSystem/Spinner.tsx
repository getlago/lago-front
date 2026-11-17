import { Icon } from '~/components/designSystem/Icon'

export const Spinner = ({ 'data-test': dataTestId }: { 'data-test'?: string }) => {
  return (
    <div className="flex size-full items-center justify-center" data-test={dataTestId}>
      <Icon name="processing" color="info" size="large" animation="spin" />
    </div>
  )
}
