import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { WarningDialogRef } from '~/components/WarningDialog'
import { addToast } from '~/core/apolloClient'
import {
  MappableTypeEnum,
  MappingTypeEnum,
  useCreateNetsuiteIntegrationCollectionMappingMutation,
  useCreateNetsuiteIntegrationMappingMutation,
  useDeleteNetsuiteIntegrationCollectionMappingMutation,
  useDeleteNetsuiteIntegrationMappingMutation,
  useUpdateNetsuiteIntegrationCollectionMappingMutation,
  useUpdateNetsuiteIntegrationMappingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment NetsuiteIntegrationMapItemDialogCollectionMappingItem on CollectionMapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  fragment NetsuiteIntegrationMapItemDialogCollectionItem on Mapping {
    id
    externalId
    externalName
    externalAccountCode
  }

  # Mapping Creation
  mutation createNetsuiteIntegrationCollectionMapping(
    $input: CreateIntegrationCollectionMappingInput!
  ) {
    createIntegrationCollectionMapping(input: $input) {
      id
      ...NetsuiteIntegrationMapItemDialogCollectionMappingItem
    }
  }

  mutation createNetsuiteIntegrationMapping($input: CreateIntegrationMappingInput!) {
    createIntegrationMapping(input: $input) {
      id
      ...NetsuiteIntegrationMapItemDialogCollectionItem
    }
  }

  # Mapping edition
  mutation updateNetsuiteIntegrationCollectionMapping(
    $input: UpdateIntegrationCollectionMappingInput!
  ) {
    updateIntegrationCollectionMapping(input: $input) {
      id
    }
  }

  mutation updateNetsuiteIntegrationMapping($input: UpdateIntegrationMappingInput!) {
    updateIntegrationMapping(input: $input) {
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

type TNetsuiteIntegrationMapItemDialogProps = {
  type: MappingTypeEnum | MappableTypeEnum
  integrationId: string
  itemId?: string
  itemExternalId?: string
  itemExternalName?: string
  itemExternalCode?: string
  lagoMappableId?: string
  lagoMappableName?: string
  taxCode?: string | null
  taxNexus?: string | null
  taxType?: string | null
}

type FormValuesType = {
  taxCode: string
  taxNexus: string
  taxType: string
  externalId: string
  externalName: string
  externalAccountCode: string
}

export interface NetsuiteIntegrationMapItemDialogRef {
  openDialog: (props: TNetsuiteIntegrationMapItemDialogProps) => unknown
  closeDialog: () => unknown
}

export const NetsuiteIntegrationMapItemDialog = forwardRef<NetsuiteIntegrationMapItemDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<WarningDialogRef>(null)
    const [localData, setLocalData] = useState<TNetsuiteIntegrationMapItemDialogProps | undefined>(
      undefined,
    )
    const isTaxContext = localData?.type === MappingTypeEnum.Tax
    const isCollectionContext = !Object.values(MappableTypeEnum).includes(
      localData?.type as MappableTypeEnum,
    )
    const refetchQueries = useMemo(() => {
      if (localData?.type === MappableTypeEnum.AddOn) return ['getAddOnsForNetsuiteItemsList']

      if (localData?.type === MappableTypeEnum.BillableMetric) {
        return ['getBillableMetricsForNetsuiteItemsList']
      }

      return ['getNetsuiteIntegrationCollectionMappings']
    }, [localData?.type])

    // Mapping Creation
    const [createCollectionMapping] = useCreateNetsuiteIntegrationCollectionMappingMutation({
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
    const [createMapping] = useCreateNetsuiteIntegrationMappingMutation({
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
    const [updateCollectionMapping] = useUpdateNetsuiteIntegrationCollectionMappingMutation({
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
    const [updateMapping] = useUpdateNetsuiteIntegrationMappingMutation({
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

    const formikProps = useFormik<FormValuesType>({
      initialValues: {
        taxCode: localData?.taxCode || '',
        taxNexus: localData?.taxNexus || '',
        taxType: localData?.taxType || '',
        externalId: localData?.itemExternalId || '',
        externalName: localData?.itemExternalName || '',
        externalAccountCode: localData?.itemExternalCode || '',
      },
      validate(values) {
        // For delete action, form needs to be empty but valid
        if (Object.values(values).filter((v) => !!v).length === 0) {
          return {}
        }

        if (isTaxContext && (!values.taxCode || !values.taxNexus || !values.taxType)) {
          return { error: 'Fill in all inputs' }
        }

        if (
          !isTaxContext &&
          (!values.externalId || !values.externalName || !values.externalAccountCode)
        ) {
          return { error: 'Fill in all inputs' }
        }

        return {}
      },
      validationSchema: object().shape({
        taxCode: string(),
        taxNexus: string(),
        taxType: string(),
        externalId: string(),
        externalName: string(),
        externalAccountCode: string(),
      }),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values) => {
        const hasTaxItemValues = !!values.taxCode && !!values.taxNexus && !!values.taxType
        const hasItemValues =
          !!values.externalId && !!values.externalName && !!values.externalAccountCode
        const hasInitialDatas =
          !!localData?.itemExternalId ||
          (!!localData?.taxCode && !!localData?.taxNexus && !!localData?.taxType)
        const hasInputDatas = hasItemValues || hasTaxItemValues
        const isCreate = !localData?.itemId
        const isEdit = !isCreate && hasInitialDatas && hasInputDatas
        const isDelete = !isCreate && !isEdit && (!hasItemValues || !hasTaxItemValues)

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
                  externalId: values.externalId,
                  externalAccountCode: values.externalAccountCode,
                  externalName: values.externalName,
                  integrationId: localData?.integrationId as string,
                  mappingType: localData?.type as MappingTypeEnum,
                  taxCode: isTaxContext ? values.taxCode : undefined,
                  taxNexus: isTaxContext ? values.taxNexus : undefined,
                  taxType: isTaxContext ? values.taxType : undefined,
                },
              },
            })
          } else {
            answer = await createMapping({
              variables: {
                input: {
                  externalId: values.externalId,
                  externalAccountCode: values.externalAccountCode,
                  externalName: values.externalName,
                  integrationId: localData?.integrationId as string,
                  mappableType: localData?.type as MappableTypeEnum,
                  mappableId: localData?.lagoMappableId as string,
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
                  externalId: values.externalId,
                  externalAccountCode: values.externalAccountCode,
                  externalName: values.externalName,
                  integrationId: localData?.integrationId as string,
                  mappingType: localData?.type as unknown as MappingTypeEnum,
                  taxCode: isTaxContext ? values.taxCode : undefined,
                  taxNexus: isTaxContext ? values.taxNexus : undefined,
                  taxType: isTaxContext ? values.taxType : undefined,
                },
              },
            })
          } else {
            answer = await updateMapping({
              variables: {
                input: {
                  id: localData?.itemId as string,
                  externalId: values.externalId,
                  externalAccountCode: values.externalAccountCode,
                  externalName: values.externalName,
                  integrationId: localData?.integrationId as string,
                  mappableType: localData?.type as unknown as MappableTypeEnum,
                  mappableId: localData?.lagoMappableId as string,
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
        case MappingTypeEnum.Coupon:
          return [
            translate('text_6630e57386f8a700a3318cc8', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6630e57386f8a700a3318cc9', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappingTypeEnum.CreditNote:
          return [
            translate('text_66461b36b4b38c006e8b5067', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_66461b36b4b38c006e8b5068', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappingTypeEnum.FallbackItem:
          return [
            translate('text_6630e51df0a194013daea61f'),
            translate('text_6630e51df0a194013daea620', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappingTypeEnum.MinimumCommitment:
          return [
            translate('text_6668821d94e4da4dfd8b3822', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6668821d94e4da4dfd8b382e', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappingTypeEnum.PrepaidCredit:
          return [
            translate('text_6668821d94e4da4dfd8b3884', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6668821d94e4da4dfd8b389a', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappingTypeEnum.Tax:
          return [
            translate('text_6630e560a830417bd3b119fb', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6630e560a830417bd3b119fc', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappingTypeEnum.SubscriptionFee:
          return [
            translate('text_666886c73a2ea34eb2aa3e33', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_666886c73a2ea34eb2aa3e34', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappableTypeEnum.AddOn:
          return [
            translate('text_6668821d94e4da4dfd8b3820', {
              addOnName: localData?.lagoMappableName,
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6668821d94e4da4dfd8b382c', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappableTypeEnum.BillableMetric:
          return [
            translate('text_6668821d94e4da4dfd8b3824', {
              billableMetricName: localData?.lagoMappableName,
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6668821d94e4da4dfd8b3830', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
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
          {isTaxContext ? (
            <>
              <TextInputField
                name="taxNexus"
                autoComplete="off"
                label={translate('text_172727145621913rzc8t0twl')}
                placeholder={translate('text_17272714562195xp5rofbulp')}
                formikProps={formikProps}
                error={undefined}
              />

              <TextInputField
                name="taxType"
                autoComplete="off"
                label={translate('text_1727271456219atwdpxysccc')}
                placeholder={translate('text_1727271456219tl2bt8qdevm')}
                formikProps={formikProps}
                error={undefined}
              />

              <TextInputField
                name="taxCode"
                autoComplete="off"
                label={translate('text_1727271456220dvb59po0x1g')}
                placeholder={translate('text_1727271456220u56zdq1mfrn')}
                formikProps={formikProps}
                error={undefined}
              />
            </>
          ) : (
            <>
              <TextInputField
                name="externalName"
                autoComplete="off"
                label={translate('text_1730738987881evzsfqnn1tr')}
                placeholder={translate('text_1730738987882hhl5gijws0m')}
                formikProps={formikProps}
                error={undefined}
              />

              <TextInputField
                name="externalId"
                autoComplete="off"
                label={translate('text_17307389878820u8ldpctozo')}
                placeholder={translate('text_173073898788226ev6fudddk')}
                formikProps={formikProps}
                error={undefined}
              />

              <TextInputField
                name="externalAccountCode"
                autoComplete="off"
                label={translate('text_1730738987882c15jo2dyc9f')}
                placeholder={translate('text_1730738987882h2yy21a82k2')}
                formikProps={formikProps}
                error={undefined}
              />
            </>
          )}
        </div>
      </Dialog>
    )
  },
)

NetsuiteIntegrationMapItemDialog.displayName = 'NetsuiteIntegrationMapItemDialog'
