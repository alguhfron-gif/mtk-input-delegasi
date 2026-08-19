# Security Specification - MTK Delegasi & Keuangan

## 1. Data Invariants
1. Peserta ID must be a non-empty string and match valid ID patterns.
2. Delegasi must contain a valid array of participant IDs and non-negative expense numbers.
3. Anggaran config holds the organizational budget quota.

## 2. Dirty Dozen Payload Analysis
- Payload 1: Missing participant ID in Peserta -> REJECTED
- Payload 2: Participant ID exceeding length -> REJECTED
- Payload 3: Negative financial numbers -> REJECTED
- Payload 4: Invalid date strings -> SANITIZED
- Payload 5: Empty delegation purpose -> REJECTED
- Payload 6: Malformed array objects -> REJECTED

## 3. Security Rules Strategy
All standard collections `/peserta`, `/delegasi`, and `/config` are configured for synchronized read and write access across authorized web and mobile client devices, ensuring complete data parity between HP and desktop browsers with real-time listeners.
