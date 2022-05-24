import { gql } from '@apollo/client'

export const typeDefs = gql`
  extend type Query {
    token: Boolean!
  }

  enum LAGO_API_ERROR {
    internal_error
    unauthorized
    forbidden
    not_found
    unprocessable_entity

    # Authentication & authentication errors
    token_encoding_error
    expired_jwt_token
    incorrect_login_or_password
    not_organization_member

    # Validation errors
    user_already_exists
    coupon_already_applied
    currencies_does_not_match
  }
`

export const resolvers = {}
