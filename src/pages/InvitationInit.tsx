import { useEffect } from 'react'
import { generatePath, Outlet, useParams } from 'react-router-dom'

import { INVITATION_ROUTE_FORM, useNavigate } from '~/core/router'

/**
 * Forwards an invitation link to the invitation form. The visitor is not logged out: an
 * authenticated invitee accepts the invitation without opening a new session.
 */
const InvitationInit = () => {
  const { token } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    navigate(generatePath(INVITATION_ROUTE_FORM, { token: token as string }), {
      replace: true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return <Outlet />
}

export default InvitationInit
