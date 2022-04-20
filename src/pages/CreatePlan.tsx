import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { theme, PageHeader, NAV_HEIGHT } from '~/styles'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { PLANS_ROUTE } from '~/core/router'
import EmojiParty from '~/public/images/party.png'
import { CodeSnippet } from '~/components/CodeSnippet'
import { PlanForm } from '~/components/plans/PlanForm'
import { useCreateEditPlan } from '~/hooks/useCreateEditPlan'

const CreatePlan = () => {
  const { loading, isEdition, isCreated, plan, onSave, resetIsCreated } = useCreateEditPlan()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const { translate } = useI18nContext()
  let navigate = useNavigate()

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_625fd165963a7b00c8f59767' : 'text_624453d52e945301380e4988')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            isCreated ? navigate(PLANS_ROUTE) : warningDialogRef.current?.openDialog()
          }
        />
      </PageHeader>

      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_624455d859b1b000a8e17bf3')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_624455d859b1b000a8e17bf5')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_624455d859b1b000a8e17bf7')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(PLANS_ROUTE)}>
              {translate('text_624455d859b1b000a8e17bf9')}
            </Button>
          </div>
        </SuccessCard>
      ) : (
        <Content>
          <div>
            <Main>
              {loading ? (
                <>
                  <SkeletonHeader>
                    <Skeleton
                      variant="text"
                      width={280}
                      height={12}
                      marginBottom={theme.spacing(5)}
                    />
                    <Skeleton
                      variant="text"
                      width="inherit"
                      height={12}
                      marginBottom={theme.spacing(4)}
                    />
                    <Skeleton variant="text" width={120} height={12} />
                  </SkeletonHeader>

                  {[0, 1, 2].map((skeletonCard) => (
                    <Card key={`skeleton-${skeletonCard}`}>
                      <Skeleton
                        variant="text"
                        width={280}
                        height={12}
                        marginBottom={theme.spacing(9)}
                      />
                      <Skeleton
                        variant="text"
                        width="inherit"
                        height={12}
                        marginBottom={theme.spacing(4)}
                      />
                      <Skeleton variant="text" width={120} height={12} />
                    </Card>
                  ))}
                </>
              ) : (
                <>
                  <div>
                    <Title variant="headline">
                      {translate(
                        isEdition
                          ? 'text_625fd165963a7b00c8f59771'
                          : 'text_624453d52e945301380e498a'
                      )}
                    </Title>
                    <Subtitle>
                      {translate(
                        isEdition
                          ? 'text_625fd165963a7b00c8f5977b'
                          : 'text_624453d52e945301380e498e'
                      )}
                    </Subtitle>
                  </div>
                  <PlanForm isEdition={isEdition} plan={plan} onSave={onSave}>
                    <MobileOnly>
                      <CodeSnippet loading={loading} />
                    </MobileOnly>
                  </PlanForm>
                </>
              )}
            </Main>
            <Side>
              <Card>
                <CodeSnippet loading={loading} />
              </Card>
            </Side>
          </div>
        </Content>
      )}

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_625fd165963a7b00c8f59777' : 'text_624454dd67656e00c534bc35'
        )}
        description={translate(
          isEdition ? 'text_625fd165963a7b00c8f59781' : 'text_624454dd67656e00c534bc3b'
        )}
        continueText={translate(
          isEdition ? 'text_625fd165963a7b00c8f59795' : 'text_624454dd67656e00c534bc41'
        )}
        onContinue={() => navigate(PLANS_ROUTE)}
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

const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const SuccessTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(3)};
`

const SuccessDescription = styled(Typography)`
  margin-bottom: ${theme.spacing(5)};
`

const Main = styled.div`
  margin-right: ${theme.spacing(8)};
  flex: 1;
  padding-top: ${theme.spacing(12)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(8)};
  }

  ${theme.breakpoints.down('md')} {
    margin-right: 0;
  }
`

const Side = styled.div`
  width: 408px;
  position: relative;

  > div {
    position: sticky;
    top: calc(${NAV_HEIGHT}px + ${theme.spacing(12)});
  }

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const Content = styled.div`
  > div {
    display: flex;
    max-width: 1024px;
    padding: ${theme.spacing(4)};
    margin: auto;

    ${theme.breakpoints.down('md')} {
      max-width: calc(100vw - ${theme.spacing(8)});

      > div {
        max-width: inherit;
      }
    }
  }

  ${theme.breakpoints.down('md')} {
    max-width: 100vw;
  }
`

const MobileOnly = styled(Card)`
  display: none;

  ${theme.breakpoints.down('md')} {
    display: block;
  }
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
`

export default CreatePlan
