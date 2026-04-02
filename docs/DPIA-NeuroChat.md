# Data Protection Impact Assessment (DPIA)
## NeuroChat — Neurodivergent-First Messaging Platform

**Document version**: 1.0
**Date**: 2026-04-02
**Data Controller**: [Company name TBC]
**DPO contact**: [DPO email TBC]
**Review date**: 2026-10-02 (6 months) or sooner if material changes occur

---

## 1. Processing Description

### 1.1 Nature of processing
NeuroChat is a messaging and social platform designed for neurodivergent individuals. It collects, stores, and processes personal data to provide:

- **Messaging**: 1:1 text, image, GIF, and AAC (Augmentative & Alternative Communication) symbol-based messages
- **Community posts**: Public posts with reactions and threaded replies
- **User profiles**: Including neurodivergent identity, sensory profiles, triggers, accommodations
- **Energy tracking**: Social, sensory, cognitive, and physical energy levels with masking fatigue logs
- **Safety features**: Guardian Angel manipulation detection, trusted supporter safeguarding framework
- **Communication aids**: AAC symbol grids, social stories, tone translation, social coaching
- **Contact discovery**: Phone number hash-based lookup
- **Real-time features**: Typing indicators, online presence, read receipts (opt-in)

### 1.2 Scope of processing
| Data category | Examples | Lawful basis | Retention |
|---|---|---|---|
| Account data | Email, display name, password hash | Contract (Art. 6(1)(b)) | Until account deletion |
| Profile data | Bio, pronouns, location, interests | Consent (Art. 6(1)(a)) | Until modified or account deletion |
| Special category data | Neurotype, triggers, accommodations, sensory profile, AAC mode, health-related energy tracking | Explicit consent (Art. 9(2)(a)) | Until modified or account deletion |
| Messages | Text content, tone tags, AAC symbols, GIF URLs, images | Contract (Art. 6(1)(b)) | Until message/account deletion |
| Phone number | E.164 format + SHA-256 hash | Consent (Art. 6(1)(a)) | Until removed by user |
| Energy logs | Social/sensory/cognitive/physical levels, masking logs | Consent (Art. 6(1)(a)) | 12 months rolling |
| Safety data | Manipulation alerts, safety scan results, report content | Legitimate interest (Art. 6(1)(f)) | Until resolved + 6 months |
| Community posts | Post content, reactions, replies | Contract (Art. 6(1)(b)) | Until deleted |
| Device data | Online status, typing state, push notification tokens | Contract (Art. 6(1)(b)) | Session-based / until logout |
| Feedback | Aspect, sentiment, comments | Consent (Art. 6(1)(a)) | 24 months |

### 1.3 Context of processing
- **Target users**: Neurodivergent individuals aged 16+ (autistic, ADHD, dyslexic, etc.), their supporters, and family members
- **Vulnerable users**: Non-verbal/minimally verbal individuals using AAC mode; users with intellectual disabilities using supported/protected safeguarding tiers; minors aged 16-17
- **Geographic scope**: Initially UK-focused, expanding to EU and global
- **Technology**: React web app + Express.js backend + SQLite database + Socket.IO real-time

### 1.4 Purposes of processing
1. Provide messaging and communication services adapted for neurodivergent users
2. Facilitate profile-based compatibility matching
3. Monitor for manipulation, grooming, and exploitation (safeguarding)
4. Track energy/masking levels to adjust communication pacing
5. Enable AAC-based communication for non-verbal users
6. Provide social stories and coaching for social skill development
7. Allow trusted supporters to assist vulnerable users (consent-based)
8. Detect and prevent abuse, harassment, and policy violations

---

## 2. Necessity and Proportionality

### 2.1 Why is this processing necessary?
- **Special category data (neurotype, triggers, sensory profile)**: Essential for the core product function — matching users by communication compatibility, adapting the UI, and providing relevant accommodations. Without this data, the platform cannot deliver its neurodivergent-first value proposition.
- **Energy/masking tracking**: Enables auto-responder and communication pacing — core safety and wellbeing features. Users opt in explicitly.
- **Safety scanning (Guardian Angel)**: Neurodivergent individuals are disproportionately vulnerable to manipulation and exploitation. Pattern detection is a legitimate safeguarding interest.
- **AAC communication**: Non-verbal users cannot access the platform without symbol-based messaging and text-to-symbol translation.
- **Trusted Supporters**: The 4-tier safeguarding framework (independent/guided/supported/protected) mirrors the UK Mental Capacity Act principle of least restrictive intervention.

### 2.2 Could we achieve the same outcome with less data?
| Data | Less invasive alternative? | Assessment |
|---|---|---|
| Neurotype | Use generic "interests" only | **Rejected** — neurotype-specific adaptations (AAC, sensory profiles, energy tracking) require explicit ND identity. Generic interests cannot inform accessibility needs. |
| Sensory profile | Omit entirely | **Rejected** — sensory venue mapping and environment warnings depend on individual sensory thresholds. |
| Energy levels | Let users self-report only | **Partially adopted** — energy is user-reported, not inferred. No passive tracking. Auto-shield activates only on user's own logged data. |
| Phone number | Email-only discovery | **Partially adopted** — phone is optional. Hash-based lookup means server never sees the searched number. |
| Messages | End-to-end encryption | **Planned for v2** — current architecture stores messages in plaintext for moderation scanning. E2E encryption will be implemented with server-side moderation pre-encryption. |

### 2.3 Data minimisation measures
- All onboarding fields except display name, DOB, and location are **optional** — users can skip the entire onboarding
- Phone number is **optional** and stored as E.164 + SHA-256 hash; public profiles never expose the number
- Energy tracking is **opt-in** — users must manually log; no passive biometric collection
- Read receipts are **hidden by default** — opt-in only
- AAC mode is **opt-in** with configurable levels
- Manipulation detection runs **locally on message history** — no external data enrichment

---

## 3. Risk Assessment

### 3.1 Risk matrix

| Risk | Likelihood | Severity | Overall | Mitigation |
|---|---|---|---|---|
| **Unauthorised access to special category data** (neurotype, triggers, health) | Medium | High | HIGH | JWT authentication, bcrypt password hashing, per-request auth middleware, admin role separation |
| **Data breach exposing messages** | Medium | High | HIGH | Database access controls, no public API for message bulk export, planned E2E encryption |
| **Manipulation/exploitation of vulnerable users** | Medium | Critical | CRITICAL | Guardian Angel pattern detection (7 alert types), trusted supporter framework, emergency contacts, gut-check analysis |
| **Phone number enumeration** | Low | Medium | MEDIUM | Hash-based lookup (server never sees raw searched number), 100-hash-per-request cap, block filtering |
| **Automated profiling causing discrimination** | Low | High | MEDIUM | No automated decisions with legal effects; compatibility scores are advisory only; users control all profile visibility |
| **Children's data misuse (16-17 year olds)** | Low | High | MEDIUM | Age-gated registration (DOB required, 16+ enforced), supported/protected safeguarding tiers, trusted supporter oversight |
| **Excessive data retention** | Medium | Medium | MEDIUM | Rolling retention for energy logs (12 months), feedback (24 months), safety alerts (resolved + 6 months) |
| **Insider threat (admin access)** | Low | High | MEDIUM | Admin role check middleware, audit logging of all admin actions, content moderation actions logged |
| **Third-party data sharing** | Low | Low | LOW | No data sold or shared with third parties; Tenor API (GIF search) receives only search queries, no user data |
| **Cross-border data transfer** | Medium | Medium | MEDIUM | SQLite database stored on deployment server; planned data residency controls for EU hosting |

### 3.2 Special risks for vulnerable data subjects
NeuroChat processes data about and from:
- **Non-verbal individuals** using AAC who may not fully understand data implications — mitigated by simplified consent screens, supporter oversight at protected tier
- **Individuals with intellectual disabilities** — mitigated by easy-read consent, social stories explaining data use, supporter review
- **Minors aged 16-17** — mitigated by age gate, parental supporter option, safety features always-on
- **Individuals at risk of exploitation** — mitigated by Guardian Angel, trusted supporter alerts, emergency contacts

---

## 4. Measures to Address Risks

### 4.1 Technical measures (implemented)
| Measure | Implementation | Status |
|---|---|---|
| **Authentication** | JWT + bcrypt, 7-day token expiry | Implemented |
| **Authorisation** | Per-request userId extraction from JWT, admin role middleware | Implemented |
| **Password security** | bcrypt with salt rounds 10, min 6 chars | Implemented |
| **Block enforcement** | Block checks on messaging, discovery, community, conversation list | Implemented |
| **Manipulation detection** | 7 regex pattern categories + gut-check heuristics | Implemented |
| **Phone privacy** | SHA-256 hash lookup, never expose in public profiles | Implemented |
| **Audit logging** | All admin actions logged with actor, target, action, timestamp | Implemented |
| **Content moderation** | Keyword scanning with severity levels (warn/mute/ban) | Implemented |
| **Safe exit** | Triple-Escape quick exit, location.replace (no back button) | Implemented |
| **Report system** | User reports with admin review workflow (pending/reviewed/actioned/dismissed) | Implemented |
| **Data export API** | GET /api/user/profile returns all user data | Implemented |
| **Account deletion API** | DELETE /api/user/account — removes all user data | **To implement** |
| **Consent management** | Onboarding consent screen, AAC consent, supporter consent | Implemented |
| **E2E encryption** | Message encryption at rest and in transit | **Planned v2** |
| **HTTPS enforcement** | TLS on all API and WebSocket connections | Configured at deployment |
| **Rate limiting** | Per-endpoint request throttling | **To implement** |
| **Data retention automation** | Automated purge of expired energy logs, old safety alerts | **To implement** |
| **Cookie consent** | Minimal cookies (auth token only), no third-party tracking | Implemented |

### 4.2 Organisational measures
| Measure | Status |
|---|---|
| Privacy policy (GDPR-compliant) | **To draft** |
| Terms of service | **To draft** |
| Data Processing Agreement for sub-processors | **To draft** |
| Staff data protection training | **To implement** |
| Incident response plan | **To draft** |
| Regular DPIA review (every 6 months) | Scheduled |
| DPO appointment | **To appoint** |

### 4.3 User-facing controls (implemented and planned)
| Control | Description | Status |
|---|---|---|
| **Profile field optionality** | All ND-specific fields are optional | Implemented |
| **Onboarding skip** | Users can skip entire onboarding | Implemented |
| **Read receipts off by default** | Must opt-in | Implemented |
| **Typing indicators off by default** | Must opt-in | Implemented |
| **Phone number optional** | Not required for registration or use | Implemented |
| **Block/report** | Users can block anyone, report with reason | Implemented |
| **Energy visibility toggle** | Choose whether contacts see your energy | Implemented |
| **Data export** | Download all personal data | **To implement** |
| **Account deletion** | Delete account and all associated data | **To implement** |
| **Consent withdrawal** | Withdraw consent for optional processing | **To implement** |
| **Communication contract** | Mutual agreements about data sharing in conversations | Implemented |

---

## 5. Data Subject Rights

### 5.1 How rights are facilitated
| Right | Implementation |
|---|---|
| **Right of access (Art. 15)** | GET /api/user/data-export endpoint (to implement) |
| **Right to rectification (Art. 16)** | PATCH /api/user/profile — all fields editable at any time |
| **Right to erasure (Art. 17)** | DELETE /api/user/account — full cascade deletion (to implement) |
| **Right to restriction (Art. 18)** | Account deactivation without deletion (to implement) |
| **Right to data portability (Art. 20)** | JSON export of all user data (to implement) |
| **Right to object (Art. 21)** | Opt-out of manipulation detection via settings (to implement) |
| **Rights related to automated decisions (Art. 22)** | No automated decisions with legal or similarly significant effects |

---

## 6. Consultation

### 6.1 Internal consultation
- Development team: Reviewed data flows and technical measures
- Product team: Confirmed necessity of special category processing for core UX

### 6.2 Data subject consultation
- User feedback system implemented (16 aspect categories, good/better sentiment)
- Community posts allow public discussion of privacy concerns
- Planned: user research with ND community on data practices

### 6.3 DPO consultation
- DPO to be appointed prior to launch
- This DPIA to be reviewed and signed off by DPO

---

## 7. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Data Controller | [TBC] | | |
| DPO | [TBC] | | |
| Technical Lead | [TBC] | | |
| Product Lead | [TBC] | | |

**Decision**: [ ] Proceed without changes | [ ] Proceed with mitigations noted | [ ] Do not proceed | [ ] Consult supervisory authority

---

## 8. Review Schedule

| Review trigger | Action |
|---|---|
| Every 6 months (next: 2026-10-02) | Full DPIA review |
| New feature adding personal data collection | Update Section 1.2 + risk assessment |
| Data breach or near-miss | Immediate review of Section 3 + 4 |
| Change of hosting provider | Update Section 3.1 cross-border risk |
| E2E encryption implementation | Update Section 4.1, reduce message breach risk rating |
| Regulatory guidance change | Full review |

---

*This DPIA was prepared following the ICO's DPIA guidance and Article 35 of the UK GDPR / EU GDPR. It should be read alongside the NeuroChat privacy policy (to be drafted) and the technical security documentation.*
