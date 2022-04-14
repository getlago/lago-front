import { forwardRef, useState } from 'react'
import { gql } from '@apollo/client'
import { useNavigate, generatePath } from 'react-router-dom'
import styled from 'styled-components'

import { Dialog, Button, DialogRef } from '~/components/designSystem'
import { TextInput } from '~/components/form'
import { useI18nContext } from '~/core/I18nContext'
import { addToast } from '~/core/apolloClient'
import { theme } from '~/styles'
import { useCreateCustomerMutation, CustomerItemFragmentDoc } from '~/generated/graphql'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'

export interface AddCustomerDialogRef extends DialogRef {}

gql`
  mutation createCustomer($input: CreateCustomerInput!) {
    createCustomer(input: $input) {
      ...CustomerItem
    }
  }

  ${CustomerItemFragmentDoc}
`

export const AddCustomerDialog = forwardRef<DialogRef>((_, ref) => {
  const { translate } = useI18nContext()
  const [name, setName] = useState<string>('')
  const [customerId, setCustomerId] = useState<string>('')
  const navigate = useNavigate()
  const [create] = useCreateCustomerMutation({
    onCompleted({ createCustomer }) {
      if (!!createCustomer) {
        addToast({
          message: translate('text_6250304370f0f700a8fdc295'),
          severity: 'success',
        })
        navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { id: createCustomer.id }))
        setName('')
        setCustomerId('')
      }
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_624efab67eb2570101d117ad')}
      description={translate('text_624efab67eb2570101d117b5')}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              setName('')
              setCustomerId('')
            }}
          >
            {translate('text_6244277fe0975300fe3fb94a')}
          </Button>
          <Button
            disabled={!name || !customerId}
            onClick={async () => {
              await create({
                variables: {
                  input: {
                    name,
                    customerId,
                  },
                },
              })
            }}
          >
            {translate('text_624efab67eb2570101d117eb')}
          </Button>
        </>
      )}
    >
      <Content>
        <TextInput
          value={name}
          label={translate('text_624efab67eb2570101d117be')}
          placeholder={translate('text_624efab67eb2570101d117c6')}
          onChange={setName}
        />
        <TextInput
          value={customerId}
          label={translate('text_624efab67eb2570101d117ce')}
          placeholder={translate('text_624efab67eb2570101d117d6')}
          helperText={translate('text_624efab67eb2570101d117de')}
          onChange={setCustomerId}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  > * {
    margin-bottom: ${theme.spacing(8)};
  }
`

AddCustomerDialog.displayName = 'AddCustomerDialog'
