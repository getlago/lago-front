import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Chip, Table, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import {
  DefaultCustomSectionDialog,
  DefaultCustomSectionDialogRef,
} from '~/components/settings/invoices/DefaultCustomSectionDialog'
import {
  DeleteCustomSectionDialog,
  DeleteCustomSectionDialogRef,
} from '~/components/settings/invoices/DeleteCustomSectionDialog'
import { addToast } from '~/core/apolloClient'
import { CREATE_INVOICE_CUSTOM_SECTION, EDIT_INVOICE_CUSTOM_SECTION } from '~/core/router'
import {
  DeleteCustomSectionFragmentDoc,
  useGetOrganizationSettingsInvoiceSectionsQuery,
  useUpdateInvoiceCustomSectionMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'
import { tw } from '~/styles/utils'

gql`
  query getOrganizationSettingsInvoiceSections {
    invoiceCustomSections {
      collection {
        id
        name
        code
        selected

        ...DeleteCustomSection
      }
    }
  }

  mutation updateInvoiceCustomSectionSelection($input: UpdateInvoiceCustomSectionInput!) {
    updateInvoiceCustomSection(input: $input) {
      id
      selected
    }
  }

  ${DeleteCustomSectionFragmentDoc}
`

const InvoiceSections = () => {
  const { translate } = useInternationalization()
  const { hasPermissions } = usePermissions()
  const navigate = useNavigate()
  const defaultCustomSectionDialogRef = useRef<DefaultCustomSectionDialogRef>(null)
  const deleteCustomSectionDialogRef = useRef<DeleteCustomSectionDialogRef>(null)

  const { data, error, loading } = useGetOrganizationSettingsInvoiceSectionsQuery()
  const canEditInvoiceSettings = hasPermissions(['organizationInvoicesUpdate'])

  const hasCustomSections = !!data?.invoiceCustomSections?.collection?.length

  const [updateCustomSection] = useUpdateInvoiceCustomSectionMutation({
    refetchQueries: ['getOrganizationSettingsInvoiceSections'],
    onCompleted: ({ updateInvoiceCustomSection }) => {
      if (!updateInvoiceCustomSection) {
        return
      }

      if (updateInvoiceCustomSection.selected) {
        addToast({
          severity: 'success',
          message: translate('text_1733849149914btq7cvs7ljb'),
        })
      } else {
        addToast({
          severity: 'success',
          message: translate('text_17338491499140e4tci0yhhe'),
        })
      }
    },
  })

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_17422301910287loq9tstmnk')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_17422301910287loq9tstmnk')}</Typography>
          <Typography>{translate('text_1732553358445p7rg0i0dzws')}</Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {!!loading && <SettingsListItemLoadingSkeleton count={6} />}

          {!loading && (
            <>
              {/* Custom section */}
              <SettingsListItem className={tw({ 'shadow-inherit': hasCustomSections })}>
                <SettingsListItemHeader
                  label={translate('text_174223019102916wv632jh62')}
                  sublabel={translate('text_17422301910293sbjvqbbq2i')}
                  action={
                    <Button
                      variant="quaternary"
                      disabled={!canEditInvoiceSettings}
                      onClick={() => navigate(CREATE_INVOICE_CUSTOM_SECTION)}
                    >
                      {translate('text_1742230191029lznwj3y41nb')}
                    </Button>
                  }
                />

                {hasCustomSections && (
                  <Table
                    name="invoice-custom-section"
                    containerSize={{ default: 0 }}
                    data={data.invoiceCustomSections?.collection || []}
                    columns={[
                      {
                        key: 'name',
                        title: translate('text_6419c64eace749372fc72b0f'),
                        content: (section) => (
                          <Typography variant="body" color="textSecondary">
                            {section.name}
                          </Typography>
                        ),
                        maxSpace: true,
                      },
                      {
                        key: 'selected',
                        title: translate('text_63ac86d797f728a87b2f9fa7'),
                        content: (section) =>
                          section.selected && (
                            <Chip label={translate('text_65281f686a80b400c8e2f6d1')} />
                          ),
                        minWidth: 96,
                      },
                    ]}
                    actionColumnTooltip={() => translate('text_17326382475765mx3dfl4v6t')}
                    actionColumn={(section) => [
                      {
                        startIcon: 'pen',
                        title: translate('text_1732638001460kne05vskb7e'),
                        onAction: () =>
                          navigate(
                            generatePath(EDIT_INVOICE_CUSTOM_SECTION, { sectionId: section.id }),
                          ),
                      },
                      section.selected
                        ? {
                            startIcon: 'star-outlined-hidden',
                            title: translate('text_1728574726495j7n9zqj7o71'),
                            onAction: () =>
                              defaultCustomSectionDialogRef.current?.openDialog({
                                type: 'removeDefault',
                                onConfirm: () =>
                                  updateCustomSection({
                                    variables: {
                                      input: {
                                        id: section.id,
                                        selected: false,
                                      },
                                    },
                                  }),
                              }),
                          }
                        : {
                            startIcon: 'star-filled',
                            title: translate('text_1728574726495n9jdse2hnrf'),
                            onAction: () =>
                              defaultCustomSectionDialogRef.current?.openDialog({
                                type: 'setDefault',
                                onConfirm: () =>
                                  updateCustomSection({
                                    variables: {
                                      input: {
                                        id: section.id,
                                        selected: true,
                                      },
                                    },
                                  }),
                              }),
                          },
                      {
                        startIcon: 'trash',
                        title: translate('text_1732638001460kdzkctjfegi'),
                        onAction: () =>
                          deleteCustomSectionDialogRef.current?.openDialog({
                            id: section.id,
                          }),
                      },
                    ]}
                  />
                )}
              </SettingsListItem>
            </>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      <DefaultCustomSectionDialog ref={defaultCustomSectionDialogRef} />
      <DeleteCustomSectionDialog ref={deleteCustomSectionDialogRef} />
    </>
  )
}

export default InvoiceSections
