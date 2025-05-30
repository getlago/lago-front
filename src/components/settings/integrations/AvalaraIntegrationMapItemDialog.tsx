import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { object } from 'yup'

import { Button, Dialog, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import { AVALARA_TAX_CODE_DOCUMENTATION_URL } from '~/core/constants/externalUrls'
import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateAvalaraIntegrationCollectionMappingMutation,
  useCreateAvalaraIntegrationMappingMutation,
  useDeleteAvalaraIntegrationCollectionMappingMutation,
  useDeleteAvalaraIntegrationMappingMutation,
  useUpdateAvalaraIntegrationCollectionMappingMutation,
  useUpdateAvalaraIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment AvalaraIntegrationMapItemDialog on IntegrationItem {
    id
    externalId
    externalName
    externalAccountCode
    itemType
  }

  fragment AvalaraIntegrationMapItemDialogCollectionMappingItem on CollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment AvalaraIntegrationMapItemDialogCollectionItem on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Mapping Creation
  mutation createAvalaraIntegrationCollectionMapping(
    $input: CreateIntegrationCollectionMappingInput!
  ) {
    createIntegrationCollectionMapping(input: $input) {
      id
      ...AvalaraIntegrationMapItemDialogCollectionMappingItem
    }
  }

  mutation createAvalaraIntegrationMapping($input: CreateIntegrationMappingInput!) {
    createIntegrationMapping(input: $input) {
      id
      ...AvalaraIntegrationMapItemDialogCollectionItem
    }
  }

  # Mapping edition
  mutation updateAvalaraIntegrationCollectionMapping(
    $input: UpdateIntegrationCollectionMappingInput!
  ) {
    updateIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateAvalaraIntegrationMapping($input: UpdateIntegrationMappingInput!) {
    updateIntegrationMapping(input: $input) {
      id
    }
  }

  # Mapping deletion
  mutation deleteAvalaraIntegrationCollectionMapping(
    $input: DestroyIntegrationCollectionMappingInput!
  ) {
    destroyIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation deleteAvalaraIntegrationMapping($input: DestroyIntegrationMappingInput!) {
    destroyIntegrationMapping(input: $input) {
      id
    }
  }
`

type TAvalaraIntegrationMapItemDialogProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  itemId?: string
  itemExternalId?: string
  itemExternalName?: string
  lagoMappableId?: string
  lagoMappableName?: string
}

export interface AvalaraIntegrationMapItemDialogRef {
  openDialog: (props: TAvalaraIntegrationMapItemDialogProps) => unknown
  closeDialog: () => unknown
}

export const AvalaraIntegrationMapItemDialog = forwardRef<AvalaraIntegrationMapItemDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TAvalaraIntegrationMapItemDialogProps | undefined>(
      undefined,
    )
    const isCollectionContext = !Object.values(MappableTypeEnum).includes(
      localData?.type as MappableTypeEnum,
    )
    const refetchQueries =
      localData?.type === MappableTypeEnum.AddOn
        ? ['getAddOnsForAvalaraItemsList']
        : localData?.type === MappableTypeEnum.BillableMetric
          ? ['getBillableMetricsForAvalaraItemsList']
          : ['getAvalaraIntegrationCollectionMappings']

    // Mapping Creation
    const [createCollectionMapping] = useCreateAvalaraIntegrationCollectionMappingMutation({
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
    const [createMapping] = useCreateAvalaraIntegrationMappingMutation({
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
    const [updateCollectionMapping] = useUpdateAvalaraIntegrationCollectionMappingMutation({
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
    const [updateMapping] = useUpdateAvalaraIntegrationMappingMutation({
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
    const [deleteCollectionMapping] = useDeleteAvalaraIntegrationCollectionMappingMutation({
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
    const [deleteMapping] = useDeleteAvalaraIntegrationMappingMutation({
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
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
          ]
        case MappingTypeEnum.MinimumCommitment:
          return [
            translate('text_6668821d94e4da4dfd8b3822', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
            translate('text_6668821d94e4da4dfd8b382e', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
          ]
        case MappingTypeEnum.PrepaidCredit:
          return [
            translate('text_6668821d94e4da4dfd8b3884', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
            translate('text_6668821d94e4da4dfd8b389a', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
          ]
        case MappingTypeEnum.SubscriptionFee:
          return [
            translate('text_666886c73a2ea34eb2aa3e33', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
            translate('text_666886c73a2ea34eb2aa3e34', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
          ]
        case MappableTypeEnum.AddOn:
          return [
            translate('text_6668821d94e4da4dfd8b3820', {
              addOnName: localData?.lagoMappableName,
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
            translate('text_6668821d94e4da4dfd8b382c', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
          ]
        case MappableTypeEnum.BillableMetric:
          return [
            translate('text_6668821d94e4da4dfd8b3824', {
              billableMetricName: localData?.lagoMappableName,
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
            }),
            translate('text_6668821d94e4da4dfd8b3830', {
              integrationType: translate('text_1744293609277s53zn6jcoq4'),
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
        <div className="mb-8 flex flex-col gap-6">
          <TextInputField
            label={translate('text_1745416010613eidnh95dbs2')}
            placeholder={translate('text_17454159844152n3rimhvk4b')}
            name="externalName"
            formikProps={formikProps}
          />

          <div className="flex flex-col gap-1">
            <TextInputField
              label={translate('text_17454160106136tkffv4p4c3')}
              placeholder={translate('text_1745415984416mjvvaj4ahgp')}
              name="externalId"
              formikProps={formikProps}
            />

            <Typography
              variant="caption"
              color="grey600"
              html={translate('text_1748266296790rrag2rqt68c', {
                href: AVALARA_TAX_CODE_DOCUMENTATION_URL,
              })}
            />
          </div>
        </div>
      </Dialog>
    )
  },
)

AvalaraIntegrationMapItemDialog.displayName = 'AvalaraIntegrationMapItemDialog'
