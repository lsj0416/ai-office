# Office Layout / Collision Checkpoint

Date: 2026-04-09
Branch: `feature/pixi-office`
Baseline commit: `17d7ae3` (`style(design): refine workspace internal layouts`)
Working tree at save time: clean

## Goal

Fix the office scene so furniture placement, collision blocking, and pathfinding all come from the same source of truth.

Right now the office renders more furniture than it actually blocks.

## Current Problem

The data model is split three ways:

- [constants.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/constants.ts)
  Desk presets, desk positions, player/world constants
- [manifest.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/manifest.ts)
  Render-only furniture placements in `OFFICE_PROPS`
- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts)
  Hardcoded player collision in `intersectsDeskCollision`

That causes these bugs:

- Only desks from `DESK_POSITIONS` are blocked
- Other furniture is visual-only
- BFS and FSM walkability only know about the tile map
- Desk layout is duplicated across desk scene config and manifest placement
- Fractional `col` and `row` values make collision inference harder

## Files That Matter

- [constants.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/constants.ts)
- [manifest.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/manifest.ts)
- [tilemap.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/tilemap.ts)
- [placement.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/placement.ts)
- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts)
- [AgentFSM.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/fsm/AgentFSM.ts)
- [bfs.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/pathfinding/bfs.ts)
- [office.ts](/Users/sejong/Desktop/Project/ai-office/src/types/office.ts)

## Observed Hotspots

Hardcoded desk-only collision:

- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts#L108)
- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts#L135)

Desk presets duplicated into positions:

- [constants.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/constants.ts#L78)
- [constants.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/constants.ts#L94)

Render placements are separate from collision:

- [manifest.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/manifest.ts#L40)
- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts#L743)

Pathfinding still uses tile-only walkability:

- [tilemap.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/tilemap.ts#L32)
- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts#L189)
- [AgentFSM.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/fsm/AgentFSM.ts#L74)

## Recommended Refactor Plan

### Phase 1. Separate layout data from true constants

Create a new file:

- `src/components/office/layout.ts`

Move office layout data there:

- desk scene configs
- desk cluster positions
- furniture presets that are gameplay-relevant
- any future zone-level placement presets

Keep [constants.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/constants.ts) for:

- tile size
- map/world size
- player motion constants
- rendering scale constants

### Phase 2. Add collision metadata to office props

Extend [office.ts](/Users/sejong/Desktop/Project/ai-office/src/types/office.ts) so furniture placement can express blocking.

Suggested additions:

```ts
export interface OfficeCollisionBox {
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface OfficeBlockedTile {
  col: number
  row: number
}
```

Suggested prop shape update:

```ts
collisionBoxes?: OfficeCollisionBox[]
blockedTiles?: OfficeBlockedTile[]
blocksMovement?: boolean
```

Use this in [manifest.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/manifest.ts) for:

- desks
- sofas
- coffee tables
- shelves
- plants that should block

Keep paintings / hanging decor non-blocking.

### Phase 3. Build a derived collision layer

Create:

- `src/components/office/collision.ts`

Responsibilities:

- derive world-space collision boxes from office props
- derive tile-space blocked cells for BFS/FSM
- expose helpers like:

```ts
buildOfficeCollisionMap(...)
intersectsBlockingProps(...)
isBlockedByFurniture(...)
```

Important rule:

- Do not hand-maintain separate desk collision math in the hook
- Derive collision from the same office layout data used for rendering

### Phase 4. Replace desk-only player collision

Update [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts):

- remove `DESK_POSITIONS` dependency from collision
- remove `intersectsDeskCollision`
- change `canMoveTo` to use derived blocking boxes

Target outcome:

- player cannot walk through sofas, tables, shelves, plants, desk clusters
- collision logic is not special-cased for desks only

### Phase 5. Make BFS and FSM use furniture blocking

Update walkability so it becomes:

- tilemap says whether the base tile is legal
- derived furniture blocking says whether furniture occupies it

Touch:

- [tilemap.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/tilemap.ts)
- [usePixiOffice.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/hooks/usePixiOffice.ts)
- [AgentFSM.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/fsm/AgentFSM.ts)

Preferred direction:

- avoid mutating `OFFICE_MAP`
- compose `isBaseTileWalkable` + `isFurnitureBlocked`

### Phase 6. Reduce desk duplication

Today desk layout is effectively duplicated between:

- `DESK_SCENE_CONFIGS`
- `DESK_POSITIONS`
- desk props inside `OFFICE_PROPS`

Refactor so desk clusters are declared once and everything else derives from them:

- desk render props
- chair/pc offsets
- agent seat positions
- collision boxes

### Phase 7. Normalize weird fractional placements

`OFFICE_PROPS` currently has many fractional positions like:

- `2.5`
- `12.5`
- `10.3`

That is survivable for render placement, but weak for collision and pathfinding.

Rule for cleanup:

- use tile-based anchors for layout structure
- use offsets only for sprite alignment
- avoid encoding collision shape by fractional tile coordinates

### Phase 8. Add debug overlay

Useful for one session while refactoring.

Add a lightweight debug mode such as:

- query param `?debugCollision=1`
- local boolean flag in office hook

Show:

- blocking tile overlay
- collision AABB rectangles
- maybe seat anchors

This will save time immediately.

### Phase 9. Test coverage

Add or extend tests for:

- [placement.test.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/__tests__/placement.test.ts)
- [tilemap.test.ts](/Users/sejong/Desktop/Project/ai-office/src/components/office/__tests__/tilemap.test.ts)
- new `collision.test.ts`

Minimum assertions:

- non-blocking decor does not block movement
- sofa / table / shelf / desk clusters do block movement
- BFS does not route through blocked lounge or meeting furniture
- nearest walkable tile fallback still works near dense furniture

## Execution Order

Use this order. Do not jump around.

1. Create `layout.ts` and move non-constant layout data out of `constants.ts`
2. Extend office types for blocking metadata
3. Add blocking metadata to `OFFICE_PROPS`
4. Build `collision.ts`
5. Replace player collision in `usePixiOffice.ts`
6. Update BFS/FSM walkability composition
7. Clean up duplicated desk declarations
8. Add debug overlay
9. Add tests
10. Re-run office screen QA

## Definition Of Done

- All blocking furniture is derived from one source of truth
- Player movement respects all intended blockers, not only desks
- Agent pathfinding respects the same blockers
- No desk-specific collision function remains
- Tests cover blocking vs non-blocking furniture
- Office scene still renders correctly

## Good First Slice For Next Session

If time is limited, do only this slice first:

1. Add blocking metadata to `OfficeProp`
2. Build `collision.ts`
3. Replace `intersectsDeskCollision` with generic prop collision
4. Add one regression test for sofa/table blocking

That is the highest-value vertical slice.

## Suggested Next Session Prompt

Use this verbatim:

```text
Continue from docs/office-layout-collision-checkpoint-2026-04-09.md.
Implement Phase 1 through Phase 4 first:
- move office layout data out of constants.ts
- add collision metadata to office props/types
- create a derived collision utility
- replace desk-only collision in usePixiOffice.ts
Keep the work incremental, run tests/type-check, and do not touch unrelated workspace pages.
```

## Notes

- The visible office page in headless browse is not reliable for WebGL quality review.
- Browser QA for office should be done after collision logic is fixed, ideally with a real browser or screenshot from the visible app.
