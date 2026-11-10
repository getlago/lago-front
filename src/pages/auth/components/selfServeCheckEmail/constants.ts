export const POLL_INTERVAL_MS = 5_000
// lago-api `signup_status_per_ip`: 60 status checks a minute per network, shared by everyone behind it
export const RATE_LIMITED_POLL_INTERVAL_MS = 60_000
// lago-api `PendingSignup::MIN_EMAIL_INTERVAL`: the minute rule never asks to wait longer, so a longer
// wait comes from the address's hourly limit (3 emails an hour across all its sign-ups)
export const MINUTE_RULE_MAX_WAIT_SECONDS = 60
