# UI/UX Production Upgrade Specification

## 1. Preserve the prototype identity

The prototype has a distinctive editorial visual language: - warm
paper; - ink typography; - botanical green; - terracotta; - thin
rules; - tactile surfaces; - serif editorial headings; - restrained SaaS
behavior.

Do not replace it with a generic blue/neon dashboard.

------------------------------------------------------------------------

## 2. Existing UI surfaces

Current prototype includes: - Home/Studio. - Static builder. - Dynamic
builder. - Sign in. - Dashboard shelf. - QR detail. - Scan Book
analytics. - Margin Notes activity. - Version History.

These should be evolved rather than discarded.

------------------------------------------------------------------------

## 3. Production navigation

Recommended:

``` text
Studio
QR Codes
Analytics
Folders
Campaigns
Landing Pages
Team
Billing
Settings
```

If the single-route navigation constraint remains, keep client-side view
state but add URL-addressable state where deep linking is important.

------------------------------------------------------------------------

## 4. Dynamic QR builder

Current mental model is good:

> Where should it go?

Keep this.

Add: - Static/Dynamic switch; - content type; - destination
validation; - advanced options; - scan URL; - plan/usage warning; -
accessibility; - save draft; - publish.

Primary reassurance:

> This QR code stays the same. Only its destination changes.

------------------------------------------------------------------------

## 5. Publish screen

After creation show:

-   QR preview;
-   scan URL;
-   copy;
-   download;
-   test scan;
-   open QR;
-   view analytics;
-   edit destination.

Do not show fake analytics.

If no scans exist: `No scans yet. Try scanning this QR with your phone.`

------------------------------------------------------------------------

## 6. Dashboard

Current "studio shelf" metaphor is strong.

Add: - total QR; - dynamic QR; - scans; - estimated unique visitors; -
plan usage; - search; - filters; - sorting; - folders; - campaign.

------------------------------------------------------------------------

## 7. QR detail

Tabs:

### Overview

QR, destination, status, actions.

### Analytics

Scan Book.

### Destination history

Version history.

### Activity

Margin Notes.

### Design

Appearance controls.

### Settings

Optional advanced settings.

------------------------------------------------------------------------

## 8. Destination editor

Must visually communicate:

``` text
Printed QR
     ↓
stays unchanged

Current destination
     ↓
edit
     ↓
new destination
```

Confirmation:

> Updating this destination will not require you to reprint the QR code.

------------------------------------------------------------------------

## 9. Status controls

Use clear destructive confirmation for archive/delete.

States: - Active - Paused - Archived

Status should be shown with both text and visual indicator.

------------------------------------------------------------------------

## 10. Analytics

Current "Scan Book" metaphor should remain.

Add: - date picker; - timezone; - metric definitions; - live/test
distinction; - export; - empty state; - data retention indicator where
relevant.

Do not present estimated metrics as exact personal identities.

------------------------------------------------------------------------

## 11. Landing page builder

Add constrained templates first: - product; - contact; - event; -
restaurant/menu; - campaign; - app download.

Components: - logo; - heading; - text; - image; - CTA; - contact; -
social links.

------------------------------------------------------------------------

## 12. Accessibility

Target WCAG 2.1 AA.

Requirements: - keyboard navigation; - visible focus; - semantic
headings; - form labels; - accessible chart alternatives; - no
color-only status; - reduced motion; - touch targets; - screen-reader
friendly dialogs; - accessible QR download actions.

------------------------------------------------------------------------

## 13. Mobile

Dynamic QR creation must be comfortable on a phone.

Desktop: - preview left; - controls right.

Mobile: - preview; - content; - design; - publish action; - sticky
bottom action where appropriate.

------------------------------------------------------------------------

## 14. Loading/error states

Use skeletons for dashboard/detail.

Errors: - explain; - provide recovery; - never show stack traces.

------------------------------------------------------------------------

## 15. Empty states

### No QR

`Your shelf is empty.`

### No scans

`No scans yet.`

### No analytics

Explain that real scans will populate the dashboard.

------------------------------------------------------------------------

## 16. Plan UX

Do not block a QR scan because of a plan downgrade unless product policy
explicitly requires it.

Existing printed QR codes should generally continue redirecting.

Restrict new creation/features according to entitlement.

------------------------------------------------------------------------

## 17. Prototype-specific cleanup

Remove demo-specific language and behavior before production: - seeded
scan counts; - simulated geography; - "demo studio credentials"; -
test-only analytics presented as real.

Keep "Record a test scan" but label it explicitly as test data.
