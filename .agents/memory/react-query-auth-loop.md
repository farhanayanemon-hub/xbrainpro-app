---
name: React Query auth loading loop
description: Infinite spinner + request flood when multiple components share an errored auth query
---

Rule: In TanStack Query v5, if an auth gate shows a spinner on `isLoading` and its children ALSO call the same query hook, keep `retryOnMount: false` in the QueryClient defaults.

**Why:** With default `retryOnMount: true`, a child observer mounting on an errored no-data query refetches and resets it to `pending`, flipping the gate back to the spinner, unmounting the child, and looping forever (~20 req/s of 401s to /api/auth/me; app stuck on "Initializing..." both in dev and prod).

**How to apply:** The shared QueryClient in the web app sets `retry: false, retryOnMount: false`. Auth transitions rely on explicit `invalidateQueries` after login/register and `queryClient.clear()` on logout — do not remove those when refactoring. Symptom to recognize: server logs flooded with fast repeating 401s on the current-user endpoint + endless loading screen.
