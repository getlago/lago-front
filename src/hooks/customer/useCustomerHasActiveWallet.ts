import { useGetCustomerWalletListQuery, WalletStatusEnum } from '~/generated/graphql'

export const useCustomerHasActiveWallet = ({ customerId }: { customerId?: string | null }) => {
  const { data: customerWalletData } = useGetCustomerWalletListQuery({
    variables: { customerId: customerId as string, page: 0, limit: 20 },
    skip: !customerId,
  })

  const list = customerWalletData?.wallets?.collection || []

  const activeWallet = list.find((wallet) => wallet.status === WalletStatusEnum.Active)

  return !!activeWallet
}
