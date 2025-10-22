import { gql } from '@apollo/client'
import { Avatar, Icon, tw } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { DeleteAddOnDialog, DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'
import {
  ActionItem,
  ButtonLink,
  InfiniteScroll,
  Table,
  Typography,
} from '~/components/designSystem'
import { SearchInput } from '~/components/SearchInput'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import {
  ADD_ON_DETAILS_ROUTE,
  ADD_ONS_ROUTE,
  CREATE_ADD_ON_ROUTE,
  UPDATE_ADD_ON_ROUTE,
} from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { AddOnItemFragment, useAddOnsLazyQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useDebouncedSearch } from '~/hooks/useDebouncedSearch'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { PageHeader } from '~/styles'

gql`
  fragment AddOnItem on AddOn {
    id
    name
    amountCurrency
    amountCents
    customersCount
    createdAt
  }

  query addOns($page: Int, $limit: Int, $searchTerm: String) {
    addOns(page: $page, limit: $limit, searchTerm: $searchTerm) {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...AddOnItem
      }
    }
  }
`

const AddOnsList = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const deleteDialogRef = useRef<DeleteAddOnDialogRef>(null)
  const [getAddOns, { data, error, loading, fetchMore, variables }] = useAddOnsLazyQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'network-only',
  })
  const { debouncedSearch, isLoading } = useDebouncedSearch(getAddOns, loading)
  const list = data?.addOns?.collection || []
  const shouldShowItemActions = hasPermissions(['addonsUpdate', 'addonsDelete'])

  return (
    <>
      <PageHeader.Wrapper className="gap-4 *:whitespace-pre" withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate('text_629728388c4d2300e2d3809b')}
        </Typography>
        <PageHeader.Group>
          <SearchInput
            onChange={debouncedSearch}
            placeholder={translate('text_63bee4e10e2d53912bfe4db8')}
          />
          {hasPermissions(['addonsCreate']) && (
            <ButtonLink type="button" to={CREATE_ADD_ON_ROUTE} data-test="create-addon-cta">
              {translate('text_629728388c4d2300e2d38085')}
            </ButtonLink>
          )}
        </PageHeader.Group>
      </PageHeader.Wrapper>

      <InfiniteScroll
        onBottom={() => {
          const { currentPage = 0, totalPages = 0 } = data?.addOns?.metadata || {}

          currentPage < totalPages &&
            !isLoading &&
            fetchMore({
              variables: { page: currentPage + 1 },
            })
        }}
      >
        <Table
          name="add-ons-list"
          data={list}
          containerSize={{
            default: 16,
            md: 48,
          }}
          containerClassName={tw('h-[calc(100%-theme(space.nav))]')}
          rowSize={72}
          isLoading={isLoading}
          hasError={!!error}
          onRowActionLink={({ id }) => generatePath(ADD_ON_DETAILS_ROUTE, { addOnId: id })}
          rowDataTestId={(addOn) => `${addOn.name}`}
          columns={[
            {
              key: 'name',
              title: translate('text_629728388c4d2300e2d380bd'),
              minWidth: 200,
              maxSpace: true,
              content: ({ name, amountCents, amountCurrency }) => (
                <div className="flex items-center gap-3">
                  <Avatar size="big" variant="connector">
                    <Icon name="puzzle" color="dark" />
                  </Avatar>
                  <div>
                    <Typography color="textSecondary" variant="bodyHl" noWrap>
                      {name}
                    </Typography>
                    <Typography variant="caption" noWrap>
                      {translate('text_629728388c4d2300e2d3810b', {
                        amountWithCurrency: intlFormatNumber(
                          deserializeAmount(amountCents, amountCurrency) || 0,
                          {
                            currencyDisplay: 'symbol',
                            currency: amountCurrency,
                          },
                        ),
                      })}
                    </Typography>
                  </div>
                </div>
              ),
            },
            {
              key: 'customersCount',
              title: translate('text_629728388c4d2300e2d380cd'),
              textAlign: 'right',
              minWidth: 112,
              content: ({ customersCount }) => (
                <Typography color="grey600" variant="bodyHl" noWrap>
                  {customersCount}
                </Typography>
              ),
            },
            {
              key: 'createdAt',
              title: translate('text_629728388c4d2300e2d380e3'),
              minWidth: 140,
              content: ({ createdAt }) => (
                <Typography color="textSecondary" variant="bodyHl" noWrap>
                  {intlFormatDateTimeOrgaTZ(createdAt).date}
                </Typography>
              ),
            },
          ]}
          actionColumnTooltip={() => translate('text_629728388c4d2300e2d3810d')}
          actionColumn={(addOn) => {
            if (!shouldShowItemActions) return

            return [
              ...(hasPermissions(['addonsUpdate'])
                ? [
                    {
                      startIcon: 'pen',
                      title: translate('text_629728388c4d2300e2d3816a'),
                      onAction: () =>
                        navigate(generatePath(UPDATE_ADD_ON_ROUTE, { addOnId: addOn.id })),
                    } as ActionItem<AddOnItemFragment>,
                  ]
                : []),
              ...(hasPermissions(['addonsDelete'])
                ? [
                    {
                      startIcon: 'trash',
                      title: translate('text_629728388c4d2300e2d38182'),
                      onAction: () =>
                        deleteDialogRef.current?.openDialog({
                          addOn,
                          callback: () => {
                            navigate(ADD_ONS_ROUTE)
                          },
                        }),
                    } as ActionItem<AddOnItemFragment>,
                  ]
                : []),
            ]
          }}
          placeholder={{
            errorState: !!variables?.searchTerm
              ? {
                  title: translate('text_623b53fea66c76017eaebb6e'),
                  subtitle: translate('text_63bab307a61c62af497e0599'),
                }
              : {
                  title: translate('text_629728388c4d2300e2d380d5'),
                  subtitle: translate('text_629728388c4d2300e2d380eb'),
                  buttonTitle: translate('text_629728388c4d2300e2d38110'),
                  buttonVariant: 'primary',
                  buttonAction: () => location.reload(),
                },

            emptyState: !!variables?.searchTerm
              ? {
                  title: translate('text_63bee4e10e2d53912bfe4da5'),
                  subtitle: translate('text_63bee4e10e2d53912bfe4da7'),
                }
              : hasPermissions(['addonsCreate'])
                ? {
                    title: translate('text_629728388c4d2300e2d380c9'),
                    subtitle: translate('text_629728388c4d2300e2d380df'),
                    buttonTitle: translate('text_629728388c4d2300e2d3810f'),
                    buttonVariant: 'primary',
                    buttonAction: () => navigate(CREATE_ADD_ON_ROUTE),
                  }
                : {
                    title: translate('text_664de6f0ec798e005a110d19'),
                    subtitle: translate('text_629728388c4d2300e2d380df'),
                  },
          }}
        />
      </InfiniteScroll>

      <DeleteAddOnDialog ref={deleteDialogRef} />
    </>
  )
}

export default AddOnsList
