import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { useCreateEditCoupon } from '~/hooks/useCreateEditCoupon'
import { theme, PageHeader } from '~/styles'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, Button } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import EmojiParty from '~/public/images/party.png'
import { COUPONS_ROUTE } from '~/core/router'
import { CouponForm } from '~/components/coupons/CouponForm'

const CreateCoupon = () => {
  const { translate } = useI18nContext()
  let navigate = useNavigate()
  const { isEdition, loading, coupon, isCreated, resetIsCreated, onSave } = useCreateEditCoupon()
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
          onClick={() =>
            isCreated ? navigate(COUPONS_ROUTE) : warningDialogRef.current?.openDialog()
          }
        />
      </PageHeader>
      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_62876e85e32e0300e18030f3')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_62876e85e32e0300e18030fa')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_62876e85e32e0300e1803102')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(COUPONS_ROUTE)}>
              {translate('text_62876e85e32e0300e180310a')}
            </Button>
          </div>
        </SuccessCard>
      ) : (
        <CouponForm loading={loading} coupon={coupon} onSave={onSave} isEdition={isEdition} />
      )}
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

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
`

const SuccessCard = styled(Card)`
  max-width: 672px;
  margin: ${theme.spacing(12)} auto 0;

  > img {
    width: 40px;
    height: 40px;
    margin-bottom: ${theme.spacing(5)};
  }

  > *:last-child {
    display: flex;
    > *:first-child {
      margin-right: ${theme.spacing(3)};
    }
  }
`

const SuccessTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`

const SuccessDescription = styled(Typography)`
  margin-bottom: ${theme.spacing(5)};
`

export default CreateCoupon
