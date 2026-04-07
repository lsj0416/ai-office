import { describe, expect, it } from 'vitest'
import { TILE_SIZE, TILE_TEXTURE_SCALE } from '../constants'
import { resolvePropPlacement } from '../placement'

describe('resolvePropPlacement', () => {
  it('pins wall-mounted assets to the wall row instead of the floor row', () => {
    const placement = resolvePropPlacement(
      {
        kind: 'wall',
        tileAnchor: 'top-left',
        footprintW: 2,
        footprintH: 2,
        col: 1,
        row: 9,
      },
      { width: 32, height: 32 }
    )

    expect(placement.x).toBe(1 * TILE_SIZE)
    expect(placement.y).toBe(9 * TILE_SIZE - (32 * TILE_TEXTURE_SCALE - TILE_SIZE))
    expect(placement.anchorX).toBe(0)
    expect(placement.anchorY).toBe(0)
  })

  it('places bottom-centered floor assets around the footprint center', () => {
    const placement = resolvePropPlacement(
      {
        kind: 'floor',
        tileAnchor: 'bottom-center',
        footprintW: 2,
        footprintH: 2,
        col: 15,
        row: 11,
      },
      { width: 32, height: 32 }
    )

    expect(placement.x).toBe((15 + 1) * TILE_SIZE)
    expect(placement.y).toBe((11 + 2) * TILE_SIZE)
    expect(placement.anchorX).toBe(0.5)
    expect(placement.anchorY).toBe(1)
  })
})
