import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { object } from 'yup'

import { Button, Dialog } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateAnrokIntegrationCollectionMappingMutation,
  useCreateAnrokIntegrationMappingMutation,
  useDeleteAnrokIntegrationCollectionMappingMutation,
  useDeleteAnrokIntegrationMappingMutation,
  useUpdateAnrokIntegrationCollectionMappingMutation,
  useUpdateAnrokIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment AnrokIntegrationMapItemDialog on IntegrationItem {
    id
    externalId
    externalName
    externalAccountCode
    itemType
  }

  fragment AnrokIntegrationMapItemDialogCollectionMappingItem on CollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment AnrokIntegrationMapItemDialogCollectionItem on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Mapping Creation
  mutation createAnrokIntegrationCollectionMapping(
    $input: CreateIntegrationCollectionMappingInput!
  ) {
    createIntegrationCollectionMapping(input: $input) {
      id
      ...AnrokIntegrationMapItemDialogCollectionMappingItem
    }
  }

  mutation createAnrokIntegrationMapping($input: CreateIntegrationMappingInput!) {
    createIntegrationMapping(input: $input) {
      id
      ...AnrokIntegrationMapItemDialogCollectionItem
    }
  }

  # Mapping edition
  mutation updateAnrokIntegrationCollectionMapping(
    $input: UpdateIntegrationCollectionMappingInput!
  ) {
    updateIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateAnrokIntegrationMapping($input: UpdateIntegrationMappingInput!) {
    updateIntegrationMapping(input: $input) {
      id
    }
  }

  # Mapping deletion
  mutation deleteAnrokIntegrationCollectionMapping(
    $input: DestroyIntegrationCollectionMappingInput!
  ) {
    destroyIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation deleteAnrokIntegrationMapping($input: DestroyIntegrationMappingInput!) {
    destroyIntegrationMapping(input: $input) {
      id
    }
  }
`

type TAnrokIntegrationMapItemDialogProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  itemId?: string
  itemExternalId?: string
  itemExternalName?: string
  lagoMappableId?: string
  lagoMappableName?: string
}

export interface AnrokIntegrationMapItemDialogRef {
  openDialog: (props: TAnrokIntegrationMapItemDialogProps) => unknown
  closeDialog: () => unknown
}

export const AnrokIntegrationMapItemDialog = forwardRef<AnrokIntegrationMapItemDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TAnrokIntegrationMapItemDialogProps | undefined>(
      undefined,
    )
    const isCollectionContext = !Object.values(MappableTypeEnum).includes(
      localData?.type as MappableTypeEnum,
    )
    const refetchQueries = useMemo(() => {
      if (localData?.type === MappableTypeEnum.AddOn) return ['getAddOnsForAnrokItemsList']

      if (localData?.type === MappableTypeEnum.BillableMetric) {
        return ['getBillableMetricsForAnrokItemsList']
      }

      return ['getAnrokIntegrationCollectionMappings']
    }, [localData?.type])

    // Mapping Creation
    const [createCollectionMapping] = useCreateAnrokIntegrationCollectionMappingMutation({
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
    const [createMapping] = useCreateAnrokIntegrationMappingMutation({
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
    const [updateCollectionMapping] = useUpdateAnrokIntegrationCollectionMappingMutation({
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
    const [updateMapping] = useUpdateAnrokIntegrationMappingMutation({
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
    const [deleteCollectionMapping] = useDeleteAnrokIntegrationCollectionMappingMutation({
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
    const [deleteMapping] = useDeleteAnrokIntegrationMappingMutation({
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

    const formikProps = useFormik({
      initialValues: {
        externalName: localData?.itemExternalName || '',
        externalId: localData?.itemExternalId || '',
      },
      validationSchema: object()
        .test({
          test: function (value: { externalName?: string; externalId?: string }) {
            // If code is not selected
            if (typeof value.externalName !== 'string' && typeof value.externalId !== 'string') {
              return false
            } else if (!value.externalName && !!value.externalId) {
              return false
            } else if (!!value.externalName && !value.externalId) {
              return false
            }

            return true
          },
        })
        .nullable(),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async ({ ...values }) => {
        const isCreate = !localData?.itemExternalId
        const isEdit = !!localData?.itemExternalId
        const isDelete =
          (typeof values.externalName !== 'string' && typeof values.externalId !== 'string') ||
          (!values.externalName && !values.externalId)

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

    const [title, description] = useMemo(() => {
      switch (localData?.type) {
        case MappingTypeEnum.FallbackItem:
          return [
            translate('text_6630e51df0a194013daea61f'),
            translate('text_6668821d94e4da4dfd8b3890', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
          ]
        case MappingTypeEnum.MinimumCommitment:
          return [
            translate('text_6668821d94e4da4dfd8b3822', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
            translate('text_6668821d94e4da4dfd8b382e', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
          ]
        case MappingTypeEnum.PrepaidCredit:
          return [
            translate('text_6668821d94e4da4dfd8b3884', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
            translate('text_6668821d94e4da4dfd8b389a', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
          ]
        case MappingTypeEnum.SubscriptionFee:
          return [
            translate('text_666886c73a2ea34eb2aa3e33', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
            translate('text_666886c73a2ea34eb2aa3e34', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
          ]
        case MappableTypeEnum.AddOn:
          return [
            translate('text_6668821d94e4da4dfd8b3820', {
              addOnName: localData?.lagoMappableName,
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
            translate('text_6668821d94e4da4dfd8b382c', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
          ]
        case MappableTypeEnum.BillableMetric:
          return [
            translate('text_6668821d94e4da4dfd8b3824', {
              billableMetricName: localData?.lagoMappableName,
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
            }),
            translate('text_6668821d94e4da4dfd8b3830', {
              integrationType: translate('text_6668821d94e4da4dfd8b3834'),
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
        <Stack gap={6} marginBottom={8}>
          <TextInputField
            label={translate('text_6668821d94e4da4dfd8b38a6')}
            placeholder={translate('text_6668821d94e4da4dfd8b38be')}
            name="externalName"
            formikProps={formikProps}
          />

          <TextInputField
            label={translate('text_6668821d94e4da4dfd8b38d3')}
            placeholder={translate('text_6668821d94e4da4dfd8b38e7')}
            name="externalId"
            formikProps={formikProps}
          />
        </Stack>
      </Dialog>
    )
  },
)

AnrokIntegrationMapItemDialog.displayName = 'AnrokIntegrationMapItemDialog'
