import { forwardRef, useState, useImperativeHandle, useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Drawer, DrawerRef, Button, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'
import { useGetBmDetailQuery } from '~/generated/graphql'

gql`
  query getBmDetail($id: ID!) {
    billableMetric(id: $id) {
      id
      name
    }
  }
`

export interface CustomerBMUsageDetailDrawerRef {
  openDrawer: (billableMetricId: string) => unknown
  closeDialog: () => unknown
}

export const CustomerBMUsageDetailDrawer = forwardRef<CustomerBMUsageDetailDrawerRef>((_, ref) => {
  const drawerRef = useRef<DrawerRef>(null)
  const [billableMetricId, setBillableMetricId] = useState<string>()
  const { data, loading, error } = useGetBmDetailQuery({
    // context: { silentError: LagoApiError.NotFound },
    // @ts-ignore
    variables: { id: billableMetricId },
    skip: !billableMetricId,
  })

  const { translate } = useInternationalization()

  useImperativeHandle(ref, () => ({
    openDrawer: (id) => {
      setBillableMetricId(id)
      drawerRef.current?.openDrawer()
    },
    closeDialog: () => drawerRef.current?.closeDrawer(),
  }))

  return (
    <Drawer ref={drawerRef} title={translate('TODO:')}>
      <>
        <Content>
          <Title>
            <Typography variant="headline">{translate('TODO:')}</Typography>
            <Typography>{translate('TODO:')}</Typography>
          </Title>

          {/* TODO: Display BM usage detail */}
        </Content>
        <SubmitButton>
          <Button
            size="large"
            fullWidth
            onClick={() => drawerRef.current?.closeDrawer()}
            data-test="submit"
          >
            {translate('TODO:')}{' '}
          </Button>
        </SubmitButton>
      </>
    </Drawer>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const Title = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const SubmitButton = styled.div`
  margin: 0 ${theme.spacing(8)};
`

CustomerBMUsageDetailDrawer.displayName = 'CustomerBMUsageDetailDrawer'
