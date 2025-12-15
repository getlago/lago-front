import { useParams } from 'react-router-dom'

import { ButtonLink, Skeleton, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { ROLES_LIST_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PageHeader } from '~/styles'

import { useRoleDetails } from './useRoleDetails'

import { RolesNameMapping, systemRoles } from '../rolesList/const'

const RoleDetails = () => {
  const { translate } = useInternationalization()
  const { roleId } = useParams<string>()
  const { role, isLoadingRole } = useRoleDetails({ roleId })

  if (!roleId) {
    return <div>Role ID is missing</div>
  }

  const getDisplayName = () => {
    if (!role) return ''

    const nameToDisplay = systemRoles.includes(role.name)
      ? translate(RolesNameMapping[role.name as keyof typeof RolesNameMapping])
      : role.name

    return <Typography color="grey600">{nameToDisplay}</Typography>
  }

  return (
    <>
      <PageHeader.Wrapper>
        <PageHeader.Group>
          <ButtonLink
            to={ROLES_LIST_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {isLoadingRole && <Skeleton variant="text" className="w-30" />}
          {!isLoadingRole && role && (
            <Typography variant="bodyHl" color="textSecondary">
              {getDisplayName()}
            </Typography>
          )}
        </PageHeader.Group>
      </PageHeader.Wrapper>
      <DetailsPage.Header
        isLoading={isLoadingRole}
        icon="user"
        title={getDisplayName()}
        description={role?.description || ''}
      />
    </>
  )
}

export default RoleDetails
