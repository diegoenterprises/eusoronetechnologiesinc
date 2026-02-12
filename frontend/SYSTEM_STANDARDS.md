# EusoTrip Platform — System-Wide Standards

## 1. Address Entry — Google Maps Places API Required
ALL address input fields across the entire platform MUST use the `AddressAutocomplete` component (`@/components/AddressAutocomplete.tsx`) which integrates with the Google Maps Places API.

- **Auto-fill**: city, state, zip, lat, lng from selected place
- **Distance calc**: Use `haversineDistance()` or Google Directions API for mileage
- **Pages that need this**: LoadCreationWizard ✅, ShipperDispatchControl ✅, LoadWizard ✅, RecurringLoadScheduler ✅, Agreement Wizard lanes (TODO), any future address entry

## 2. Calendar Components — Modern UI Standard
All calendar/date picker components must use the modern branded calendar UI as seen in `LoadCreationWizard.tsx` (Image 5 reference).
- Rounded corners, gradient highlights for selected date
- Consistent across all pages: agreements, recurring loads, dispatch, etc.

## 3. Agreements — Party Information
- Party A and Party B must always show **Company Name** + **Authorized Signatory Name** separately
- Never auto-fill the logged-in user's personal name as both parties
- Jurisdiction field is required for all agreements
- Numerical clause values (termination notice days, non-circumvention months, notice effective days) must be configurable inputs

## 4. Liability Shield — Eusorone Technologies, Inc.
All generated agreements must include language shielding Eusorone Technologies, Inc. from disputes between parties. The platform acts as a neutral facilitator. Dispute resolution clauses should reference the EusoTrip platform's arbitration process.
