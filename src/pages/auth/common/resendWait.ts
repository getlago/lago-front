// lago-api `PendingSignup::MIN_EMAIL_INTERVAL`: the minute rule never asks to wait longer, so a longer
// wait comes from the address's hourly limit (3 emails an hour across all its sign-ups)
export const MINUTE_RULE_MAX_WAIT_SECONDS = 60
