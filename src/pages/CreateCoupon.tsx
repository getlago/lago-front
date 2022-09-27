import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import { useCreateEditCoupon } from '~/hooks/useCreateEditCoupon'
import { PageHeader } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { COUPONS_ROUTE } from '~/core/router'
import { CouponForm } from '~/components/coupons/CouponForm'

const CreateCoupon = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { isEdition, loading, coupon, onSave } = useCreateEditCoupon()
  const warningDialogRef = useRef<WarningDialogRef>(null)

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_6287a9bdac160c00b2e0fbe7' : 'text_62876e85e32e0300e18030e7')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() => warningDialogRef.current?.openDialog()}
        />
      </PageHeader>

      <CouponForm loading={loading} coupon={coupon} onSave={onSave} isEdition={isEdition} />

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbeb' : 'text_62876e85e32e0300e18030f5'
        )}
        description={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbf1' : 'text_62876e85e32e0300e18030fc'
        )}
        continueText={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbfd' : 'text_62876e85e32e0300e180310b'
        )}
        onContinue={() => navigate(COUPONS_ROUTE)}
      />
    </div>
  )
}

export default CreateCoupon
