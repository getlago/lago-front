import { gql } from '@apollo/client'

export const typeDefs = gql`
  extend type Query {
    token: Boolean!
  }

  enum LAGO_API_ERROR {
    user_already_exists
    incorrect_login_or_password
    internal_error
    unauthorized
  }
`

export const resolvers = {}
