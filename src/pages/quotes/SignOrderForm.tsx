import { gql } from '@apollo/client'

gql`
  query getOrderFormForSign($id: ID!) {
    orderForm(id: $id) {
      id
      number
      status
      createdAt
      customer {
        id
        name
      }
      quote {
        id
        number
        orderType
        currentVersion {
          version
        }
      }
    }
  }
`

gql`
  mutation markOrderFormAsSigned($input: MarkOrderFormAsSignedInput!) {
    markOrderFormAsSigned(input: $input) {
      id
      status
    }
  }
`

const SignOrderForm = () => {
  return null
}

export default SignOrderForm
