import { z } from 'zod'

import { Button } from '~/components/designSystem/Button'
import { Card } from '~/components/designSystem/Card'
import { Typography } from '~/components/designSystem/Typography'
import { useDrawer } from '~/components/drawers/useDrawer'
import { JsonEditor } from '~/components/form'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

const CUSTOM_CHARGE_DRAWER_SAVE_TEST_ID = 'custom-charge-drawer-save'

type UseCustomChargeDrawerProps = {
  onSave: (customProperties: string) => void
}

type UseCustomChargeDrawerReturn = {
  openCustomChargeDrawer: (currentValue: string | undefined) => void
}

// The only write path for a Custom charge model: `CustomCharge` gives its `JsonEditor` no
// `onChange`, so a host that does not wire `onExpandCustomCharge` to this cannot save one.
export const useCustomChargeDrawer = ({
  onSave,
}: UseCustomChargeDrawerProps): UseCustomChargeDrawerReturn => {
  const { translate } = useInternationalization()
  const drawer = useDrawer()

  const form = useAppForm({
    defaultValues: { customProperties: '' as string | undefined },
    validators: {
      onDynamic: z.object({ customProperties: z.string().min(1) }),
    },
    onSubmit: ({ value }) => {
      if (value.customProperties) {
        onSave(value.customProperties)
        drawer.close()
      }
    },
  })

  const openCustomChargeDrawer = (currentValue: string | undefined): void => {
    form.reset({ customProperties: currentValue }, { keepDefaultValues: true })

    drawer.open({
      title: translate('text_663dea5702b60301d8d0646e'),
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      children: (
        <CenteredPage.SectionWrapper>
          <CenteredPage.PageTitle
            title={translate('text_663dea5702b60301d8d0646e')}
            description={translate('text_663dea5702b60301d8d064fe')}
          />

          <Card>
            <Typography variant="subhead1">{translate('text_663dea5702b60301d8d06502')}</Typography>
            <JsonEditor
              hideLabel
              label={translate('text_663dea5702b60301d8d06502')}
              value={currentValue}
              onChange={(value) => form.setFieldValue('customProperties', value)}
              onBlur={() => {}}
            />
          </Card>
        </CenteredPage.SectionWrapper>
      ),
      actions: (
        <div className="flex justify-end gap-3">
          <Button variant="quaternary" onClick={() => drawer.close()}>
            {translate('text_6411e6b530cb47007488b027')}
          </Button>
          <form.Subscribe selector={({ canSubmit }) => canSubmit}>
            {(canSubmit) => (
              <Button
                disabled={!canSubmit}
                onClick={() => form.handleSubmit()}
                data-test={CUSTOM_CHARGE_DRAWER_SAVE_TEST_ID}
              >
                {translate('text_663dea5702b60301d8d06490')}
              </Button>
            )}
          </form.Subscribe>
        </div>
      ),
    })
  }

  return { openCustomChargeDrawer }
}
