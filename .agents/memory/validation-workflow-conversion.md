---
name: Validation workflow conversion
description: How to change the command of the "test" validation workflow without losing its isValidation flag.
---

The `test` workflow is a validation workflow (`isValidation = true` in `.replit`).

**Rule:** To change its command, use `setValidationCommand({ name: "test", command: ... })`. Do NOT use `configureWorkflow` — that recreates it as a plain workflow and silently drops `isValidation`, so it stops running as a CI gate on task completion.

**Why:** `setValidationCommand` refuses to upsert over a non-validation workflow of the same name (`PROHIBITED_ACTION`). If the flag was already lost, recover with `removeWorkflow({ name: "test" })` then `setValidationCommand(...)`.

**How to apply:** Any time the test command changes (new suite added, filter changed), edit via `setValidationCommand` and verify `.replit` still shows `isValidation = true`.
