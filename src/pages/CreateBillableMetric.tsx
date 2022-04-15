import { useRef } from 'react'
import styled from 'styled-components'
import { useNavigate } from 'react-router-dom'

import { theme, PageHeader, NAV_HEIGHT } from '~/styles'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { BILLABLE_METRICS_ROUTE } from '~/core/router'
import { CodeSnippet } from '~/components/CodeSnippet'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import EmojiParty from '~/public/images/party.png'
import { BillableMetricForm } from '~/components/billableMetrics/BillableMetricForm'
import { useCreateEditBillableMetric } from '~/hooks/useCreateEditBillableMetric'

const CreateBillableMetric = () => {
  const { translate } = useI18nContext()
  const { isEdition, loading, billableMetric, isCreated, resetIsCreated, onSave } =
    useCreateEditBillableMetric()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  let navigate = useNavigate()

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_62582fb4675ece01137a7e44' : 'text_623b42ff8ee4e000ba87d0ae')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            isCreated ? navigate(BILLABLE_METRICS_ROUTE) : warningDialogRef.current?.openDialog()
          }
        />
      </PageHeader>
      {isCreated ? (
        <SuccessCard>
          <img src={EmojiParty} alt="success emoji" />
          <SuccessTitle variant="subhead">
            {translate('text_623dfd731788a100ec660f14')}
          </SuccessTitle>
          <SuccessDescription>{translate('text_623dfd731788a100ec660f16')}</SuccessDescription>
          <div>
            <Button variant="secondary" onClick={resetIsCreated}>
              {translate('text_623dfd731788a100ec660f18')}
            </Button>
            <Button variant="secondary" onClick={() => navigate(BILLABLE_METRICS_ROUTE)}>
              {translate('text_623dfd731788a100ec660f1a')}
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
                          ? 'text_62582fb4675ece01137a7e46'
                          : 'text_623b42ff8ee4e000ba87d0b0'
                      )}
                    </Title>
                    <Subtitle>
                      {translate(
                        isEdition
                          ? 'text_62582fb4675ece01137a7e48'
                          : 'text_623b42ff8ee4e000ba87d0b4'
                      )}
                    </Subtitle>
                  </div>
                  <BillableMetricForm
                    billableMetric={billableMetric}
                    onSave={onSave}
                    isEdition={isEdition}
                  >
                    <MobileOnly>
                      <CodeSnippet loading={loading} />
                    </MobileOnly>
                  </BillableMetricForm>
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
          isEdition ? 'text_62583bbb86abcf01654f693f' : 'text_6244277fe0975300fe3fb940'
        )}
        description={translate(
          isEdition ? 'text_62583bbb86abcf01654f6943' : 'text_6244277fe0975300fe3fb946'
        )}
        continueText={translate(
          isEdition ? 'text_62583bbb86abcf01654f694b' : 'text_6244277fe0975300fe3fb94c'
        )}
        onContinue={() => navigate(BILLABLE_METRICS_ROUTE)}
      />
    </div>
  )
}

export default CreateBillableMetric

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
`

const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
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

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
`

const MobileOnly = styled(Card)`
  display: none;

  ${theme.breakpoints.down('md')} {
    display: block;
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
