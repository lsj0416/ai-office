import type { OfficePropPlacement } from '@/types/office'
import { TILE_SIZE, TILE_TEXTURE_SCALE } from './constants'

interface TextureLike {
  width: number
  height: number
}

export interface ResolvedPropPlacement {
  x: number
  y: number
  anchorX: number
  anchorY: number
  scale: number
  zIndex?: number
  mirror?: boolean
}

function resolveFloorAnchor(
  placement: OfficePropPlacement
): Pick<ResolvedPropPlacement, 'x' | 'y' | 'anchorX' | 'anchorY'> {
  const { col, row, footprintW, footprintH, tileAnchor, offsetX = 0, offsetY = 0 } = placement

  switch (tileAnchor) {
    case 'bottom-left':
      return {
        x: col * TILE_SIZE + offsetX,
        y: (row + footprintH) * TILE_SIZE + offsetY,
        anchorX: 0,
        anchorY: 1,
      }
    case 'bottom-center':
      return {
        x: (col + footprintW / 2) * TILE_SIZE + offsetX,
        y: (row + footprintH) * TILE_SIZE + offsetY,
        anchorX: 0.5,
        anchorY: 1,
      }
    case 'top-left':
    default:
      return {
        x: col * TILE_SIZE + offsetX,
        y: row * TILE_SIZE + offsetY,
        anchorX: 0,
        anchorY: 0,
      }
  }
}

function applyAnchorOverride(
  base: Pick<ResolvedPropPlacement, 'x' | 'y' | 'anchorX' | 'anchorY'>,
  placement: OfficePropPlacement,
  texture: TextureLike,
  scale: number
): Pick<ResolvedPropPlacement, 'x' | 'y' | 'anchorX' | 'anchorY'> {
  const anchorX = placement.anchorX ?? base.anchorX
  const anchorY = placement.anchorY ?? base.anchorY

  return {
    x: base.x + (anchorX - base.anchorX) * texture.width * scale,
    y: base.y + (anchorY - base.anchorY) * texture.height * scale,
    anchorX,
    anchorY,
  }
}

export function resolvePropPlacement(
  placement: OfficePropPlacement,
  texture: TextureLike
): ResolvedPropPlacement {
  const scale = placement.scale ?? TILE_TEXTURE_SCALE

  if (placement.kind === 'wall') {
    const base = {
      x: placement.col * TILE_SIZE + (placement.offsetX ?? 0),
      y:
      placement.row * TILE_SIZE -
      (texture.height * scale - TILE_SIZE) +
      (placement.offsetY ?? 0),
      anchorX: 0,
      anchorY: 0,
    }
    const anchored = applyAnchorOverride(base, placement, texture, scale)

    return {
      ...anchored,
      scale,
      mirror: placement.mirror,
      zIndex: placement.sortBaseY ?? placement.row * TILE_SIZE + TILE_SIZE,
    }
  }

  const anchored = applyAnchorOverride(resolveFloorAnchor(placement), placement, texture, scale)
  return {
    ...anchored,
    scale,
    mirror: placement.mirror,
    zIndex: placement.sortBaseY,
  }
}
