/**
 * PixelCharacterSprite — 픽셀 아트 스타일 SD 캐릭터
 *
 * 12열 × 14행 픽셀 그리드, PIXEL_SIZE=4 → 48 × 56px
 * 발 위치 = 컨테이너 origin (0, 0)
 * 4방향(down/up/left/right) × 2프레임 (idle/walk)
 * right = left 프레임을 scale.x=-1 로 미러링
 */

import type * as PixiNS from 'pixi.js'
import { PIXEL_SIZE, COLORS, AGENT_ROLE_COLORS, AGENT_ROLE_HAIR_COLORS } from '../constants'
import type { CharacterConfig, CharacterSprite, Direction } from './CharacterSprite'

type PIXI = typeof PixiNS

const GRID_W = 12
const GRID_H = 14
// draw offset: center x, feet at y=0
const OX = -(GRID_W / 2) * PIXEL_SIZE // -24
const OY = -GRID_H * PIXEL_SIZE // -56

// ─── Palette indices ──────────────────────────────────────────────────────────
// 0 = transparent  1 = skin  2 = hair  3 = body/clothes  4 = dark outline

const _ = 0,
  S = 1,
  H = 2,
  B = 3,
  D = 4

// ─── Pixel frames ─────────────────────────────────────────────────────────────
// Each direction has a [headRows: 8, bodyRows0: 6, bodyRows1: 6] tuple.
// Frame 0 uses bodyRows0, frame 1 uses bodyRows1 (walk step).

// --- DOWN ---
const DOWN_HEAD = [
  [_, _, _, D, H, H, H, H, D, _, _, _],
  [_, _, D, H, H, H, H, H, H, D, _, _],
  [_, _, D, S, H, H, H, H, S, D, _, _],
  [_, D, S, S, S, S, S, S, S, S, D, _],
  [_, D, S, D, S, S, S, S, D, S, D, _],
  [_, D, S, S, S, S, S, S, S, S, D, _],
  [_, _, D, S, S, D, D, S, S, D, _, _],
  [_, _, _, D, D, D, D, D, D, _, _, _],
]
const DOWN_BODY_0 = [
  [_, _, _, B, B, B, B, B, B, _, _, _],
  [_, _, B, B, B, B, B, B, B, B, _, _],
  [_, _, B, B, B, B, B, B, B, B, _, _],
  [_, _, _, B, B, B, B, B, B, _, _, _],
  [_, _, _, B, B, _, _, B, B, _, _, _],
  [_, _, _, D, D, _, _, D, D, _, _, _],
]
const DOWN_BODY_1 = [
  [_, _, _, B, B, B, B, B, B, _, _, _],
  [_, _, B, B, B, B, B, B, B, B, _, _],
  [_, _, B, B, B, B, B, B, B, B, _, _],
  [_, _, _, B, B, B, B, B, B, _, _, _],
  [_, _, _, _, B, B, B, B, _, _, _, _],
  [_, _, _, _, D, D, D, D, _, _, _, _],
]

// --- UP ---
const UP_HEAD = [
  [_, _, _, D, H, H, H, H, D, _, _, _],
  [_, _, D, H, H, H, H, H, H, D, _, _],
  [_, _, D, H, H, H, H, H, H, D, _, _],
  [_, D, H, H, H, H, H, H, H, H, D, _],
  [_, D, S, H, H, H, H, H, H, S, D, _],
  [_, D, S, S, S, S, S, S, S, S, D, _],
  [_, _, D, S, S, S, S, S, S, D, _, _],
  [_, _, _, D, D, D, D, D, D, _, _, _],
]
const UP_BODY_0 = DOWN_BODY_0
const UP_BODY_1 = DOWN_BODY_1

// --- LEFT (facing left; right = mirror) ---
const LEFT_HEAD = [
  [_, _, _, _, D, H, H, D, _, _, _, _],
  [_, _, _, D, H, H, H, H, D, _, _, _],
  [_, _, D, H, H, S, S, H, D, _, _, _],
  [_, D, S, S, S, S, S, S, D, _, _, _],
  [_, D, S, D, S, S, S, D, _, _, _, _],
  [_, D, S, S, S, S, S, D, _, _, _, _],
  [_, _, D, S, D, D, S, D, _, _, _, _],
  [_, _, _, D, D, D, D, _, _, _, _, _],
]
const LEFT_BODY_0 = [
  [_, _, _, B, B, B, _, _, _, _, _, _],
  [_, _, B, B, B, B, B, _, _, _, _, _],
  [_, _, B, B, B, B, B, _, _, _, _, _],
  [_, _, _, B, B, B, _, _, _, _, _, _],
  [_, _, _, B, B, _, _, _, _, _, _, _],
  [_, _, _, D, D, _, _, _, _, _, _, _],
]
const LEFT_BODY_1 = [
  [_, _, _, B, B, B, _, _, _, _, _, _],
  [_, _, B, B, B, B, B, _, _, _, _, _],
  [_, _, B, B, B, B, B, _, _, _, _, _],
  [_, _, _, B, B, B, _, _, _, _, _, _],
  [_, _, D, B, _, B, _, _, _, _, _, _],
  [_, _, D, _, _, D, _, _, _, _, _, _],
]

// ─── Direction → frame data map ───────────────────────────────────────────────

type FrameSet = {
  head: number[][]
  body0: number[][]
  body1: number[][]
  mirrorX: boolean
}

const FRAME_SETS: Record<Direction, FrameSet> = {
  down: { head: DOWN_HEAD, body0: DOWN_BODY_0, body1: DOWN_BODY_1, mirrorX: false },
  up: { head: UP_HEAD, body0: UP_BODY_0, body1: UP_BODY_1, mirrorX: false },
  left: { head: LEFT_HEAD, body0: LEFT_BODY_0, body1: LEFT_BODY_1, mirrorX: false },
  right: { head: LEFT_HEAD, body0: LEFT_BODY_0, body1: LEFT_BODY_1, mirrorX: true },
}

// ─── Rendering helpers ────────────────────────────────────────────────────────

function drawPixelGrid(
  gfx: PixiNS.Graphics,
  rows: number[][],
  rowOffset: number,
  skin: number,
  hair: number,
  body: number
): void {
  for (let row = 0; row < rows.length; row++) {
    const rowData = rows[row]
    if (!rowData) continue
    for (let col = 0; col < rowData.length; col++) {
      const idx = rowData[col]
      if (idx === 0) continue

      let color: number
      switch (idx) {
        case 1:
          color = skin
          break
        case 2:
          color = hair
          break
        case 3:
          color = body
          break
        case 4:
          color = 0x222222
          break
        default:
          continue
      }

      gfx.beginFill(color)
      gfx.drawRect(
        OX + col * PIXEL_SIZE,
        OY + (rowOffset + row) * PIXEL_SIZE,
        PIXEL_SIZE,
        PIXEL_SIZE
      )
      gfx.endFill()
    }
  }
}

function redrawCharacter(
  gfx: PixiNS.Graphics,
  direction: Direction,
  frameIdx: number,
  skin: number,
  hair: number,
  body: number
): void {
  gfx.cacheAsBitmap = false
  gfx.clear()

  const fs = FRAME_SETS[direction]
  const bodyRows = frameIdx === 0 ? fs.body0 : fs.body1

  drawPixelGrid(gfx, fs.head, 0, skin, hair, body)
  drawPixelGrid(gfx, bodyRows, 8, skin, hair, body)

  gfx.cacheAsBitmap = true
}

function buildNameplate(PIXI: PIXI, name: string): PixiNS.Container {
  const style = new PIXI.TextStyle({
    fontFamily: 'monospace',
    fontSize: 8,
    fontWeight: 'bold',
    fill: 0xffffff,
  })
  const text = new PIXI.Text(name.slice(0, 7), style)
  text.anchor.set(0.5, 0)

  const padX = 5
  const padY = 2
  const w = Math.max(text.width + padX * 2, 22)
  const h = text.height + padY * 2

  const bg = new PIXI.Graphics()
  bg.beginFill(0x1a1a2e, 0.85)
  bg.drawRoundedRect(-w / 2, 0, w, h, 3)
  bg.endFill()
  text.y = padY

  const c = new PIXI.Container()
  c.addChild(bg)
  c.addChild(text)
  return c
}

// ─── 팩토리 ──────────────────────────────────────────────────────────────────

export function createPixelCharacterSprite(PIXI: PIXI, config: CharacterConfig): CharacterSprite {
  const { bodyColor, hairColor, name, phaseOffset = 0 } = config
  const skin = COLORS.skinTone

  const root = new PIXI.Container()

  // 그림자 (지면 고정)
  const shadow = new PIXI.Graphics()
  shadow.beginFill(0x000000, 0.18)
  shadow.drawEllipse(0, 1, 10, 3)
  shadow.endFill()
  root.addChild(shadow)

  // 픽셀 아트 캐릭터 그래픽
  const gfx = new PIXI.Graphics()
  root.addChild(gfx)

  // 이름 레이블
  const nameplate = buildNameplate(PIXI, name)
  nameplate.y = PIXEL_SIZE + 2
  root.addChild(nameplate)

  let currentDir: Direction = 'down'
  let currentFrame = 0

  // 초기 렌더
  redrawCharacter(gfx, 'down', 0, skin, hairColor, bodyColor)

  return {
    container: root,

    update(totalMs: number, isMoving: boolean, direction: Direction): void {
      // right는 left 프레임을 미러링
      const effectiveDir = direction === 'right' ? 'left' : direction
      const frameIdx = isMoving ? Math.floor(totalMs / 220) % 2 : 0

      // 방향/프레임 변경 시에만 재렌더 (cacheAsBitmap 효과)
      if (effectiveDir !== currentDir || frameIdx !== currentFrame) {
        currentDir = effectiveDir
        currentFrame = frameIdx
        redrawCharacter(gfx, effectiveDir, frameIdx, skin, hairColor, bodyColor)
      }

      // 좌우 반전 (right 방향)
      gfx.scale.x = direction === 'right' ? -1 : 1

      // 아이들 보빙 (정지 상태)
      if (!isMoving) {
        gfx.y = Math.sin(totalMs * 0.002 + phaseOffset) * 2
      } else {
        gfx.y = 0
      }

      // Y-sort zIndex
      root.zIndex = Math.floor(root.y)
    },

    setPosition(x: number, y: number): void {
      root.x = x
      root.y = y
      root.zIndex = Math.floor(y)
    },

    getPosition(): { x: number; y: number } {
      return { x: root.x, y: root.y }
    },

    destroy(): void {
      root.destroy({ children: true })
    },
  }
}

// ─── 편의 팩토리 ─────────────────────────────────────────────────────────────

export function createPixelAgentCharacter(
  PIXI: PIXI,
  role: string,
  name: string,
  deskIndex: number
): CharacterSprite {
  return createPixelCharacterSprite(PIXI, {
    bodyColor: AGENT_ROLE_COLORS[role] ?? 0x9b9b9b,
    hairColor: AGENT_ROLE_HAIR_COLORS[role] ?? 0x555555,
    name,
    phaseOffset: deskIndex * 0.5,
  })
}

export function createPixelPlayerCharacter(PIXI: PIXI): CharacterSprite {
  return createPixelCharacterSprite(PIXI, {
    bodyColor: COLORS.player,
    hairColor: COLORS.playerHair,
    name: '나',
    isPlayer: true,
    phaseOffset: 0,
  })
}
