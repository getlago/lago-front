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
  NetsuiteMappableTypeEnum,
  NetsuiteMappingTypeEnum,
  useCreateNetsuiteIntegrationCollectionMappingMutation,
  useCreateNetsuiteIntegrationMappingMutation,
  useDeleteNetsuiteIntegrationCollectionMappingMutation,
  useDeleteNetsuiteIntegrationMappingMutation,
  useGetIntegrationItemsLazyQuery,
  useTriggerIntegrationItemsRefetchMutation,
  useTriggerIntegrationTaxItemsRefetchMutation,
  useUpdateNetsuiteIntegrationCollectionMappingMutation,
  useUpdateNetsuiteIntegrationMappingMutation,
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
  fragment NetsuiteMapItemDialogItem on IntegrationItem {
    id
    externalId
    externalName
    externalAccountCode
    itemType
  }

  fragment NetsuiteMapItemDialogCollectionMappingItem on NetsuiteCollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment NetsuiteMapItemDialogCollectionItem on NetsuiteMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Item fetch
  query getIntegrationItems(
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
        ...NetsuiteMapItemDialogItem
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  mutation triggerIntegrationItemsRefetch($input: FetchIntegrationItemsInput!) {
    fetchIntegrationItems(input: $input) {
      collection {
        ...NetsuiteMapItemDialogItem
      }
    }
  }

  mutation triggerIntegrationTaxItemsRefetch($input: FetchIntegrationTaxItemsInput!) {
    fetchIntegrationTaxItems(input: $input) {
      collection {
        ...NetsuiteMapItemDialogItem
      }
    }
  }

  # Mapping Creation
  mutation createNetsuiteIntegrationCollectionMapping(
    $input: CreateNetsuiteIntegrationCollectionMappingInput!
  ) {
    createNetsuiteIntegrationCollectionMapping(input: $input) {
      id
      ...NetsuiteMapItemDialogCollectionMappingItem
    }
  }

  mutation createNetsuiteIntegrationMapping($input: CreateNetsuiteIntegrationMappingInput!) {
    createNetsuiteIntegrationMapping(input: $input) {
      id
      ...NetsuiteMapItemDialogCollectionItem
    }
  }

  # Mapping edition
  mutation updateNetsuiteIntegrationCollectionMapping(
    $input: UpdateNetsuiteIntegrationCollectionMappingInput!
  ) {
    updateNetsuiteIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateNetsuiteIntegrationMapping($input: UpdateNetsuiteIntegrationMappingInput!) {
    updateNetsuiteIntegrationMapping(input: $input) {
      id
    }
  }

  # Mapping deletion
  mutation deleteNetsuiteIntegrationCollectionMapping(
    $input: DestroyIntegrationCollectionMappingInput!
  ) {
    destroyIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation deleteNetsuiteIntegrationMapping($input: DestroyIntegrationMappingInput!) {
    destroyIntegrationMapping(input: $input) {
      id
    }
  }
`

type TNetsuiteMapItemDialogProps = {
  type: NetsuiteMappingTypeEnum | NetsuiteMappableTypeEnum
  integrationId: string
  itemId?: string
  itemExternalId?: string
  itemExternalName?: string
  itemExternalCode?: string
  lagoMappableId?: string
}

export interface NetsuiteMapItemDialogRef {
  openDialog: (props: TNetsuiteMapItemDialogProps) => unknown
  closeDialog: () => unknown
}

export const NetsuiteMapItemDialog = forwardRef<NetsuiteMapItemDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<WarningDialogRef>(null)
  const [localData, setLocalData] = useState<TNetsuiteMapItemDialogProps | undefined>(undefined)
  const isTaxContext = localData?.type === NetsuiteMappingTypeEnum.Tax
  const isCollectionContext = !Object.values(NetsuiteMappableTypeEnum).includes(
    localData?.type as NetsuiteMappableTypeEnum,
  )
  const refetchQueries =
    localData?.type === NetsuiteMappableTypeEnum.AddOn
      ? ['getAddOnsForNetsuiteItemsList']
      : localData?.type === NetsuiteMappableTypeEnum.BillableMetric
        ? ['getBillableMetricsForNetsuiteItemsList']
        : ['getNetsuiteCollectionMappings']

  // Item fetch
  const [getIntegrationItems, { loading: initialItemFetchLoading, data: initialItemFetchData }] =
    useGetIntegrationItemsLazyQuery({
      variables: {
        limit: 50,
        integrationId: localData?.integrationId as string,
        itemType:
          localData?.type === NetsuiteMappingTypeEnum.Tax
            ? IntegrationItemTypeEnum.Tax
            : IntegrationItemTypeEnum.Standard,
      },
    })
  const [triggerItemRefetch, { loading: itemsLoading }] = useTriggerIntegrationItemsRefetchMutation(
    {
      variables: { input: { integrationId: localData?.integrationId as string } },
      refetchQueries: ['getIntegrationItems'],
    },
  )
  const [triggerTaxItemRefetch, { loading: taxItemsLoading }] =
    useTriggerIntegrationTaxItemsRefetchMutation({
      variables: { input: { integrationId: localData?.integrationId as string } },
      refetchQueries: ['getIntegrationItems'],
    })

  // Mapping Creation
  const [createCollectionMapping] = useCreateNetsuiteIntegrationCollectionMappingMutation({
    onCompleted(data) {
      if (data && data.createNetsuiteIntegrationCollectionMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190643'),
          severity: 'success',
        })
      }
    },
    refetchQueries,
  })
  const [createMapping] = useCreateNetsuiteIntegrationMappingMutation({
    onCompleted(data) {
      if (data && data.createNetsuiteIntegrationMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190643'),
          severity: 'success',
        })
      }
    },
    refetchQueries,
  })

  // Mapping edition
  const [updateCollectionMapping] = useUpdateNetsuiteIntegrationCollectionMappingMutation({
    onCompleted(data) {
      if (data && data.updateNetsuiteIntegrationCollectionMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190641'),
          severity: 'success',
        })
      }
    },
    refetchQueries,
  })
  const [updateMapping] = useUpdateNetsuiteIntegrationMappingMutation({
    onCompleted(data) {
      if (data && data.updateNetsuiteIntegrationMapping?.id) {
        addToast({
          message: translate('text_6630e5923500e7015f190641'),
          severity: 'success',
        })
      }
    },
    refetchQueries,
  })

  // Mapping deletion
  const [deleteCollectionMapping] = useDeleteNetsuiteIntegrationCollectionMappingMutation({
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
  const [deleteMapping] = useDeleteNetsuiteIntegrationMappingMutation({
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
      selectedElementValue:
        !!localData?.itemExternalId &&
        !!localData?.itemExternalName &&
        !!localData?.itemExternalCode
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
                mappingType: localData?.type as NetsuiteMappingTypeEnum,
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
                mappableType: localData?.type as NetsuiteMappableTypeEnum,
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
                mappingType: localData?.type as unknown as NetsuiteMappingTypeEnum,
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
                mappableType: localData?.type as unknown as NetsuiteMappableTypeEnum,
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
      const { externalId, externalName, externalAccountCode, itemType } = item

      return {
        label: `${externalId} - ${externalName}`,
        labelNode: (
          <Item>
            <Typography variant="body" color="grey700" noWrap>
              {externalId}&nbsp;-&nbsp;{externalName}
            </Typography>
            {itemType === IntegrationItemTypeEnum.Standard && (
              <>
                &nbsp;
                <Typography variant="body" color="grey600" noWrap>
                  {translate('text_6630e52a04d25adb0300f034', {
                    accountCode: externalAccountCode,
                  })}
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
  }, [initialItemFetchData?.integrationItems?.collection, translate])

  const [title, description] = useMemo(() => {
    switch (localData?.type) {
      case NetsuiteMappingTypeEnum.Coupon:
        return [
          translate('text_6630e57386f8a700a3318cc8'),
          translate('text_6630e57386f8a700a3318cc9'),
        ]
      case MappingTypeEnum.CreditNote:
        return [
          translate('text_66461b36b4b38c006e8b5067'),
          translate('text_66461b36b4b38c006e8b5068'),
        ]
      case MappingTypeEnum.FallbackItem:
        return [
          translate('text_6630e51df0a194013daea61f'),
          translate('text_6630e51df0a194013daea620'),
        ]
      case NetsuiteMappingTypeEnum.MinimumCommitment:
        return [
          translate('text_6630e5923500e7015f1905d8'),
          translate('text_6630e5923500e7015f1905dc'),
        ]
      case NetsuiteMappingTypeEnum.PrepaidCredit:
        return [
          translate('text_6630e5923500e7015f19061e'),
          translate('text_6630e5923500e7015f190624'),
        ]
      case NetsuiteMappingTypeEnum.Tax:
        return [
          translate('text_6630e560a830417bd3b119fb'),
          translate('text_6630e560a830417bd3b119fc'),
        ]
      case NetsuiteMappingTypeEnum.SubscriptionFee:
        return [
          translate('text_6630e5923500e7015f1905dd'),
          translate('text_6630e5923500e7015f1905e7'),
        ]
      case NetsuiteMappableTypeEnum.AddOn:
        return [
          translate('text_6630e5923500e7015f1905b9', {
            addOnName: localData?.itemExternalName,
          }),
          translate('text_6630e5923500e7015f1905bd'),
        ]
      case NetsuiteMappableTypeEnum.BillableMetric:
        return [
          translate('text_6630e5923500e7015f1905bf', {
            billableMetricName: localData?.itemExternalName,
          }),
          translate('text_6630e5923500e7015f1905c3'),
        ]
      default:
        return ['', '']
    }
  }, [localData?.itemExternalName, localData?.type, translate])

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
          getIntegrationItems()
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
            name="selectedBillableMetric"
            value={formikProps.values.selectedElementValue}
            data={comboboxData}
            loading={isLoading}
            label={translate('text_6630e51df0a194013daea621')}
            placeholder={translate('text_6630e51df0a194013daea622')}
            helperText={
              !isLoading && !comboboxData.length
                ? translate('text_6630ec823adac97d3bf0fb4b')
                : undefined
            }
            searchQuery={getIntegrationItems as unknown as ComboBoxProps['searchQuery']}
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
})

NetsuiteMapItemDialog.displayName = 'NetsuiteMapItemDialog'

const Container = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InlineElements = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  > *:first-child {
    flex: 1;
  }

  > *:last-child {
    margin-top: ${theme.spacing(6)};
  }
`
