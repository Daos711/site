# MIT solver provenance

The solver and movement model are adapted from [Murzav/gothic-lockpick-solver](https://github.com/Murzav/gothic-lockpick-solver), revision `406971b734b318fdb205f2989918e63b9ceaa0d9`, inspected 2026-10-16.

Upstream modules: `src/lib/features/solve-lock/model/solver.ts`, `src/lib/entities/lock/model/lock.ts`, `src/lib/features/solve-lock/lib/moves.ts`, `src/lib/entities/lock/model/types.ts`, `src/lib/shared/config/index.ts`. The original copyright and complete MIT permission notice are retained in `Murzav-LICENSE.txt`.

Local changes: dependency-free imports, LockConfig API, strict input validation, CPU/state budgets, separate invalid/limit/unsolvable outcomes, replay verification before returning a solution. The layered breadth-first search retains the upstream objectives: minimal raw move count, then minimal plate switches. Index zero means the bottom plate. Physical direction is mapped separately from the position delta.

The upstream benchmark code `GgiECjKooqkyqqg` is a regression fixture, not a documented in-game chest. It must not be assigned a chest name or game version. No AGPL source, external catalog, map, or screenshot is included in these modules. Mechanically valid solutions are not a claim of PlayStation game testing.
