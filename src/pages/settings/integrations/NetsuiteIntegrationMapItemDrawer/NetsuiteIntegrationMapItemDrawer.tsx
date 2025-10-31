import { useFormik } from 'formik'
import { Typography } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { array, object, string } from 'yup'

import { Button, Drawer, DrawerRef } from '~/components/designSystem'
import { MappableTypeEnum, MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DEFAULT_MAPPING_KEY } from '~/pages/settings/integrations/common'
import { handleIntegrationMappingCUD } from '~/pages/settings/integrations/NetsuiteIntegrationMapItemDrawer/handleIntegrationMappingCUD'
import { useNetsuiteIntegrationMappingCUD } from '~/pages/settings/integrations/NetsuiteIntegrationMapItemDrawer/useNetsuiteIntegrationMappingCUD'

import { isDefaultMappingInMappableContext } from './isDefaultMappingInMappableContext'
import { isDefaultMappingInTaxContext } from './isDefaultMappingInTaxContext'
import NetsuiteIntegrationMapItemNonTaxContextForm from './NetsuiteIntegrationMapItemNonTaxContextForm'
import NetsuiteIntegrationMapItemTaxContextForm from './NetsuiteIntegrationMapItemTaxContextForm'
import type { FormValuesType, NetsuiteIntegrationMapItemDrawerProps } from './types'

export interface NetsuiteIntegrationMapItemDrawerRef {
  openDrawer: (props: NetsuiteIntegrationMapItemDrawerProps) => unknown
  closeDrawer: () => unknown
}

export const NetsuiteIntegrationMapItemDrawer = forwardRef<NetsuiteIntegrationMapItemDrawerRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<DrawerRef>(null)
    const [localData, setLocalData] = useState<NetsuiteIntegrationMapItemDrawerProps | undefined>(
      undefined,
    )
    const isTaxContext = localData?.type === MappingTypeEnum.Tax

    const {
      createCollectionMapping,
      createMapping,
      deleteCollectionMapping,
      deleteMapping,
      updateCollectionMapping,
      updateMapping,
    } = useNetsuiteIntegrationMappingCUD(localData?.type)

    const formikProps = useFormik<FormValuesType>({
      initialValues: {
        default: {
          taxCode: isDefaultMappingInTaxContext(localData)
            ? localData.itemMappings.default.taxCode || ''
            : '',
          taxNexus: isDefaultMappingInTaxContext(localData)
            ? localData.itemMappings.default.taxNexus || ''
            : '',
          taxType: isDefaultMappingInTaxContext(localData)
            ? localData.itemMappings.default.taxType || ''
            : '',
          externalId: localData?.itemMappings.default.itemExternalId || '',
          externalName: localData?.itemMappings.default.itemExternalName || '',
          externalAccountCode: localData?.itemMappings.default.itemExternalCode || '',
        },
      },
      validate(values) {
        // For delete action, form needs to be empty but valid
        if (Object.values(values).filter((v) => !!v).length === 0) {
          return {}
        }

        if (
          isTaxContext &&
          (!values.default.taxCode || !values.default.taxNexus || !values.default.taxType)
        ) {
          return { error: 'Fill in all inputs' }
        }

        if (
          !isTaxContext &&
          (!values.default.externalId ||
            !values.default.externalName ||
            !values.default.externalAccountCode)
        ) {
          return { error: 'Fill in all inputs' }
        }

        return {}
      },
      /**
       * This validates the pattern Record<string, Object>
       * More on this: https://github.com/jquense/yup/issues/524#issuecomment-530780947
       */
      validationSchema: array()
        .transform((_, orig) => Object.values(orig))
        .of(
          object().shape({
            taxCode: string(),
            taxNexus: string(),
            taxType: string(),
            externalId: string(),
            externalName: string(),
            externalAccountCode: string(),
          }),
        ),
      validateOnMount: true,
      enableReinitialize: true,
      onSubmit: async (values) => {
        if (!localData) return

        const promises = localData.billingEntities.map(async (billingEntity) => {
          const inputValues = values[billingEntity.key || DEFAULT_MAPPING_KEY]

          if (!inputValues) return

          const initialMapping = localData.itemMappings[billingEntity.key || DEFAULT_MAPPING_KEY]

          const formType = localData.type
          const integrationId = localData.integrationId

          return await handleIntegrationMappingCUD(
            inputValues,
            initialMapping,
            formType,
            integrationId,
            {
              createCollectionMapping,
              createMapping,
              deleteCollectionMapping,
              deleteMapping,
              updateCollectionMapping,
              updateMapping,
            },
            billingEntity,
          )
        })

        const answers = await Promise.all(promises)

        const hasErrors = answers.some((answer) => {
          // Happens when we don't even make a cal = no data setup in one of the form
          if (!answer) return false
          return !answer.success
        })

        if (!hasErrors) {
          drawerRef.current?.closeDrawer()
        }
      },
    })

    const [title, description] = useMemo(() => {
      if (!localData) return ['', '']

      switch (localData.type) {
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
              addOnName: isDefaultMappingInMappableContext(localData)
                ? localData.itemMappings.default.lagoMappableName
                : '',
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6668821d94e4da4dfd8b382c', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        case MappableTypeEnum.BillableMetric:
          return [
            translate('text_6668821d94e4da4dfd8b3824', {
              billableMetricName: isDefaultMappingInMappableContext(localData)
                ? localData.itemMappings.default.lagoMappableName
                : '',
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
            translate('text_6668821d94e4da4dfd8b3830', {
              integrationType: translate('text_661ff6e56ef7e1b7c542b239'),
            }),
          ]
        default:
          return ['', '']
      }
    }, [localData, translate])

    useImperativeHandle(ref, () => ({
      openDrawer: (props) => {
        setLocalData(props)
        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => drawerRef.current?.closeDrawer(),
    }))

    return (
      <Drawer
        ref={drawerRef}
        title={title}
        onClose={() => {
          formikProps.resetForm()
          formikProps.validateForm()
        }}
        stickyBottomBar={
          <div className="flex justify-end gap-3">
            <Button variant="quaternary" onClick={() => drawerRef.current?.closeDrawer()}>
              {translate('text_6244277fe0975300fe3fb94a')}
            </Button>
            <Button
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate('text_6630e51df0a194013daea624')}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-12">
          <div>
            <Typography variant="headline">{title}</Typography>
            <Typography>{description}</Typography>
          </div>
          <div className="mb-8 flex flex-col gap-6">
            {isTaxContext ? (
              <NetsuiteIntegrationMapItemTaxContextForm
                formikProps={formikProps}
                billingEntityKey={DEFAULT_MAPPING_KEY}
              />
            ) : (
              <NetsuiteIntegrationMapItemNonTaxContextForm
                formikProps={formikProps}
                billingEntityKey={DEFAULT_MAPPING_KEY}
              />
            )}
          </div>
        </div>
      </Drawer>
    )
  },
)

NetsuiteIntegrationMapItemDrawer.displayName = 'NetsuiteIntegrationMapItemDrawer'
