# NeuroNest Feature Roadmap — Safety & Complementary Features

> This document tracks all proposed safety and user-configurable features designed to set NeuroNest apart from competitors (Hiki, Haik, Mattr, Bumble, etc.).

---

## P0 — Critical (Implement First)

### 1. Safe Date Check-In + Trusted Contacts
- [x] **Backend**: `trustedContacts` field on User model (name, phone/email, relationship)
- [x] **Backend**: `datePlans` collection — location, time, duration, linked trusted contacts, status
- [x] **Backend**: POST `/safety/date-plans` — create a date plan
- [x] **Backend**: PATCH `/safety/date-plans/:id/check-in` — user checks in (safe / need-help)
- [x] **Backend**: Auto-alert logic — if no check-in within window, notify trusted contacts (stub: email/SMS via webhook)
- [x] **Frontend**: "Plan a Date" modal accessible from MatchesPage / MessagesPage
- [x] **Frontend**: Trusted Contacts management in SettingsPage
- [x] **Frontend**: Active date plan banner with check-in button + countdown timer
- [x] **Frontend**: Post-date mood check-in prompt ("How did it go?" → routes to journal or crisis resources)

### 2. Panic / SOS Button
- [x] **Backend**: POST `/safety/sos` — logs SOS event, triggers alerts to trusted contacts with location
- [x] **Frontend**: Global floating SOS button component (visible on every page)
- [x] **Frontend**: User-configurable position (bottom-left / bottom-right) and visibility (always / date-only / off) in SettingsPage
- [x] **Frontend**: One-tap action: sends location + date plan + custom message to trusted contacts
- [x] **Frontend**: Optional "call emergency services" button in SOS overlay
- [x] **Frontend**: Integration with HelpPage crisis resources by detected/selected region

### 3. Progressive Trust Levels
- [x] **Backend**: `trustLevel` field per conversation (1–4), auto-calculated from mutual engagement
- [x] **Backend**: Trust level progression rules (message count, time elapsed, mutual likes/replies)
- [x] **Backend**: Feature gating per trust level (Level 1: text only; Level 2: images/voice; Level 3: video/location; Level 4: contact exchange)
- [x] **Backend**: Manual override endpoints — user can accelerate or slow trust level per conversation
- [x] **Frontend**: Trust level indicator badge in conversation header
- [x] **Frontend**: Locked feature UI hints ("Unlock image sharing after a few more messages")
- [x] **Frontend**: Manual trust level controls in conversation settings drawer
- [x] **Frontend**: Celebration micro-animation when trust level increases

---

## P1 — High Priority

### 4. AI Conversation Guardian
- [x] **Backend**: Message scanning middleware — detect manipulation, love-bombing, coercion, gaslighting, negging, pressure patterns
- [x] **Backend**: Pattern library with configurable thresholds
- [x] **Backend**: Flag messages with pattern type + confidence score (stored privately, not shared with sender)
- [x] **Frontend**: Gentle "heads up" nudge banner on flagged incoming messages (non-intrusive, dismissible)
- [x] **Frontend**: User-configurable sensitivity: Off / Subtle / Active (in SettingsPage)
- [x] **Frontend**: "Learn more" links to educational micro-articles about each manipulation pattern
- [x] **Frontend**: Aggregate pattern report in Safety section of SettingsPage

### 5. Social Energy Meter
- [x] **Backend**: `socialEnergy` field on User model (0–100 scale + label: Full / Medium / Low / Recharging)
- [x] **Backend**: Auto-suggest quiet hours when energy drops below threshold
- [x] **Backend**: Auto-pause discovery at configurable threshold
- [x] **Frontend**: Energy meter widget in Navigation / DashboardPage
- [x] **Frontend**: Quick-set buttons: Full / Medium / Low / Recharging
- [x] **Frontend**: Optional visibility toggle — show energy level on profile to matches
- [x] **Frontend**: Auto-pause confirmation modal when threshold reached

### 6. Communication Style Passport
- [x] **Backend**: `communicationPassport` field on User model — array of style descriptors
- [x] **Backend**: Preset library: "I take things literally", "I need processing time", "Please don't use sarcasm", etc.
- [x] **Backend**: Peer endorsement system — matches can confirm passport items
- [x] **Frontend**: Interactive passport card in conversation sidebar (MessagesPage)
- [x] **Frontend**: Passport editor in ProfilePage with preset chips + custom entries
- [x] **Frontend**: Endorsement UI — "Sam confirmed: Jordan really does take things literally ✓"
- [x] **Frontend**: Passport preview in match card / profile view

### 7. Boundary Presets & Templates
- [x] **Backend**: `boundaryPresets` library in app config (API-driven, admin-editable)
- [x] **Backend**: User boundary selections stored with visibility level (all / matches / private)
- [x] **Frontend**: One-tap boundary activation from preset library in ProfilePage
- [x] **Frontend**: Boundary visibility selector per boundary
- [x] **Frontend**: Boundaries shown to matches before first message (conversation intro card)
- [x] **Frontend**: Nudge system — gentle reminder when a user's message may cross a match's stated boundary

---

## P2 — Medium Priority

### 8. Sensory Profile Card
- [x] **Backend**: `sensoryProfile` field on User model — noise, light, food texture, crowd, touch sensitivities
- [x] **Backend**: Venue compatibility suggestions endpoint (stub)
- [x] **Frontend**: Sensory profile editor in ProfilePage with slider scales
- [x] **Frontend**: Shareable sensory card visible to matches
- [x] **Frontend**: Pre-date venue suggestion based on combined sensory profiles
- [x] **Frontend**: "Share my sensory card" button in conversation

### 9. Selfie Verification + Liveness Detection
- [x] **Backend**: POST `/verification/selfie` — upload live selfie, compare with profile photos
- [x] **Backend**: Liveness detection (pose-matching prompt, blink detection stub)
- [x] **Backend**: AI profile authenticity score calculation
- [x] **Frontend**: Selfie verification flow with camera + pose prompt
- [x] **Frontend**: Trust shield badge on verified profiles
- [x] **Frontend**: Verification status in profile settings

### 10. Masking Fatigue Tracker
- [x] **Backend**: `maskingLogs` collection — intensity (1–5), conversation/date ref, notes, timestamp
- [x] **Backend**: Pattern analysis endpoint — which interactions are draining vs. energizing
- [x] **Frontend**: Private journal-style logging UI (post-conversation / post-date prompt)
- [x] **Frontend**: Weekly pattern insights dashboard
- [x] **Frontend**: Optional "recharge reminder" notification setting
- [x] **Frontend**: Correlation display: "Conversations with 3+ shared interests are 40% less draining"

### 11. Exit Strategy Toolkit
- [x] **Backend**: Pre-written exit text templates (API-driven)
- [x] **Backend**: Timed check-in call scheduler (stub: push notification at set time)
- [x] **Frontend**: "Plan my exit" tool accessible from active date plan
- [x] **Frontend**: Exit text sender (sends pre-written text to self or trusted contact as fake emergency)
- [x] **Frontend**: Timed "rescue call" scheduler — app calls/notifies at set time
- [x] **Frontend**: Post-exit quick actions: report, block, or rate experience privately

### 12. Stim-Friendly Interaction Modes
- [x] **Frontend**: Fidget-friendly message reactions (drag, swipe, hold patterns)
- [x] **Frontend**: Haptic feedback options (configurable intensity)
- [x] **Frontend**: "Doodle mode" in chat — send sketches instead of words
- [x] **Frontend**: Voice-to-text with auto tone tag detection
- [x] **Backend**: Doodle storage + delivery via messages API
- [x] **Backend**: Voice-to-text transcription endpoint (stub)

---

## Implementation Priority Matrix

| Priority | Feature | Effort | Impact | Status |
|----------|---------|--------|--------|--------|
| 🔴 P0 | Safe Date Check-In + Trusted Contacts | Medium | Very High | ✅ Complete |
| 🔴 P0 | Panic / SOS Button | Low | Very High | ✅ Complete |
| 🔴 P0 | Progressive Trust Levels | Medium | High | ✅ Complete |
| 🟡 P1 | AI Conversation Guardian | High | Very High | ✅ Complete |
| 🟡 P1 | Social Energy Meter | Low | High | ✅ Complete |
| 🟡 P1 | Communication Style Passport | Medium | High | ✅ Complete |
| 🟡 P1 | Boundary Presets & Templates | Low | High | ✅ Complete |
| 🟢 P2 | Sensory Profile Card | Low | Medium | ✅ Complete |
| 🟢 P2 | Selfie Verification + Liveness | High | High | ✅ Complete |
| 🟢 P2 | Masking Fatigue Tracker | Medium | Medium | ✅ Complete |
| 🟢 P2 | Exit Strategy Toolkit | Low | Medium | ✅ Complete |
| 🟢 P2 | Stim-Friendly Interaction Modes | Medium | Medium | ✅ Complete |

---

## Competitive Differentiator Thesis

> **Hiki's safety is *reactive*** (block, report, ban).
> **Mainstream apps focus on *identity verification***.
> **NeuroNest owns *proactive, ND-aware safety*** — features that prevent harm before it happens and acknowledge the specific vulnerabilities (social manipulation, sensory overload, masking exhaustion, executive dysfunction) that neurotypical-designed apps ignore entirely.
