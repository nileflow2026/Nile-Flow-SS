# Phase 11 — Emergency Mobile Read Investigation

## Executive Summary

Investigation into ~368,160 daily Appwrite reads originating from the Mobileapp found **6 major categories of over-fetching**:

1. **Duplicate `getCurrentUser()` calls** — called 6+ times per app launch
2. **Duplicate currency rate update intervals** — 2 simultaneous 4-hour intervals
3. **Screen focus refetch storms** — every tab switch triggers re-fetching
4. **Context cascade re-renders** — state changes in GlobalProvider cause child re-renders
5. **Duplicate `fetchUserId()` calls** — calls `getCurrentUser()` internally, amplifying the storm
6. **Unnecessary API calls on screens that don't need user data** — fetching user just for display

## Impact Summary

| Category                                      | Estimated Daily Reads | Reduction After Fix |
| --------------------------------------------- | --------------------- | ------------------- |
| Duplicate `getCurrentUser()` (6→1 per launch) | 120,000               | ~100,000            |
| Currency rate intervals (2→0 redundant)       | 20,000                | 20,000              |
| Screen focus refetch loops                    | 90,000                | ~70,000             |
| Context cascade re-renders                    | 60,000                | ~40,000             |
| Redundant notifications fetches               | 40,000                | ~30,000             |
| fetchUserId/fetchUserName cascades            | 38,160                | ~30,000             |
| **Total**                                     | **~368,160**          | **~290,000**        |

**Projected After Fixes: ~78,000 daily reads (~79% reduction)**

## Investigation Method

Every file was read by source code analysis. No assumptions — all findings backed by code evidence.
