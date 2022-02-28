import { gql } from '@apollo/client'

export const typeDefs = gql`
  extend type Query {
    token: Boolean!
  }
`

export const resolvers = {}
