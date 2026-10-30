import { Typography } from '~/components/designSystem/Typography'
import { TextInput } from '~/components/form'
import { BasicMultipleComboBoxData } from '~/components/form/MultipleComboBox/types'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import {
  getX402Environment,
  X402_ENVIRONMENT_TRANSLATIONS,
} from '~/components/settings/integrations/x402Connection'
import { X402NetworkEnvironmentEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withForm } from '~/hooks/forms/useAppform'
import { useX402Networks } from '~/hooks/useX402Networks'

import { x402DefaultValues } from './validationSchema'

const X402ConnectionFields = withForm({
  defaultValues: x402DefaultValues,
  props: { isEdition: false },
  render: function Render({ form, isEdition }) {
    const { translate } = useInternationalization()
    const { networks: catalog } = useX402Networks()

    const networkOptions = (environment: string): BasicMultipleComboBoxData[] =>
      catalog
        .filter((network) => network.environment === environment)
        .map((network) => ({
          value: network.id,
          label: network.name,
          description: `${network.family.toUpperCase()} ${translate(
            network.environment === X402NetworkEnvironmentEnum.Mainnet
              ? 'text_1793132394869qwdol6ok2cm'
              : 'text_179313239486902oyq8t2y3u',
          )} - ${network.id}`,
        }))

    return (
      <div className="flex flex-col gap-6 p-8">
        <NameAndCodeGroup
          form={form}
          fields={{ name: 'name', code: 'code' }}
          disableAutoGenerateCode={isEdition}
          nameProps={{
            label: translate('text_6584550dc4cec7adf861504d'),
            placeholder: translate('text_6584550dc4cec7adf861504f'),
          }}
          codeProps={{
            label: translate('text_6584550dc4cec7adf8615051'),
            placeholder: translate('text_6584550dc4cec7adf8615053'),
          }}
        />

        <form.AppField name="cdpApiKeyId">
          {(field) => (
            <field.TextInputField
              description={isEdition ? translate('text_179313398974898xp846n9y5') : undefined}
              label={translate('text_1793132394868pwqbx90cf8b')}
              placeholder={translate('text_17931323948680vgx0wpgnrf')}
            />
          )}
        </form.AppField>

        <form.AppField name="cdpApiKeySecret">
          {(field) => (
            <field.TextInputField
              password
              description={isEdition ? translate('text_179313398974898xp846n9y5') : undefined}
              label={translate('text_1793132394868dszn9rlgiw7')}
              placeholder={translate('text_17931323948681jv834fwapk')}
            />
          )}
        </form.AppField>

        <TextInput
          name="asset"
          disabled
          value="USDC"
          label={translate('text_17931323948681cl90eupqde')}
        />

        <form.AppField
          name="environment"
          listeners={{
            // Networks of the other environment are dropped: a connection never mixes them.
            onChange: ({ value: environment }) => {
              form.setFieldValue(
                'networks',
                form.state.values.networks.filter(
                  ({ value: network }) => getX402Environment([network], catalog) === environment,
                ),
              )
            },
          }}
        >
          {(field) => (
            <field.ComboBoxField
              PopperProps={{ displayInDialog: true }}
              disableClearable
              sortValues={false}
              virtualized={false}
              label={translate('text_1793132394869v0rsl99wkms')}
              placeholder={translate('text_179313239486959hb2v39qfq')}
              data={[
                {
                  value: X402NetworkEnvironmentEnum.Testnet,
                  label: translate(
                    X402_ENVIRONMENT_TRANSLATIONS[X402NetworkEnvironmentEnum.Testnet],
                  ),
                  description: translate('text_1793132394869g990pgm13dz'),
                },
                {
                  value: X402NetworkEnvironmentEnum.Mainnet,
                  label: translate(
                    X402_ENVIRONMENT_TRANSLATIONS[X402NetworkEnvironmentEnum.Mainnet],
                  ),
                  description: translate('text_1793132394869g0lp95omsra'),
                },
              ]}
            />
          )}
        </form.AppField>

        <form.Subscribe selector={(state) => state.values.environment}>
          {(environment) => (
            <form.AppField name="networks">
              {(field) => (
                <field.MultipleComboBoxField
                  PopperProps={{ displayInDialog: true }}
                  disabled={!environment}
                  sortValues={false}
                  virtualized={false}
                  label={translate('text_1793132394869jd4bmw58fz1')}
                  placeholder={translate('text_1793132394869scxi2byzi8o')}
                  data={networkOptions(environment)}
                />
              )}
            </form.AppField>
          )}
        </form.Subscribe>

        <form.AppField name="evmPayoutAddress">
          {(field) => (
            <field.TextInputField
              label={translate('text_1793132394869qbewz38n7li')}
              placeholder={translate('text_1793132394869foz539ute16')}
            />
          )}
        </form.AppField>

        <form.AppField name="svmPayoutAddress">
          {(field) => (
            <field.TextInputField
              label={translate('text_1793132394869960hjrg0yla')}
              placeholder={translate('text_1793132394869zq69t7x6ktd')}
            />
          )}
        </form.AppField>

        <form.AppField name="allowedOrigins">
          {(field) => (
            <field.TextInputField
              multiline
              rows={4}
              label={translate('text_1793132394869zlqs0k1l2fm')}
              placeholder={translate('text_1793132394869cit1k4z7f5a')}
            />
          )}
        </form.AppField>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Typography variant="subhead1" color="grey700">
              {translate('text_1793132394869xvpiygh9ecn')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_1793132394869pgcan48dqvx')}
            </Typography>
          </div>

          <form.AppField name="autoCreateCustomers">
            {(field) => (
              <field.SwitchField
                label={translate('text_1793132394869hysrxau60dc')}
                subLabel={translate('text_1793132394869zunprn48m3z')}
              />
            )}
          </form.AppField>
        </div>
      </div>
    )
  },
})

export default X402ConnectionFields
