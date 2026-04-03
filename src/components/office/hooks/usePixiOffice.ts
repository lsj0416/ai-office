'use client'

import { useEffect, useRef, useState } from 'react'
import type { Application, Graphics } from 'pixi.js'
import type { OfficeAgent, NearbyAgent } from '@/types/office'
import {
  TILE_SIZE,
  MAP_COLS,
  MAP_ROWS,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  T_FLOOR,
  T_WALL,
  T_DESK,
  T_MEETING,
  T_BREAK,
  COLORS,
  DESK_POSITIONS,
  PLAYER_START,
  PLAYER_SPEED,
  PLAYER_HALF,
  PROXIMITY_TILES,
} from '../constants'
import { OFFICE_MAP, isTileWalkable } from '../tilemap'
import {
  createAgentCharacter,
  createPlayerCharacter,
  type CharacterSprite,
  type Direction,
} from '../sprites/CharacterSprite'
import { createDeskSprite } from '../sprites/DeskSprite'

interface UsePixiOfficeOptions {
  containerRef: React.RefObject<HTMLDivElement>
  agents: OfficeAgent[]
}

interface UsePixiOfficeReturn {
  nearbyAgent: NearbyAgent | null
}

// ─── 타일맵 렌더링 (T_DESK는 바닥만 — DeskSprite가 위를 덮음) ─────────────

function drawTilemap(gfx: Graphics) {
  for (let row = 0; row < MAP_ROWS; row++) {
    for (let col = 0; col < MAP_COLS; col++) {
      const tile = OFFICE_MAP[row]?.[col] ?? T_FLOOR
      const x = col * TILE_SIZE
      const y = row * TILE_SIZE

      switch (tile) {
        case T_WALL:
          gfx.beginFill(COLORS.wall)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          gfx.beginFill(COLORS.wallAccent)
          gfx.drawRect(x, y, TILE_SIZE, 5)
          gfx.endFill()
          break

        case T_DESK:
          // DeskSprite가 위에 올라가므로 floor 색만 깔아둠
          gfx.beginFill(COLORS.floor)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break

        case T_MEETING:
          gfx.beginFill(COLORS.meeting)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break

        case T_BREAK:
          gfx.beginFill(COLORS.breakRoom)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break

        default: // T_FLOOR
          gfx.beginFill(COLORS.floor)
          gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
          gfx.endFill()
          break
      }

      // 그리드 라인 (벽 제외)
      if (tile !== T_WALL) {
        gfx.lineStyle(0.5, COLORS.gridLine, 0.5)
        gfx.drawRect(x, y, TILE_SIZE, TILE_SIZE)
        gfx.lineStyle(0)
      }
    }
  }
}

function drawRoomLabels(
  PIXI: typeof import('pixi.js'),
  container: import('pixi.js').Container,
) {
  const style = new PIXI.TextStyle({
    fontFamily: 'sans-serif',
    fontSize: 13,
    fontWeight: 'bold',
    fill: 0x888899,
  })

  const meeting = new PIXI.Text('🤝 회의실', style)
  meeting.x = 1 * TILE_SIZE + 8
  meeting.y = 9 * TILE_SIZE + 8
  container.addChild(meeting)

  const breakRoom = new PIXI.Text('☕ 탕비실', style)
  breakRoom.x = 11 * TILE_SIZE + 8
  breakRoom.y = 9 * TILE_SIZE + 8
  container.addChild(breakRoom)
}

// ─── 충돌 검사 ────────────────────────────────────────────────────────────────

function canMoveTo(nx: number, ny: number): boolean {
  const h = PLAYER_HALF
  return (
    isTileWalkable(Math.floor((nx - h) / TILE_SIZE), Math.floor((ny - h) / TILE_SIZE)) &&
    isTileWalkable(Math.floor((nx + h) / TILE_SIZE), Math.floor((ny - h) / TILE_SIZE)) &&
    isTileWalkable(Math.floor((nx - h) / TILE_SIZE), Math.floor((ny + h) / TILE_SIZE)) &&
    isTileWalkable(Math.floor((nx + h) / TILE_SIZE), Math.floor((ny + h) / TILE_SIZE))
  )
}

// ─── 근접 감지 ────────────────────────────────────────────────────────────────

function findNearbyAgent(
  playerX: number,
  playerY: number,
  agents: OfficeAgent[],
): NearbyAgent | null {
  const playerCol = Math.floor(playerX / TILE_SIZE)
  const playerRow = Math.floor(playerY / TILE_SIZE)

  for (const agent of agents) {
    const pos = DESK_POSITIONS[agent.deskIndex]
    if (!pos) continue
    const [deskCol, deskRow] = pos
    const dist = Math.abs(deskCol - playerCol) + Math.abs(deskRow - playerRow)
    if (dist <= PROXIMITY_TILES) {
      return { agent, deskCol, deskRow }
    }
  }
  return null
}

// ─── 훅 ──────────────────────────────────────────────────────────────────────

export function usePixiOffice({ containerRef, agents }: UsePixiOfficeOptions): UsePixiOfficeReturn {
  const [nearbyAgent, setNearbyAgent] = useState<NearbyAgent | null>(null)
  const appRef = useRef<Application | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    async function init() {
      const PIXI = await import('pixi.js')
      if (destroyed || !containerRef.current) return

      // ── Pixi Application ───────────────────────────────────────────────────
      const app = new PIXI.Application({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: COLORS.floor,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      appRef.current = app
      containerRef.current.appendChild(app.view as HTMLCanvasElement)

      // ── 레이어 0: 정적 타일맵 배경 ────────────────────────────────────────
      const mapGfx = new PIXI.Graphics()
      drawTilemap(mapGfx)
      app.stage.addChild(mapGfx)

      // ── 레이어 1: 방 이름 레이블 ──────────────────────────────────────────
      const labelContainer = new PIXI.Container()
      drawRoomLabels(PIXI, labelContainer)
      app.stage.addChild(labelContainer)

      // ── 레이어 2: Y-sort 게임 오브젝트 컨테이너 ───────────────────────────
      const gameContainer = new PIXI.Container()
      gameContainer.sortableChildren = true   // ← Y-sort 핵심
      app.stage.addChild(gameContainer)

      // ── 책상 스프라이트 (모든 DESK_POSITIONS에 생성) ──────────────────────
      DESK_POSITIONS.forEach(([col, row]) => {
        const desk = createDeskSprite(PIXI, {
          worldX: col * TILE_SIZE,
          worldY: row * TILE_SIZE,
        })
        gameContainer.addChild(desk.container)
      })

      // ── 에이전트 캐릭터 스프라이트 ────────────────────────────────────────
      type AgentEntry = { sprite: CharacterSprite; agent: OfficeAgent }
      const agentEntries: AgentEntry[] = agents.map((agent) => {
        const sprite = createAgentCharacter(PIXI, agent.role, agent.name, agent.deskIndex)
        const [col, row] = DESK_POSITIONS[agent.deskIndex] ?? [1, 1]
        // 에이전트는 책상 바로 위에 앉힘 (top face 위치)
        sprite.setPosition(
          col * TILE_SIZE + TILE_SIZE / 2,
          row * TILE_SIZE + 16,   // 책상 위면 위
        )
        gameContainer.addChild(sprite.container)
        return { sprite, agent }
      })

      // ── 플레이어 캐릭터 스프라이트 ────────────────────────────────────────
      const playerSprite = createPlayerCharacter(PIXI)
      playerSprite.setPosition(PLAYER_START.x, PLAYER_START.y)
      gameContainer.addChild(playerSprite.container)

      // ── 근접 링 (항상 최상위) ─────────────────────────────────────────────
      const proximityRing = new PIXI.Graphics()
      proximityRing.visible = false
      proximityRing.zIndex = 99999
      gameContainer.addChild(proximityRing)

      // ── 키보드 상태 ───────────────────────────────────────────────────────
      const keys = new Set<string>()
      function onKeyDown(e: KeyboardEvent) { keys.add(e.code) }
      function onKeyUp(e: KeyboardEvent)   { keys.delete(e.code) }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)

      // ── 게임 루프 ─────────────────────────────────────────────────────────
      app.ticker.add(() => {
        const totalMs = app.ticker.lastTime

        // 입력
        const up    = keys.has('KeyW') || keys.has('ArrowUp')
        const down  = keys.has('KeyS') || keys.has('ArrowDown')
        const left  = keys.has('KeyA') || keys.has('ArrowLeft')
        const right = keys.has('KeyD') || keys.has('ArrowRight')

        let dx = (right ? 1 : 0) - (left  ? 1 : 0)
        let dy = (down  ? 1 : 0) - (up    ? 1 : 0)
        const isMoving = dx !== 0 || dy !== 0

        // 이동 방향 결정
        let direction: Direction = 'down'
        if      (dx < 0)  direction = 'left'
        else if (dx > 0)  direction = 'right'
        else if (dy < 0)  direction = 'up'
        else if (dy > 0)  direction = 'down'

        // 이동 + 충돌
        if (isMoving) {
          if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707 }
          const pos = playerSprite.getPosition()
          const nx = pos.x + dx * PLAYER_SPEED
          const ny = pos.y + dy * PLAYER_SPEED
          if (canMoveTo(nx, pos.y)) playerSprite.setPosition(nx, pos.y)
          const px = playerSprite.getPosition().x
          if (canMoveTo(px, ny))   playerSprite.setPosition(px, ny)
        }

        // 플레이어 캐릭터 업데이트 (애니 + zIndex)
        playerSprite.update(totalMs, isMoving, direction)

        // 에이전트 캐릭터 업데이트 (아이들 애니)
        for (const { sprite } of agentEntries) {
          sprite.update(totalMs, false, 'down')
        }

        // 근접 감지
        const pos = playerSprite.getPosition()
        const nearby = findNearbyAgent(pos.x, pos.y, agents)

        if (nearby) {
          proximityRing.visible = true
          proximityRing.clear()
          proximityRing.lineStyle(2.5, COLORS.proximityRing, 0.9)
          proximityRing.drawCircle(pos.x, pos.y, 28)
          proximityRing.lineStyle(0)
        } else {
          proximityRing.visible = false
        }

        setNearbyAgent(nearby)
      })

      // 클린업 저장
      ;(app as Application & { _cleanupKeys?: () => void })._cleanupKeys = () => {
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
      }
    }

    init()

    return () => {
      destroyed = true
      if (appRef.current) {
        const app = appRef.current as Application & { _cleanupKeys?: () => void }
        app._cleanupKeys?.()
        app.destroy(true, { children: true, texture: true, baseTexture: true })
        appRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, agents.length])

  return { nearbyAgent }
}
