import { useMemo, useState } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { ComboBox } from '~/components/form/ComboBox/ComboBox'
import { MultipleComboBox } from '~/components/form/MultipleComboBox/MultipleComboBox'
import { MultipleComboBoxData } from '~/components/form/MultipleComboBox/types'
import { TextInput } from '~/components/form/TextInput'
import { QuoteDetailItemFragment, useGetMembersForCreateQuoteQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getQuoteOrderTypeTranslationKey } from '../common/getQuoteOrderTypeTranslationKey'
import { useUpdateQuote } from '../hooks/useUpdateQuote'

export const EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID = 'edit-quote-aside-quote-type'
export const EDIT_QUOTE_ASIDE_OWNERS_COMBOBOX_TEST_ID = 'edit-quote-aside-owners'
export const EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID = 'edit-quote-aside-customer'
export const EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID = 'edit-quote-aside-subscription'

interface EditQuoteAsideProps {
  quote: QuoteDetailItemFragment | null | undefined
}

const EditQuoteAside = ({ quote }: EditQuoteAsideProps) => {
  const { translate } = useInternationalization()
  const { updateQuote } = useUpdateQuote()

  const { data: membersData, loading: membersLoading } = useGetMembersForCreateQuoteQuery({
    variables: { page: 1, limit: 100 },
  })

  const comboboxOwnersData = useMemo(() => {
    if (!membersData?.memberships?.collection) return []

    return membersData.memberships.collection
      .filter((membership) => !!membership.user.email)
      .map((membership) => ({
        label: membership.user.email as string,
        value: membership.user.id,
      }))
  }, [membersData?.memberships?.collection])

  const [selectedOwners, setSelectedOwners] = useState<MultipleComboBoxData[]>(() => {
    if (!quote?.owners) return []

    return quote.owners
      .filter((owner) => !!owner.email)
      .map((owner) => ({
        label: owner.email as string,
        value: owner.id,
      }))
  })

  const handleOwnersChange = (newOwners: MultipleComboBoxData[]) => {
    setSelectedOwners(newOwners)
    if (!quote) return
    updateQuote({
      id: quote.id,
      owners: newOwners.map((owner) => owner.value),
    })
  }

  if (!quote) return null

  return (
    <>
      <div className="flex flex-col gap-3 px-3 py-4">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1777540287773ez178bggf4h')}
        </Typography>
        <ComboBox
          data-test={EDIT_QUOTE_ASIDE_QUOTE_TYPE_COMBOBOX_TEST_ID}
          disabled
          label={translate('text_1776238919927x1y2z3a4b5c')}
          data={[
            {
              label: translate(getQuoteOrderTypeTranslationKey(quote.orderType)),
              value: quote.orderType,
            },
          ]}
          value={quote.orderType}
          onChange={() => {}}
        />
        <div data-test={EDIT_QUOTE_ASIDE_OWNERS_COMBOBOX_TEST_ID}>
          <MultipleComboBox
            label={translate('text_1776429591588dnpx1guz0cl')}
            placeholder={translate('text_1776429591588ale04shf9wf')}
            data={comboboxOwnersData}
            loading={membersLoading}
            value={selectedOwners}
            disableCloseOnSelect
            onChange={handleOwnersChange}
          />
        </div>
      </div>
      <hr className="border-grey-300" />
      <div className="flex flex-col gap-3 px-3 py-4">
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1777552621583netdlhbg5i7')}
        </Typography>
        <div data-test={EDIT_QUOTE_ASIDE_CUSTOMER_INPUT_TEST_ID}>
          <TextInput
            disabled
            label={translate('text_1776238919927l1m2n3o4p5q')}
            value={quote.customer.name ?? ''}
          />
        </div>
        {quote.subscription && (
          <div data-test={EDIT_QUOTE_ASIDE_SUBSCRIPTION_INPUT_TEST_ID}>
            <TextInput
              disabled
              label={translate('text_1776238919927d6e7f8g9h0i')}
              value={quote.subscription.name ?? quote.subscription.externalId}
            />
          </div>
        )}
      </div>
    </>
  )
}

export default EditQuoteAside
