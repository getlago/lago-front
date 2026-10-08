import { gql } from '@apollo/client'

gql`
  fragment RoleFragment on Role {
    id
    name
    description
    permissions
    admin
    grantable
    code
    memberships {
      id
      user {
        id
        email
      }
      revokedAt
    }
  }
`
