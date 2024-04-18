import { gql } from '@apollo/client'

gql`
  fragment NetsuiteIntegrationItems on NetsuiteIntegration {
    id
  }
`

const NetsuiteIntegrationItems = () => {
  return <>Integration items </>
}

export default NetsuiteIntegrationItems
