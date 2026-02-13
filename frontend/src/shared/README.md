# Shared Directory Guide

`src/shared` is reserved for cross-feature code.

- `ui/`: reusable UI primitives (feature-agnostic)
- `lib/`: pure utility functions without feature behavior
- `types/`: shared type declarations used by multiple features

Only promote code to this directory after confirming multi-feature reuse.
