import { GenericPlaceholder, GenericPlaceholderProps } from 'lago-design-system'
import { useNavigate } from 'react-router-dom'

import { MappableTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import EmptyImage from '~/public/images/maneki/empty.svg'

import { FetchableIntegrationItemEmptyProps } from './types'

const FetchableIntegrationItemError = ({
  hasSearchTerm,
  type,
  createRoute,
}: FetchableIntegrationItemEmptyProps) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const getPlaceholderProps = (): Omit<GenericPlaceholderProps, 'image'> => {
    if (hasSearchTerm && type === MappableTypeEnum.AddOn) {
      return {
        title: translate('text_63bee4e10e2d53912bfe4da5'),
        subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
      }
    }

    if (hasSearchTerm && type === MappableTypeEnum.BillableMetric) {
      return {
        title: translate('text_629728388c4d2300e2d380d5'),
        subtitle: translate('text_63bab307a61c62af497e0599'),
      }
    }

    if (type === MappableTypeEnum.AddOn) {
      return {
        title: translate('text_629728388c4d2300e2d380c9'),
        subtitle: translate('text_629728388c4d2300e2d380df'),
        buttonTitle: translate('text_629728388c4d2300e2d3810f'),
        buttonVariant: 'primary',
        buttonAction: () => navigate(createRoute),
      }
    }

    return {
      title: translate('text_623b53fea66c76017eaebb70'),
      subtitle: translate('text_623b53fea66c76017eaebb78'),
      buttonTitle: translate('text_623b53fea66c76017eaebb7c'),
      buttonVariant: 'primary',
      buttonAction: () => navigate(createRoute),
    }
  }

  return (
    <GenericPlaceholder
      image={<EmptyImage width="136" height="104" />}
      {...getPlaceholderProps()}
    />
  )
}

export default FetchableIntegrationItemError
