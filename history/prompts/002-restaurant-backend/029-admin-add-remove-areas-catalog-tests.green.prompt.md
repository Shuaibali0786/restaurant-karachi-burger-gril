---
id: 029
title: Admin add remove areas catalog tests
stage: green
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.implement
labels: ["backend", "frontend", "admin", "delivery-areas", "tests"]
links: {spec: specs/002-restaurant-backend/spec.md, ticket: null, adr: null, pr: null}
files:
 - backend/app/services/admin_catalog.py
 - backend/app/api/routes/admin/areas.py
 - backend/app/schemas/admin_catalog.py
 - backend/app/core/errors.py
 - backend/tests/integration/test_admin_catalog_api.py
 - frontend/src/components/admin/AreasTable.tsx
 - frontend/src/components/admin/MenuTable.tsx
 - frontend/src/lib/api.ts
 - frontend/tests/e2e/admin-catalog.spec.ts
tests:
 - backend ruff/mypy clean; pytest 71 passed, 103 skipped (integration needs TEST_DATABASE_URL)
 - e2e admin-catalog.spec.ts 2 passed; live curl: create 201, duplicate 409, delete used area 409, delete new area 204
---

## Prompt

Then finish the open tasks (commit after each): 1. Admin can add a brand-new delivery area (name + fee) and remove one; add the missing tests for admin menu and area edits.

## Response snapshot

POST /admin/delivery-areas (kebab-case id from the name, 409 CONFLICT on a duplicate), DELETE (204, or 409 when the area has past orders: turn it off instead). Admin UI: add form, remove with a confirm step. Added the missing admin menu/area integration tests and an e2e. Admin toggle buttons raised to 44px.
