/**
 * AgentFSM — 에이전트 행동 상태 기계
 *
 * 상태 전환:
 *   IDLE_AT_DESK ─(idleTimer 초과)→ WANDERING ─(목적지 도착)→ RETURNING ─(책상 복귀)→ IDLE_AT_DESK
 *
 * 좌표: 월드 픽셀 단위 (TILE_SIZE = 48px 기준)
 */

import type { AgentFSMStateType, TilePos } from '@/types/office'
import type { Direction } from '../sprites/CharacterSprite'
import { TILE_SIZE, MAP_COLS, MAP_ROWS, AGENT_FSM } from '../constants'
import { isTileWalkable } from '../tilemap'
import { bfsPath } from '../pathfinding/bfs'

interface Waypoint {
  x: number
  y: number
}

export interface AgentFSMState {
  state: AgentFSMStateType
  worldX: number
  worldY: number
  direction: Direction
  isMoving: boolean
}

export interface AgentFSM {
  tick(deltaMs: number): void
  getState(): AgentFSMState
}

// ─── 내부 상태 ────────────────────────────────────────────────────────────────

interface Internal {
  state: AgentFSMStateType
  worldX: number
  worldY: number
  direction: Direction
  path: Waypoint[]
  idleTimer: number
  wanderInterval: number
  deskWorldX: number
  deskWorldY: number
  exitTileCol: number
  exitTileRow: number
}

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function tileCenter(col: number, row: number): Waypoint {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  }
}

function randomWanderInterval(): number {
  const range = AGENT_FSM.WANDER_INTERVAL_MAX - AGENT_FSM.WANDER_INTERVAL_MIN
  return AGENT_FSM.WANDER_INTERVAL_MIN + Math.random() * range
}

/** 책상 주변 랜덤 워크 목적지 선택 (출발 타일 근처 ±4열, ±3행) */
function pickRandomDest(exitCol: number, exitRow: number): TilePos | null {
  for (let attempt = 0; attempt < 30; attempt++) {
    const col = exitCol + Math.floor(Math.random() * 9) - 4
    const row = exitRow + Math.floor(Math.random() * 7) - 3
    if (col >= 1 && col < MAP_COLS - 1 && row >= 1 && row < MAP_ROWS - 1) {
      if (isTileWalkable(col, row)) {
        return { col, row }
      }
    }
  }
  return null
}

function bfsToWaypoints(from: TilePos, to: TilePos): Waypoint[] {
  const path = bfsPath(from, to, isTileWalkable)
  return path.map((p) => tileCenter(p.col, p.row))
}

// ─── 이동 처리 ───────────────────────────────────────────────────────────────

function tickMovement(internal: Internal): void {
  if (internal.path.length === 0) return

  const target = internal.path[0]
  if (!target) return
  const dx = target.x - internal.worldX
  const dy = target.y - internal.worldY
  const dist = Math.sqrt(dx * dx + dy * dy)

  if (dist <= AGENT_FSM.ARRIVAL_THRESHOLD) {
    // 웨이포인트 도달 — 새 배열로 교체 (불변 패턴)
    internal.path = internal.path.slice(1)
    internal.worldX = target.x
    internal.worldY = target.y
  } else {
    const step = Math.min(AGENT_FSM.MOVE_SPEED, dist)
    internal.worldX += (dx / dist) * step
    internal.worldY += (dy / dist) * step

    // 이동 방향 업데이트
    if (Math.abs(dx) >= Math.abs(dy)) {
      internal.direction = dx > 0 ? 'right' : 'left'
    } else {
      internal.direction = dy > 0 ? 'down' : 'up'
    }
  }
}

// ─── 상태 전환 ───────────────────────────────────────────────────────────────

function startWandering(internal: Internal): void {
  const dest = pickRandomDest(internal.exitTileCol, internal.exitTileRow)
  if (!dest) return

  const exitTile: TilePos = { col: internal.exitTileCol, row: internal.exitTileRow }
  const exitWaypoint = tileCenter(exitTile.col, exitTile.row)
  const destWaypoints = bfsToWaypoints(exitTile, dest)

  internal.path = [exitWaypoint, ...destWaypoints]
  internal.state = 'WANDERING'
}

function startReturning(internal: Internal): void {
  const currentCol = Math.floor(internal.worldX / TILE_SIZE)
  const currentRow = Math.floor(internal.worldY / TILE_SIZE)

  const exitTile: TilePos = { col: internal.exitTileCol, row: internal.exitTileRow }
  const returnWaypoints = bfsToWaypoints({ col: currentCol, row: currentRow }, exitTile)

  // 출발 타일이 이미 exit tile 이라면 빈 경로가 올 수 있음 — exit center 보장
  const exitWaypoint = tileCenter(exitTile.col, exitTile.row)
  const allWaypoints = [...returnWaypoints, exitWaypoint]

  // 중복 끝점 제거
  const previousWaypoint = allWaypoints[allWaypoints.length - 2]
  const deduplicated =
    allWaypoints.length >= 2 &&
    previousWaypoint?.x === exitWaypoint.x &&
    previousWaypoint?.y === exitWaypoint.y
      ? allWaypoints.slice(0, -1)
      : allWaypoints

  internal.path = deduplicated
  internal.state = 'RETURNING'
}

function finishReturning(internal: Internal): void {
  internal.worldX = internal.deskWorldX
  internal.worldY = internal.deskWorldY
  internal.direction = 'down'
  internal.path = []
  internal.state = 'IDLE_AT_DESK'
  internal.idleTimer = 0
  internal.wanderInterval = randomWanderInterval()
}

// ─── 공개 팩토리 ─────────────────────────────────────────────────────────────

export function createAgentFSM(deskCol: number, deskRow: number, deskIndex: number): AgentFSM {
  const deskWorldX = deskCol * TILE_SIZE + TILE_SIZE / 2
  const deskWorldY = deskRow * TILE_SIZE + 16 // 책상 위면에 착석

  const internal: Internal = {
    state: 'IDLE_AT_DESK',
    worldX: deskWorldX,
    worldY: deskWorldY,
    direction: 'down',
    path: [],
    idleTimer: deskIndex * AGENT_FSM.PHASE_OFFSET_MS, // 에이전트 간 시간 분산
    wanderInterval: randomWanderInterval(),
    deskWorldX,
    deskWorldY,
    exitTileCol: deskCol,
    exitTileRow: deskRow + 1, // 책상 바로 아래 통로
  }

  return {
    tick(_deltaMs: number): void {
      switch (internal.state) {
        case 'IDLE_AT_DESK':
          internal.idleTimer += _deltaMs
          if (internal.idleTimer >= internal.wanderInterval) {
            startWandering(internal)
          }
          break

        case 'WANDERING':
          tickMovement(internal)
          if (internal.path.length === 0) {
            startReturning(internal)
          }
          break

        case 'RETURNING':
          tickMovement(internal)
          if (internal.path.length === 0) {
            finishReturning(internal)
          }
          break
      }
    },

    getState(): AgentFSMState {
      return {
        state: internal.state,
        worldX: internal.worldX,
        worldY: internal.worldY,
        direction: internal.direction,
        isMoving: internal.state !== 'IDLE_AT_DESK',
      }
    },
  }
}
