# Trophy tracker storage and synchronization

The tracker records manual observations. It does not contact PSN or infer that a trophy was awarded. A global lesson history, a run's current state and a manually claimed PSN trophy must use different field addresses.

## Integration contract

`events.ts` exports `TrackerEvent`, `EventInput`, `FieldAddress`, `JsonValue`, `fieldKey`, `readField`, `projectEvents`, `mergeEvents`, `createEvent`, `createUndoEvent`, `parseImport` and `TrackerExport`.

An address is `{gameId, runId, entityId, field}`. `runId: null` is global; a concrete run ID belongs to that run only. `EventInput` adds `value`, optional `kind` (defaults to `set`) and optional `undoOf`. Use `store.undo(id)` rather than creating compensation metadata manually. For example, `learned-history`, `current-state` and `psn-claim` are separate fields, not one checkbox reused in three places. The application defines the semantic field names in its typed catalog.

`readField(events, address)` returns `{value, heads, conflict, alternatives, kind, incomplete}`. A missing field has `value: undefined`. A conflicting or incomplete field also has no authoritative `value`; show the alternatives and request an explicit selection. Dispatching a new set without `basis` consumes all known causal heads and resolves that conflict. A text editor must capture `readField(...).heads.map(event => event.id)` when editing starts and pass those IDs as `EventInput.basis` when saving. Use `[]` when the field was initially empty. This optional local instruction is validated against known set events of the same field, copied into `parents`, and never serialized as an event property. A remote change arriving during typing remains a competing head instead of being silently overwritten. After a successful autosave, advance the editor basis to its own returned event ID; an explicit conflict resolution can omit `basis` to consume all currently shown alternatives. Equal concurrent values agree, but both history entries remain. Logical clocks order history and check ancestry; they never select a winner over a concurrent differing value. Immutable store snapshots cache the full projection, so repeated field reads are constant-time after the first projection. Mutable drafts are never cached.

Use `increment` exclusively for additive counters; initial 6 is an increment of 6. A numeric metadata field such as chapter or reported in-game count can instead use `set`, but cannot mix set and increment on the same address. Concurrent increments add. Two devices undoing the same increment apply its compensation once. A set undo affects its own causal branch and preserves a concurrent competing branch. An edit superseded by another edit cannot be silently undone; explicit value selection or backup restoration is required. An initial set can be restored to `null` (cleared). A compensation itself is not undoable with `undo`; append an explicit intended state instead.

```ts
const store = createTrackerStore({workspaceId: user ? `user:${user.id}` : 'guest'});
// getSnapshot is stable and suitable for useSyncExternalStore.
await store.init();
const controller = user
  ? createSyncController(store, createSupabaseEventAdapter(supabase), {ownerId: user.id})
  : null;
await controller?.sync();
await store.dispatch({gameId:'gothic-1-remake',runId:null,entityId:'lesson.diving',field:'learned-history',value:true});
// Cleanup order:
controller?.dispose();
store.dispose();
```

The existing shared Supabase singleton supplies the session JWT. Create the sync controller **after** `await store.init()`. Use an effect cancellation flag and catch initialization rejection; React StrictMode may dispose an unfinished initialization and initialize the same store again. Each initialization has an epoch, and obsolete work must not publish into the new lifecycle. A disposed handle rejects writes until explicitly initialized again.

Store methods: `init`, `getSnapshot`, `subscribe`, `dispatch`, `batchDispatch`, `undo`, `exportData`, `importData`, `listBackups`, `restoreBackup`, `dispose`. Sync integration uses `mergeRemote`, `acknowledge`, `setSyncState`, `getEpoch`, `isActive`.

Snapshot fields: `workspaceId`, `status` (`loading | ready | error`), immutable `events`, `pendingIds`, `deviceId`, `error`, and `sync: {status,lastSyncedAt,error}`. Sync status is `idle | syncing | synced | offline | error`. A validation or failed write leaves the previous durable state readable, `status: ready`, and a visible error; it rejects the action promise. It never reports an unsuccessful write as saved. Fatal initialization/schema/journal-integrity failure uses `status: error` without deleting the original record.

## Durability, accounts and backups

IndexedDB database `lab-trophies-v1` holds versioned workspace records and a persistent device ID. Event changes, pending queue changes and pre-operation backups commit in one read-write transaction. Concurrent tabs read the latest record inside that transaction, preserving each other's writes. BroadcastChannel and a namespaced storage wake notify other tabs; localStorage is not the authoritative data store.

Each `user:<uuid>` workspace is isolated from `guest` and from other accounts. There is no automatic guest upload or assignment after login. Switching accounts must unmount/dispose the old store/controller before initializing the next. Pending work remains in its original workspace. Offline local access is browser-local data, not proof that the server has authenticated the user. On a shared device, previously stored data can remain locally accessible; sign-out does not silently destroy pending work.

`batchDispatch` is atomic locally and creates a backup before a multi-action change. Import and restore also make a backup in the same transaction before modifying the projection. Retention is the latest ten local snapshots. Restoration appends compensating events and never deletes or rewrites the journal; conflicts inside a backup require explicit resolution. Server history remains append-only and can reconstruct previous observations, but local named backup snapshots are not separately uploaded.

Export is `{format:'lab-trophies',version:1,exportedAt,events}` and contains no auth token or owner assignment. `parseImport(string | object)` validates a file without writing. `importData(data,{mode:'merge'})` validates all events, rejects unsupported versions, malformed IDs/JSON, broken ancestry and same-ID/different-body collisions, then merges idempotently. Existing events are never replaced. An explicit import into another workspace is an intentional user action, not an account migration inferred from file metadata. JSON string imports are bounded to 16 MiB and 50,000 events; individual events, values and parent lists also have limits.

## Cloud protocol

Only `public.trophy_events(owner_id,event_id,payload,received_at)` is added. Primary key `(owner_id,event_id)` makes retries idempotent. The client has SELECT and INSERT only; no UPDATE/DELETE grants or policies exist. RLS binds both operations to `(select auth.uid()) = owner_id` for `authenticated`; `anon` receives no access. No service-role secret is used in browser code. Existing public leaderboards and their policies are untouched.

`createSupabaseEventAdapter(client)` implements `getOwnerId`, `pullAll`, `push`. Every sync scans all owner rows in UUID keyset pages, without persisting a sequence watermark. This avoids permanently losing late commits from another transaction. A concurrent insert behind the current page is discovered by the next full scan; this is eventual convergence, not a single transaction snapshot across devices. Pagination continues until an empty page, even when the server caps page length below the requested size.

Pending IDs are acknowledged only after an exact matching event is read from the server. `ON CONFLICT DO NOTHING` cannot replace existing payloads; a read-after-insert checks their canonical content. A lost response therefore retains pending work, and the next full pull can safely acknowledge it. Changes made during an upload remain pending. Cross-device field conflicts remain explicit; no wall-clock last-write-wins overwrite occurs.

The controller checks current session owner before/after remote work and uses the store epoch to fence account changes/disposal. RLS remains authoritative if the shared client's token changes between requests. Sync owns online/focus listeners, a 30-second poll, debounced pending-work wake and bounded exponential retry; the UI should not add a duplicate polling loop. The protocol intentionally needs no Realtime subscription, server routes or background-sync support. Login and actual network upload still require internet.

## Migration and verification

Migration: `supabase/migrations/202610170001_trophy_events.sql`. Apply it only through an authorized trusted migration runner/SQL editor against the intended Supabase project, after review. This implementation does not apply it to the production project. It does not merge the feature branch or trigger a deployment.

```sh
node --test src/lib/trophies/events.test.mjs src/lib/trophies/storage.test.mjs src/lib/trophies/sync.test.mjs
node scripts/test-trophies-rls.mjs
```

`fake-indexeddb` and `@electric-sql/pglite` are development dependencies only. The RLS test creates a fresh local PostgreSQL/WASM instance, emulates Supabase's `auth.uid()` request claim, applies the actual migration, then exercises owner A/B, spoofed owner IDs, anonymous/null claims, forbidden update/delete, duplicate insert and constraints. No network, live credentials, cloud data or cloud schema are used. This proves SQL behavior under the emulated roles; it does not prove the deployed project's OAuth allowlist or JWT configuration. Those need a configured test Supabase project and two actual authorized test accounts before claiming a live two-device sync verification.

Official references: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase pagination](https://supabase.com/docs/reference/javascript/using-modifiers-range), [PGlite API](https://pglite.dev/docs/api).

## Text autosave and recovery

`AutosaveInput` accepts `label`, `value`, `heads`, `save(value,basis): Promise<string>`, `storageKey`, optional `multiline` and `type`. The save callback must reject on failure and resolve to the actual persisted event ID. Do not wrap it in a helper that catches and hides write errors. A suitable callback is `async (value,basis) => (await store.dispatch({...address,value,basis})).id`.

The storage key must include the account workspace, game, run, save and field address. Changing it creates a separate editor, so a delayed write cannot inherit another run or account's basis. The controller captures heads when editing begins, debounces writes by 400 ms and flushes on blur. Editing during an in-flight save creates a following write based only on the first returned local event. Incoming remote heads are not silently consumed.

Each keystroke also stores a small recovery record under `lab-trophies:draft:<storageKey>` in localStorage. This is a browser-local recovery draft, not authoritative progress or cloud sync. A failed write retains the text and basis; reloading restores them and attempts to save again. A storage/quota failure is visible and never marks text as saved. Before unload and the cancelable `trophies:before-reload` update event are prevented while this editor has dirty text or a pending write. Successful writes clear only the exact recovery record owned by that editor; they do not erase a newer record from another editor.

`src/lib/trophies/drafts.test.mjs` exercises debounce, remote changes during typing, edits while saving, recovery after failure, StrictMode reinitialization, another editor's newer draft and a storage quota failure. These are controller tests; browser smoke coverage must also confirm the textarea/input wiring and PWA update guard.

## Save branches and route field addresses

Save branches retain the same run ID and namespace their character fields as `save:<saveId>:<entityId>`. The main save keeps the original entity IDs. Global history and manually claimed PSN trophies keep `runId: null` and are never copied into a branch. Forking appends new starting observations; it does not rewrite the original save's events or automatically confirm a trophy.

`saveView` is an immutable read projection that removes the chosen branch prefix while preserving every event ID and its complete causal parent chain. The projection is cached by `projectEvents`. Never export or merge transformed view events: export the store's raw journal. Send edits through `saveAddress` to restore the namespace before dispatch, including editor basis IDs, which remain unchanged.

Pass `snapshot.deviceId` as the final argument of `activeSave`, `selectSaveInput` and `forkSaveInputs`. The selected branch is a per-device preference in `save-selection/active:<deviceId>`; synchronization must not make a phone unexpectedly edit the branch opened on another device. A device with no saved preference starts at the main save. The optional legacy form without a device ID remains only for backwards-compatible callers and tests.

Route rules default to run metadata (`entityId: run`). An explicit `entityId` and optional `scope: global` can read actual book stages or other existing observations. An `action:<nodeId>` field is derived from explicit completion of that route action, not a second manually entered flag. The validator checks referenced action IDs, but mutually exclusive story blockers are not dependency edges and may refer to each other. Showing future spoilers changes visibility only; it cannot promote a future-chapter action into the current recommendation.
