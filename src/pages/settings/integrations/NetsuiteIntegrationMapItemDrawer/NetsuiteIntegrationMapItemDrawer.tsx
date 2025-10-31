import { Tab, Tabs } from '@mui/material'
import { FormikErrors, useFormik } from 'formik'
import { Typography } from 'lago-design-system'
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { array, object, string } from 'yup'

import { Button, Drawer, DrawerRef } from '~/components/designSystem'
import { MappingTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  BillingEntityForIntegrationMapping,
  DEFAULT_MAPPING_KEY,
} from '~/pages/settings/integrations/common'
import { handleIntegrationMappingCUD } from '~/pages/settings/integrations/NetsuiteIntegrationMapItemDrawer/handleIntegrationMappingCUD'
import { useNetsuiteIntegrationMappingCUD } from '~/pages/settings/integrations/NetsuiteIntegrationMapItemDrawer/useNetsuiteIntegrationMappingCUD'

import { isMappingInTaxContext } from './isMappingInTaxContext'
import NetsuiteIntegrationMapItemNonTaxContextForm from './NetsuiteIntegrationMapItemNonTaxContextForm'
import NetsuiteIntegrationMapItemTaxContextForm from './NetsuiteIntegrationMapItemTaxContextForm'
import type { FormValuesType, NetsuiteIntegrationMapItemDrawerProps } from './types'
import { useNetsuiteIntegrationTitleAndDescriptionMapping } from './useNetsuiteIntegrationTitleAndDescriptionMapping'

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

    const { getTitleAndDescription } = useNetsuiteIntegrationTitleAndDescriptionMapping()

    const {
      createCollectionMapping,
      createMapping,
      deleteCollectionMapping,
      deleteMapping,
      updateCollectionMapping,
      updateMapping,
    } = useNetsuiteIntegrationMappingCUD(localData?.type)

    const getFormInitialValues = (): FormValuesType => {
      const emptyValues = {
        taxCode: '',
        taxNexus: '',
        taxType: '',
        externalId: '',
        externalName: '',
        externalAccountCode: '',
      }

      if (!localData)
        return {
          default: emptyValues,
        }

      return localData.billingEntities.reduce(
        (acc: FormValuesType, billingEntity: BillingEntityForIntegrationMapping) => {
          const billingEntityKey = billingEntity.key || DEFAULT_MAPPING_KEY

          acc[billingEntityKey] = {
            taxCode: isMappingInTaxContext(localData, billingEntityKey)
              ? localData.itemMappings[billingEntityKey].taxCode || ''
              : '',
            taxNexus: isMappingInTaxContext(localData, billingEntityKey)
              ? localData.itemMappings[billingEntityKey].taxNexus || ''
              : '',
            taxType: isMappingInTaxContext(localData, billingEntityKey)
              ? localData.itemMappings[billingEntityKey].taxType || ''
              : '',
            externalId: localData.itemMappings[billingEntityKey].itemExternalId || '',
            externalName: localData.itemMappings[billingEntityKey].itemExternalName || '',
            externalAccountCode: localData.itemMappings[billingEntityKey].itemExternalCode || '',
          }

          return acc
        },
        {},
      )
    }

    const validateForm = (
      values: FormValuesType,
    ): object | Promise<FormikErrors<FormValuesType>> => {
      if (!localData) return {}

      const validationPerBillingEntity = localData.billingEntities.map(
        (
          billingEntity,
        ):
          | {
              success: true
            }
          | { success: false; error: string } => {
          const billingEntityKey = billingEntity.key || DEFAULT_MAPPING_KEY
          const inputValues = values[billingEntityKey]

          // For delete action, form needs to be empty but valid
          if (Object.values(inputValues).filter((v) => !!v).length === 0) {
            return {
              success: true,
            }
          }

          const hasOneValueFilled = Object.values(inputValues).some((v) => !!v)

          if (hasOneValueFilled) {
            if (
              isTaxContext &&
              (!values.default.taxCode || !values.default.taxNexus || !values.default.taxType)
            ) {
              return { success: false, error: 'Fill in all inputs' }
            }

            if (
              !isTaxContext &&
              (!values.default.externalId ||
                !values.default.externalName ||
                !values.default.externalAccountCode)
            ) {
              return { success: false, error: 'Fill in all inputs' }
            }
          }

          return { success: true }
        },
      )

      const hasOneError = validationPerBillingEntity.some(
        (validation) => validation.success === false,
      )

      if (hasOneError) {
        return { error: 'Fill in all inputs' }
      }

      return {}
    }

    const formikProps = useFormik<FormValuesType>({
      initialValues: getFormInitialValues(),
      validate(values) {
        return validateForm(values)
      },
      /**
       * This validates the pattern Record<string, Object>
       * More on this: https://github.com/jquense/yup/issues/524#issuecomment-530780947
       */
      validationSchema: array()
        .transform((_key, orig) => Object.values(orig))
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
          const billingEntityKey = billingEntity.key || DEFAULT_MAPPING_KEY
          const inputValues = values[billingEntityKey]

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

    const { title, description } = getTitleAndDescription(localData, localData?.type)

    useImperativeHandle(ref, () => ({
      openDrawer: (props) => {
        setLocalData(props)
        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => drawerRef.current?.closeDrawer(),
    }))

    const [selectedTabIndex, setSelectedTabIndex] = useState(0)

    const handleTabClick = (_event: React.SyntheticEvent<Element, Event>, newValue: number) =>
      setSelectedTabIndex(newValue)

    const billingEntitiesWithoutDefault = useMemo(() => {
      return localData?.billingEntities.filter((be) => be.id !== null) || []
    }, [localData?.billingEntities])

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
            <div className="flex flex-col gap-2">
              <Typography variant="subhead1">
                {translate('text_6630e3210c13c500cd398e97')}
              </Typography>
              <Typography variant="caption">
                {translate('text_1762159805730gne2kxieeqo')}
              </Typography>
            </div>
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
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Typography variant="subhead1">
                {translate('text_1762159805730r5zfutgdloi')}
              </Typography>
              <Typography variant="caption">
                {translate('text_1762159805730hqzi614r672')}
              </Typography>
            </div>
            <div className="flex flex-row shadow-b">
              <Tabs
                className="min-h-13 w-full flex-1 items-center overflow-visible"
                variant="scrollable"
                role="navigation"
                scrollButtons={false}
                value={selectedTabIndex}
                onChange={handleTabClick}
              >
                {billingEntitiesWithoutDefault.map((billingEntity, index) => (
                  <Tab
                    key={`tab-${billingEntity.id || DEFAULT_MAPPING_KEY}`}
                    disableFocusRipple
                    disableRipple
                    role="tab"
                    className="relative my-2 h-9 justify-between gap-1 overflow-visible rounded-xl p-2 text-grey-600 no-underline [min-height:unset] [min-width:unset] first:-ml-2 last:-mr-2 hover:bg-grey-100 hover:text-grey-700"
                    label={<Typography variant="captionHl">{billingEntity.name}</Typography>}
                    value={index}
                    id={`simple-tab-${index}`}
                    aria-controls={`simple-tabpanel-${index}`}
                  />
                ))}
              </Tabs>
            </div>
            {billingEntitiesWithoutDefault.map((billingEntity, index) => {
              const isSelected = selectedTabIndex === index

              if (!isSelected) return null

              return (
                <div
                  key={`tabpanel-${billingEntity.id || DEFAULT_MAPPING_KEY}`}
                  role="tabpanel"
                  hidden={!isSelected}
                  id={`simple-tabpanel-${index}`}
                  aria-labelledby={`simple-tab-${index}`}
                  className="w-full"
                >
                  {isTaxContext ? (
                    <NetsuiteIntegrationMapItemTaxContextForm
                      formikProps={formikProps}
                      billingEntityKey={billingEntity.key || DEFAULT_MAPPING_KEY}
                    />
                  ) : (
                    <NetsuiteIntegrationMapItemNonTaxContextForm
                      formikProps={formikProps}
                      billingEntityKey={billingEntity.key || DEFAULT_MAPPING_KEY}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Drawer>
    )
  },
)

NetsuiteIntegrationMapItemDrawer.displayName = 'NetsuiteIntegrationMapItemDrawer'
