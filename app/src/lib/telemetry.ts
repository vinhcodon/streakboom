// Funnel events from spec/02-onboarding-flow.md. Recording is opt-in and lives in state.ts
// (recordEvent / setConsent); the page's track() wrapper calls it. Events carry a name and a
// timestamp only, never keys, chat content or personal data.

export type FunnelEvent =
  | "first_launch"
  | "first_interaction"
  | "brain_request_shown"
  | "get_key_clicked"
  | "returned_to_app"
  | "key_pasted"
  | "key_valid"
  | "first_ai_message"
  | "active_d3"
  | "active_d7"
  | "tier_2" // closeness reached tier 2 (once)
  | "tier_3"
  | "pet_named"; // the user gave the pet a name (once)
