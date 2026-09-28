---
id: 028
title: ADR customer and admin sessions
stage: misc
date: 2026-09-28
surface: agent
model: claude-sonnet-5
feature: 002-restaurant-backend
branch: 002-restaurant-backend
user: Shuaibali0786
command: /sp.adr
labels: ["adr", "auth", "sessions"]
links:
  spec: specs/002-restaurant-backend/spec.md
  ticket: null
  adr: history/adr/0005-customer-and-admin-sessions.md
  pr: null
files:
 - history/adr/0005-customer-and-admin-sessions.md
tests:
 - none (documentation)
---

## Prompt

Write the ADR: /sp.adr customer-and-admin-sessions.

## Response snapshot

ADR-0002 already covers the cookie, JWT and roles, so ADR-0005 records what the implementation added on top: two login doors on one shared session, per-request role re-read, viewer-based order visibility (admin/owner/public), guests as first-class, and the one-identity-per-browser consequence. Extends 0002, no conflict.
