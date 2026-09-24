import { gql } from '@apollo/client'
import { useStore } from '@tanstack/react-form'

import { Typography } from '~/components/designSystem/Typography'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { CreateMoreResetSignal } from '~/components/drawers/createMore/useCreateMore'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  UsageAttributionTypeRoleEnum,
  useGetGovernanceEntityParentOptionsLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'

import { AttributionKeysField } from './AttributionKeysField'
import { GOVERNANCE_ENTITY_FORM_DEFAULTS } from './validationSchema'

gql`
  query getGovernanceEntityParentOptions($searchTerm: String, $limit: Int) {
    usageAttributionTypes(role: hierarchical, searchTerm: $searchTerm, limit: $limit) {
      collection {
        id
        name
        code
      }
    }
  }
`

const PARENT_OPTIONS_LIMIT = 100

export const GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID = 'governance-entity-drawer-name'
export const GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID = 'governance-entity-drawer-code'
export const GOVERNANCE_ENTITY_DRAWER_ROLE_TEST_ID = 'governance-entity-drawer-role'
export const GOVERNANCE_ENTITY_DRAWER_PARENT_TEST_ID = 'governance-entity-drawer-parent'

const GovernanceEntityDrawerFormSections = withForm({
  defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
  render: function GovernanceEntityDrawerFormSectionsRender({ form }) {
    const { translate } = useInternationalization()
    const role = useStore(form.store, (state) => state.values.role)
    const isHierarchical = role === UsageAttributionTypeRoleEnum.Hierarchical

    const [getParentOptions, { data: parentOptionsData, loading: parentOptionsLoading }] =
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

    const parentOptions = (parentOptionsData?.usageAttributionTypes.collection ?? []).map(
      ({ id, name, code }) => ({ value: id, label: name || code }),
    )

    const handleRoleChange = ({ value }: { value: string | undefined }): void => {
      if (value !== UsageAttributionTypeRoleEnum.Hierarchical && form.state.values.parentId) {
        form.setFieldValue('parentId', undefined)
      }
    }

    return (
      <>
        <div className="flex flex-col gap-2">
          <Typography variant="headline" color="grey700">
            {translate('text_1790236824869cg5v2b6hasb')}
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
            nameProps={{
              autoFocus: true,
              placeholder: translate('text_1790244192647frw2pd32d3b'),
            }}
            codeProps={{ placeholder: translate('text_1790244192647jne99fxqvme') }}
            nameDataTest={GOVERNANCE_ENTITY_DRAWER_NAME_TEST_ID}
            codeDataTest={GOVERNANCE_ENTITY_DRAWER_CODE_TEST_ID}
          />

          <form.AppField name="role" listeners={{ onChange: handleRoleChange }}>
            {(field) => (
              <field.ComboBoxField
                disableClearable
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
                  data={parentOptions}
                  loading={parentOptionsLoading}
                  searchQuery={getParentOptions}
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

type GovernanceEntityDrawerContentExtraProps = {
  resetSignal?: CreateMoreResetSignal
}

const governanceEntityDrawerContentDefaultProps: GovernanceEntityDrawerContentExtraProps = {
  resetSignal: undefined,
}

export const GovernanceEntityDrawerContent = withForm({
  defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
  props: governanceEntityDrawerContentDefaultProps,
  render: function GovernanceEntityDrawerContentRender({ form, resetSignal }) {
    return (
      <CreateMoreResetBoundary resetSignal={resetSignal}>
        <GovernanceEntityDrawerFormSections form={form} />
      </CreateMoreResetBoundary>
    )
  },
})
