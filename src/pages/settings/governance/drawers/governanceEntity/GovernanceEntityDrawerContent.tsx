import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'
import { useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { CreateMoreResetSignal } from '~/components/drawers/createMore/useCreateMore'
import { BasicComboBoxData } from '~/components/form/ComboBox/types'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  UsageAttributionTypeRoleEnum,
  useGetGovernanceEntityParentOptionsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { AttributionKeysField } from './AttributionKeysField'
import { GOVERNANCE_ENTITY_FORM_DEFAULTS, GovernanceEntity } from './validationSchema'

import { MAX_GOVERNANCE_HIERARCHY_DEPTH } from '../../constants'

gql`
  query getGovernanceEntityParentOptions($searchTerm: String, $limit: Int) {
    usageAttributionTypes(role: hierarchical, searchTerm: $searchTerm, limit: $limit) {
      collection {
        id
        name
        code
        parent {
          id
          parent {
            id
            parent {
              id
              parent {
                id
                parent {
                  id
                  parent {
                    id
                    parent {
                      id
                      parent {
                        id
                        parent {
                          id
                          parent {
                            id
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const PARENT_OPTIONS_LIMIT = 100

type GovernanceEntityAncestor = { id: string; parent?: GovernanceEntityAncestor | null }

const countAncestors = ({ parent }: GovernanceEntityAncestor): number =>
  parent ? 1 + countAncestors(parent) : 0

export const GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID = 'governance-entity-drawer-name'
export const GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID = 'governance-entity-drawer-code'
export const GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID = 'governance-entity-drawer-role'
export const GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID = 'governance-entity-drawer-parent'
export const GOVERNANCE_ENTITY_DRAWER_SHOW_DESCRIPTION_TEST_ID =
  'governance-entity-drawer-show-description'
export const GOVERNANCE_ENTITY_DRAWER_REMOVE_DESCRIPTION_TEST_ID =
  'governance-entity-drawer-remove-description'
export const GOVERNANCE_ENTITY_DRAWER_DESCRIPTION_TEST_ID = 'governance-entity-drawer-description'

type GovernanceEntityDrawerFormSectionsProps = {
  editedEntity?: GovernanceEntity
}

const governanceEntityDrawerFormSectionsDefaultProps: GovernanceEntityDrawerFormSectionsProps = {
  editedEntity: undefined,
}

const GovernanceEntityDrawerFormSections = withForm({
  defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
  props: governanceEntityDrawerFormSectionsDefaultProps,
  render: function GovernanceEntityDrawerFormSectionsRender({ form, editedEntity }) {
    const { translate } = useInternationalization()
    const role = useStore(form.store, (state) => state.values.role)
    const isHierarchical = role === UsageAttributionTypeRoleEnum.Hierarchical
    const isEdition = !!editedEntity
    const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
      !!editedEntity?.description,
    )

    const handleHideDescription = (): void => {
      if (form.state.values.description) {
        form.setFieldValue('description', '')
      }
      setShouldDisplayDescription(false)
    }

    const [fetchParentOptions, { data: parentOptionsData, loading: parentOptionsLoading }] =
      useGetGovernanceEntityParentOptionsLazyQuery({
        variables: { limit: PARENT_OPTIONS_LIMIT },
        fetchPolicy: 'no-cache',
        notifyOnNetworkStatusChange: true,
      })

    const roleOptions = [
      {
        value: UsageAttributionTypeRoleEnum.Flat,
        label: translate('text_17902308125635bb6aqr2wbe'),
      },
      {
        value: UsageAttributionTypeRoleEnum.Hierarchical,
        label: translate('text_1790230812563cibrddwcit4'),
      },
    ]

    const getParentOptions = (): BasicComboBoxData[] => {
      if (editedEntity) {
        const { parent } = editedEntity

        return parent ? [{ value: parent.id, label: parent.name || parent.code }] : []
      }

      return (parentOptionsData?.usageAttributionTypes.collection ?? []).map((option) => ({
        value: option.id,
        label: option.name || option.code,
        disabled: countAncestors(option) >= MAX_GOVERNANCE_HIERARCHY_DEPTH,
      }))
    }

    const handleRoleChange = ({ value }: { value: string | undefined }): void => {
      if (value !== UsageAttributionTypeRoleEnum.Hierarchical && form.state.values.parentId) {
        form.setFieldValue('parentId', undefined)
      }
    }

    const renderDescription = (): JSX.Element => {
      if (!shouldDisplayDescription) {
        return (
          <Button
            fitContent
            startIcon="plus"
            variant="inline"
            onClick={() => setShouldDisplayDescription(true)}
            data-test={GOVERNANCE_ENTITY_DRAWER_SHOW_DESCRIPTION_TEST_ID}
          >
            {translate('text_642d5eb2783a2ad10d670324')}
          </Button>
        )
      }

      return (
        <div className="flex items-center">
          <form.AppField name="description">
            {(field) => (
              <field.TextInputField
                multiline
                className="mr-3 flex-1"
                label={translate('text_629728388c4d2300e2d380f1')}
                placeholder={translate('text_1750257831368ae3rtaclhjy')}
                rows="3"
                data-test={GOVERNANCE_ENTITY_DRAWER_DESCRIPTION_TEST_ID}
              />
            )}
          </form.AppField>
          <Tooltip
            className="mt-6"
            placement="top-end"
            title={translate('text_63aa085d28b8510cd46443ff')}
          >
            <Button
              icon="trash"
              variant="quaternary"
              onClick={handleHideDescription}
              data-test={GOVERNANCE_ENTITY_DRAWER_REMOVE_DESCRIPTION_TEST_ID}
            />
          </Tooltip>
        </div>
      )
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate(
              isEdition ? 'text_1790258263571csa7fz44d2x' : 'text_1790236824869cg5v2b6hasb',
            )}
          </Typography>
          <Typography variant="body" color="grey600">
            {translate('text_1790236828844ag7c1onjptx')}
          </Typography>
        </div>

        <CenteredPage.PageSection>
          <CenteredPage.PageSectionTitle
            title={translate('text_1790244192647rcqt27uhgij')}
            description={translate('text_1783627031283920r4ap3cwe')}
          />

          <NameAndCodeGroup
            form={form}
            fields={{ name: 'name', code: 'code' }}
            disableCodeInput={isEdition}
            nameProps={{
              autoFocus: true,
              placeholder: translate('text_1790244192647frw2pd32d3b'),
            }}
            codeProps={{ placeholder: translate('text_1790244192647jne99fxqvme') }}
            nameDataTest={GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID}
            codeDataTest={GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID}
          />

          {renderDescription()}

          <form.AppField name="role" listeners={{ onChange: handleRoleChange }}>
            {(field) => (
              <field.ComboBoxField
                disableClearable
                disabled={isEdition}
                label={translate('text_6560809c38fb9de88d8a52fb')}
                placeholder={translate('text_1790236828844imd71hgrduj')}
                data={roleOptions}
                dataTest={GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID}
                PopperProps={{ displayInDialog: true }}
              />
            )}
          </form.AppField>

          {isHierarchical && (
            <form.AppField name="parentId">
              {(field) => (
                <field.ComboBoxField
                  label={translate('text_17902441926478sdl04thios')}
                  placeholder={translate('text_17902368288446vbtxrw8c8c')}
                  disabled={isEdition}
                  data={getParentOptions()}
                  loading={parentOptionsLoading}
                  searchQuery={isEdition ? undefined : fetchParentOptions}
                  dataTest={GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID}
                  PopperProps={{ displayInDialog: true }}
                />
              )}
            </form.AppField>
          )}

          <AttributionKeysField form={form} />
        </CenteredPage.PageSection>
      </>
    )
  },
})

type GovernanceEntityDrawerContentExtraProps = GovernanceEntityDrawerFormSectionsProps & {
  resetSignal?: CreateMoreResetSignal
}

const governanceEntityDrawerContentDefaultProps: GovernanceEntityDrawerContentExtraProps = {
  resetSignal: undefined,
  editedEntity: undefined,
}

export const GovernanceEntityDrawerContent = withForm({
  defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
  props: governanceEntityDrawerContentDefaultProps,
  render: function GovernanceEntityDrawerContentRender({ form, resetSignal, editedEntity }) {
    return (
      <CreateMoreResetBoundary resetSignal={resetSignal}>
        <GovernanceEntityDrawerFormSections form={form} editedEntity={editedEntity} />
      </CreateMoreResetBoundary>
    )
  },
})
