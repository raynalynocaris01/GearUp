# Guide Application Feature — Migration & Rollback Notes

## Overview

The guide verification feature introduces two new tables/columns:

- `guide_applications` — audit trail of every guide application
- `tour_guides.approval_status` — `approved` / `pending` / `under_review` / `rejected` / `legacy`
- `tour_guides.application_id` — link to the most recent guide application

Existing guides created **before** this feature was deployed are marked `approval_status = 'legacy'` by the migration's backfill. Legacy guides remain **bookable** and **publicly visible** — they are not shown in the admin "pending review" queue.

## Fresh deployment

No action needed. The migration runs the backfill automatically:

```sql
UPDATE tour_guides SET approval_status = 'legacy' WHERE approval_status IS NULL;