import { gql } from '@apollo/client'

export const typeDefs = gql`
  extend type Query {
    token: Boolean!
  }

  enum LagoApiError {
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
    coupon_is_not_reusable
    currencies_does_not_match
    invite_not_found
    value_already_exist
    value_is_invalid
    value_is_out_of_range
    url_is_invalid
    invite_already_exists
    email_already_used

    # Object not found
    plan_not_found
  }
`

export const resolvers = {}
