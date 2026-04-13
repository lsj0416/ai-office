import { TILE_SIZE } from './constants'
import type { OfficeBlockedTile, OfficeCollisionBox, OfficeProp } from '@/types/office'

export type DeskFacing = 'north' | 'south' | 'east' | 'west'

export interface DeskSceneConfig {
  col: number
  row: number
  chairFacing: DeskFacing
  chairOffsetX: number
  chairOffsetY: number
  pcFacing: DeskFacing
  pcOffsetX: number
  pcOffsetY: number
  agentFacing: DeskFacing
  agentOffsetX: number
  agentOffsetY: number
}

function blockRect(width: number, height: number): OfficeBlockedTile[] {
  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ col, row }))
  ).flat()
}

function blockRectAt(startCol: number, startRow: number, width: number, height: number): OfficeBlockedTile[] {
  return Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ col: startCol + col, row: startRow + row }))
  ).flat()
}

function deskCollisionBox(): OfficeCollisionBox[] {
  return [
    {
      offsetX: 10,
      offsetY: 40,
      width: TILE_SIZE * 3 - 16,
      height: TILE_SIZE + 14,
    },
  ]
}

// Tweak per-desk computer/agent facing and offsets here.
export const DESK_SCENE_CONFIGS: DeskSceneConfig[] = [
  { col: 4, row: 3, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 4, row: 4, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 8, row: 3, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 8, row: 4, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 17, row: 3, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 21, row: 3, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 17, row: 4, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 21, row: 4, chairFacing: 'north', chairOffsetX: 48, chairOffsetY: 30, pcFacing: 'south', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'north', agentOffsetX: 72, agentOffsetY: 120 },
  { col: 4, row: 8, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 8, row: 8, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 17, row: 8, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
  { col: 21, row: 8, chairFacing: 'south', chairOffsetX: 48, chairOffsetY: -40, pcFacing: 'north', pcOffsetX: 48, pcOffsetY: 12, agentFacing: 'south', agentOffsetX: 72, agentOffsetY: 65 },
]

export const DESK_COLLISION_PROPS: OfficeProp[] = DESK_SCENE_CONFIGS.map(({ col, row }) => ({
  asset: 'deskFront',
  placement: {
    kind: 'floor',
    tileAnchor: 'top-left',
    footprintW: 2,
    footprintH: 2,
    col,
    row,
  },
  blocksMovement: true,
  collisionBoxes: deskCollisionBox(),
}))

export const OFFICE_PROPS: OfficeProp[] = [
  {
    asset: 'doubleBookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 1, row: 1, offsetY: 18 },
  },
  {
    asset: 'doubleBookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 24, row: 1, offsetY: 18 },
  },
  {
    asset: 'hangingPlant',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 6, row: 1, offsetY: 10 },
  },
  {
    asset: 'hangingPlant',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 21, row: 1, offsetY: 10 },
  },
  {
    asset: 'largePainting',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 12, row: 1, offsetY: -8 },
  },
  {
    asset: 'clock',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 15, row: 1, offsetX: 10, offsetY: -8 },
  },
  {
    asset: 'whiteboard',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 2, col: 2, row: 11, offsetX: 10 },
  },
  {
    asset: 'bookshelf',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 2, footprintH: 1, col: 8, row: 10.3, offsetX: 14 },
  },
  {
    asset: 'smallPainting',
    placement: { kind: 'wall', tileAnchor: 'top-left', footprintW: 1, footprintH: 2, col: 23, row: 10.7, offsetX: 10 },
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 2.5, row: 12.5 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 5.2, row: 12.5 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 2.5, row: 13.5 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'deskFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 5.2, row: 13.5 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 2.8, row: 15.2 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 4.2, row: 15.2 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 5.6, row: 15.2 },
  },
  {
    asset: 'chairBack',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 7, row: 15.2 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 2.8, row: 12.6 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 4.2, row: 12.6 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 5.6, row: 12.6 },
  },
  {
    asset: 'chairFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 7, row: 12.6 },
  },
  {
    asset: 'chairSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 1.4, row: 13.8, anchorY: 1, offsetX: 10 },
  },
  {
    asset: 'chairSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 8.3, row: 13.8, mirror: true, anchorY: 1, offsetX: 34 },
  },
  {
    asset: 'largePlant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 3, col: 9, row: 14 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'sofaFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 18.7, row: 11 },
    blocksMovement: true,
    blockedTiles: blockRectAt(0, 1, 2, 1),
  },
  {
    asset: 'coffeeTable',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 18.7, row: 12.4 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'sofaSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 22, row: 12.1 },
    blocksMovement: true,
    blockedTiles: blockRect(1, 2),
  },
  {
    asset: 'sofaSide',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 25, row: 12.1, mirror: true, offsetX: 48 },
    blocksMovement: true,
    blockedTiles: blockRect(1, 2),
  },
  {
    asset: 'coffeeTable',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 23, row: 12.3 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'smallTableFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 18, row: 15 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'smallTableFront',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 2, footprintH: 2, col: 22, row: 15 },
    blocksMovement: true,
    blockedTiles: blockRect(2, 2),
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 1, row: 15 },
    blocksMovement: true,
    blockedTiles: blockRect(1, 1),
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 17, row: 15 },
    blocksMovement: true,
    blockedTiles: blockRect(1, 1),
  },
  {
    asset: 'plant',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 2, col: 26, row: 15 },
    blocksMovement: true,
    blockedTiles: blockRect(1, 1),
  },
  {
    asset: 'bin',
    placement: { kind: 'floor', tileAnchor: 'bottom-left', footprintW: 1, footprintH: 1, col: 25, row: 16 },
  },
]

export const OFFICE_COLLISION_PROPS: OfficeProp[] = [...DESK_COLLISION_PROPS, ...OFFICE_PROPS]
