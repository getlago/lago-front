import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, Typography } from '~/components/designSystem'
import { ComboBox, ComboBoxProps } from '~/components/form'
import { Item } from '~/components/form/ComboBox/ComboBoxItem'
import { WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  IntegrationItemTypeEnum,
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateXeroIntegrationCollectionMappingMutation,
  useCreateXeroIntegrationMappingMutation,
  useDeleteXeroIntegrationCollectionMappingMutation,
  useDeleteXeroIntegrationMappingMutation,
  useGetXeroIntegrationItemsLazyQuery,
  useTriggerXeroIntegrationItemsRefetchMutation,
  useTriggerXeroIntegrationTaxItemsRefetchMutation,
  useUpdateXeroIntegrationCollectionMappingMutation,
  useUpdateXeroIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

const OPTION_VALUE_SEPARATOR = ':::'

const stringifyOptionValue = ({
  externalId,
  externalAccountCode,
  externalName,
}: {
  externalId: string
  externalAccountCode: string
  externalName: string
}) => {
  return `${externalId}${OPTION_VALUE_SEPARATOR}${externalAccountCode}${OPTION_VALUE_SEPARATOR}${externalName}`
}

const extractOptionValue = (optionValue: string) => {
  const [externalId, externalAccountCode, externalName] = optionValue.split(OPTION_VALUE_SEPARATOR)

  return { externalId, externalAccountCode, externalName }
}

gql`
  fragment XeroIntegrationMapItemDialog on IntegrationItem {
    id
    externalId
    externalName
    externalAccountCode
    itemType
  }

  fragment XeroIntegrationMapItemDialogCollectionMappingItem on CollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment XeroIntegrationMapItemDialogCollectionItem on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Item fetch
  query getXeroIntegrationItems(
    $integrationId: ID!
    $itemType: IntegrationItemTypeEnum
    $page: Int
    $limit: Int
    $searchTerm: String
  ) {
    integrationItems(
      integrationId: $integrationId
      itemType: $itemType
      page: $page
      limit: $limit
      searchTerm: $searchTerm
    ) {
      collection {
        ...XeroIntegrationMapItemDialog
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  mutation triggerXeroIntegrationItemsRefetch($input: FetchIntegrationItemsInput!) {
    fetchIntegrationItems(input: $input) {
      collection {
        ...XeroIntegrationMapItemDialog
      }
    }
  }

  mutation triggerXeroIntegrationTaxItemsRefetch($input: FetchIntegrationTaxItemsInput!) {
    fetchIntegrationTaxItems(input: $input) {
      collection {
        ...XeroIntegrationMapItemDialog
      }
    }
  }

  # Mapping Creation
  mutation createXeroIntegrationCollectionMapping(
    $input: CreateIntegrationCollectionMappingInput!
  ) {
    createIntegrationCollectionMapping(input: $input) {
      id
      ...XeroIntegrationMapItemDialogCollectionMappingItem
    }
  }

  mutation createXeroIntegrationMapping($input: CreateIntegrationMappingInput!) {
    createIntegrationMapping(input: $input) {
      id
      ...XeroIntegrationMapItemDialogCollectionItem
    }
  }

  # Mapping edition
  mutation updateXeroIntegrationCollectionMapping(
    $input: UpdateIntegrationCollectionMappingInput!
  ) {
    updateIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateXeroIntegrationMapping($input: UpdateIntegrationMappingInput!) {
    updateIntegrationMapping(input: $input) {
      id
    }
  }

  # Mapping deletion
  mutation deleteXeroIntegrationCollectionMapping(
    $input: DestroyIntegrationCollectionMappingInput!
  ) {
    destroyIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation deleteXeroIntegrationMapping($input: DestroyIntegrationMappingInput!) {
    destroyIntegrationMapping(input: $input) {
      id
    }
  }
`

type TXeroIntegrationMapItemDialogProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  itemId?: string
  itemExternalId?: string
  itemExternalName?: string
  itemExternalCode?: string
  lagoMappableId?: string
  lagoMappableName?: string
}

export interface XeroIntegrationMapItemDialogRef {
  openDialog: (props: TXeroIntegrationMapItemDialogProps) => unknown
  closeDialog: () => unknown
}

export const XeroIntegrationMapItemDialog = forwardRef<XeroIntegrationMapItemDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TXeroIntegrationMapItemDialogProps | undefined>(
      undefined,
    )
    const isTaxContext = localData?.type === MappingTypeEnum.Tax
    const isCollectionContext = !Object.values(MappableTypeEnum).includes(
      localData?.type as MappableTypeEnum,
    )
    const refetchQueries =
      localData?.type === MappableTypeEnum.AddOn
        ? ['getAddOnsForXeroItemsList']
        : localData?.type === MappableTypeEnum.BillableMetric
          ? ['getBillableMetricsForXeroItemsList']
          : ['getXeroIntegrationCollectionMappings']

    // Item fetch
    const [
      getXeroIntegrationItems,
      { loading: initialItemFetchLoading, data: initialItemFetchData },
    ] = useGetXeroIntegrationItemsLazyQuery({
      variables: {
        limit: 50,
        integrationId: localData?.integrationId as string,
        itemType:
          localData?.type === MappingTypeEnum.Tax
            ? IntegrationItemTypeEnum.Tax
            : IntegrationItemTypeEnum.Standard,
      },
    })
    const [triggerItemRefetch, { loading: itemsLoading }] =
      useTriggerXeroIntegrationItemsRefetchMutation({
        variables: { input: { integrationId: localData?.integrationId as string } },
        refetchQueries: ['getXeroIntegrationItems'],
      })
    const [triggerTaxItemRefetch, { loading: taxItemsLoading }] =
      useTriggerXeroIntegrationTaxItemsRefetchMutation({
        variables: { input: { integrationId: localData?.integrationId as string } },
        refetchQueries: ['getXeroIntegrationItems'],
      })

    // Mapping Creation
    const [createCollectionMapping] = useCreateXeroIntegrationCollectionMappingMutation({
      onCompleted(data) {
        if (data && data.createIntegrationCollectionMapping?.id) {
          addToast({
            message: translate('text_6630e5923500e7015f190643'),
            severity: 'success',
          })
        }
      },
      refetchQueries,
    })
    const [createMapping] = useCreateXeroIntegrationMappingMutation({
      onCompleted(data) {
        if (data && data.createIntegrationMapping?.id) {
          addToast({
            message: translate('text_6630e5923500e7015f190643'),
            severity: 'success',
          })
        }
      },
      refetchQueries,
    })

    // Mapping edition
    const [updateCollectionMapping] = useUpdateXeroIntegrationCollectionMappingMutation({
      onCompleted(data) {
        if (data && data.updateIntegrationCollectionMapping?.id) {
          addToast({
            message: translate('text_6630e5923500e7015f190641'),
            severity: 'success',
          })
        }
      },
      refetchQueries,
    })
    const [updateMapping] = useUpdateXeroIntegrationMappingMutation({
      onCompleted(data) {
        if (data && data.updateIntegrationMapping?.id) {
          addToast({
            message: translate('text_6630e5923500e7015f190641'),
            severity: 'success',
          })
        }
      },
      refetchQueries,
    })

    // Mapping deletion
    const [deleteCollectionMapping] = useDeleteXeroIntegrationCollectionMappingMutation({
      onCompleted(data) {
        if (data && data.destroyIntegrationCollectionMapping?.id) {
          addToast({
            message: translate('text_6630e5923500e7015f19063e'),
            severity: 'success',
          })
        }
      },
      refetchQueries,
    })
    const [deleteMapping] = useDeleteXeroIntegrationMappingMutation({
      onCompleted(data) {
        if (data && data.destroyIntegrationMapping?.id) {
          addToast({
            message: translate('text_6630e5923500e7015f19063e'),
            severity: 'success',
          })
        }
      },
      refetchQueries,
    })

    const formikProps = useFormik<{ selectedElementValue: string }>({
      initialValues: {
        selectedElementValue: localData?.itemExternalId
          ? stringifyOptionValue({
              externalId: localData?.itemExternalId || '',
              externalName: localData?.itemExternalName || '',
              externalAccountCode: localData?.itemExternalCode || '',
            })
          : '',
      },
      validationSchema: object().shape({
        selectedElementValue: string(),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async ({ selectedElementValue, ...values }) => {
        const isCreate = !localData?.itemExternalId
        const isEdit = !!localData?.itemExternalId
        const isDelete = !selectedElementValue

        const { externalAccountCode, externalId, externalName } =
          extractOptionValue(selectedElementValue)

        if (isDelete) {
          let answer

          if (isCollectionContext) {
            answer = await deleteCollectionMapping({
              variables: {
                input: {
                  id: localData?.itemId as string,
                },
              },
            })
          } else {
            answer = await deleteMapping({
              variables: {
                input: {
                  id: localData?.itemId as string,
                },
              },
            })
          }

          const { errors } = answer

          if (!errors?.length) {
            dialogRef?.current?.closeDialog()
          }
        } else if (isCreate) {
          let answer

          if (isCollectionContext) {
            answer = await createCollectionMapping({
              variables: {
                input: {
                  externalId,
                  externalAccountCode,
                  externalName,
                  integrationId: localData?.integrationId as string,
                  mappingType: localData?.type as MappingTypeEnum,
                  ...values,
                },
              },
            })
          } else {
            answer = await createMapping({
              variables: {
                input: {
                  externalId,
                  externalAccountCode,
                  externalName,
                  integrationId: localData?.integrationId as string,
                  mappableType: localData?.type as MappableTypeEnum,
                  mappableId: localData?.lagoMappableId as string,
                  ...values,
                },
              },
            })
          }

          const { errors } = answer

          if (!errors?.length) {
            dialogRef?.current?.closeDialog()
          }
        } else if (isEdit) {
          let answer

          if (isCollectionContext) {
            answer = await updateCollectionMapping({
              variables: {
                input: {
                  id: localData?.itemId as string,
                  externalId,
                  externalAccountCode,
                  externalName,
                  integrationId: localData?.integrationId as string,
                  mappingType: localData?.type as unknown as MappingTypeEnum,
                  ...values,
                },
              },
            })
          } else {
            answer = await updateMapping({
              variables: {
                input: {
                  id: localData?.itemId as string,
                  externalId,
                  externalAccountCode,
                  externalName,
                  integrationId: localData?.integrationId as string,
                  mappableType: localData?.type as unknown as MappableTypeEnum,
                  mappableId: localData?.lagoMappableId as string,
                  ...values,
                },
              },
            })
          }

          const { errors } = answer

          if (!errors?.length) {
            dialogRef?.current?.closeDialog()
          }
        }
      },
    })

    const isLoading = initialItemFetchLoading || itemsLoading || taxItemsLoading

    const comboboxData = useMemo(() => {
      return (initialItemFetchData?.integrationItems?.collection || []).map((item) => {
        const { externalId, externalName, externalAccountCode } = item

        return {
          label:
            localData?.type === MappingTypeEnum.Account
              ? `${externalId} - ${externalName} - ${externalAccountCode}`
              : `${externalName} (${externalAccountCode})`,
          description: '', // TODO: would be great to have the description fitting the item option
          labelNode: (
            <Item>
              <Typography variant="body" color="grey700" noWrap>
                {localData?.type === MappingTypeEnum.Account
                  ? `${externalId} - ${externalName} - ${externalAccountCode}`
                  : `${externalName}`}
              </Typography>
              {localData?.type !== MappingTypeEnum.Account && (
                <>
                  &nbsp;
                  <Typography variant="body" color="grey600" noWrap>
                    ({externalAccountCode})
                  </Typography>
                </>
              )}
            </Item>
          ),
          value: stringifyOptionValue({
            externalId,
            externalName: externalName || '',
            externalAccountCode: externalAccountCode || '',
          }),
        }
      })
    }, [initialItemFetchData?.integrationItems?.collection, localData?.type])

    const [title, description] = useMemo(() => {
      switch (localData?.type) {
        case MappingTypeEnum.Coupon:
          return [
            translate('text_6630e57386f8a700a3318cc8', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_6630e57386f8a700a3318cc9', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.CreditNote:
          return [
            translate('text_66461b36b4b38c006e8b5067', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_66461b36b4b38c006e8b5068', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.FallbackItem:
          return [
            translate('text_6630e51df0a194013daea61f'),
            translate('text_6668821d94e4da4dfd8b3890', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.MinimumCommitment:
          return [
            translate('text_6668821d94e4da4dfd8b3822', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_6668821d94e4da4dfd8b382e', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.PrepaidCredit:
          return [
            translate('text_6668821d94e4da4dfd8b3884', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_6668821d94e4da4dfd8b389a', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.Tax:
          return [
            translate('text_6630e560a830417bd3b119fb', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_6630e560a830417bd3b119fc', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.SubscriptionFee:
          return [
            translate('text_666886c73a2ea34eb2aa3e33', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_666886c73a2ea34eb2aa3e34', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappingTypeEnum.Account:
          return [
            translate('text_6672ebb8b1b50be550ecca50', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
            translate('text_6672ebb8b1b50be550ecca58', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappableTypeEnum.AddOn:
          return [
            translate('text_6668821d94e4da4dfd8b3820', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
              addOnName: localData?.lagoMappableName,
            }),
            translate('text_6668821d94e4da4dfd8b382c', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        case MappableTypeEnum.BillableMetric:
          return [
            translate('text_6668821d94e4da4dfd8b3824', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
              billableMetricName: localData?.lagoMappableName,
            }),
            translate('text_6668821d94e4da4dfd8b3830', {
              integrationType: translate('text_6672ebb8b1b50be550eccaf8'),
            }),
          ]
        default:
          return ['', '']
      }
    }, [localData?.lagoMappableName, localData?.type, translate])

    useImperativeHandle(ref, () => ({
      openDialog: (props) => {
        setLocalData(props)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => dialogRef.current?.closeDialog(),
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={title}
        description={description}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
        onOpen={() => {
          // Have to delay the ececution of the query, as the dialog props are not present immediatly after the dialog is opened
          setTimeout(() => {
            getXeroIntegrationItems()
          }, 1)
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate('text_6630e51df0a194013daea624')}
            </Button>
          </>
        )}
      >
        <Container>
          <InlineElements>
            <ComboBox
              value={formikProps.values.selectedElementValue}
              data={comboboxData}
              loading={isLoading}
              label={translate('text_6672ebb8b1b50be550eccb73')}
              placeholder={translate('text_6630e51df0a194013daea622')}
              helperText={
                !isLoading && !comboboxData.length
                  ? translate('text_6630ec823adac97d3bf0fb4b')
                  : undefined
              }
              searchQuery={getXeroIntegrationItems as unknown as ComboBoxProps['searchQuery']}
              onChange={(value) => {
                formikProps.setFieldValue('selectedElementValue', value)
              }}
              PopperProps={{ displayInDialog: true }}
            />

            <Button
              icon="reload"
              variant="quaternary"
              disabled={isLoading}
              loading={isLoading}
              onClick={() => {
                if (isTaxContext) {
                  triggerTaxItemRefetch()
                } else {
                  triggerItemRefetch()
                }
              }}
            />
          </InlineElements>
        </Container>
      </Dialog>
    )
  },
)

XeroIntegrationMapItemDialog.displayName = 'XeroIntegrationMapItemDialog'

const Container = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineElements = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }

  > *:last-child {
    margin-top: ${theme.spacing(7)};
  }
`
