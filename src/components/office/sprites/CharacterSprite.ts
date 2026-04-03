/**
 * CharacterSprite — SD 캐릭터 팩토리 (Pixi.js Graphics 기반)
 *
 * 외부 인터페이스(CharacterSprite)는 나중에 스프라이트 이미지로
 * 교체해도 변경 없이 동작하도록 설계됨.
 *
 * 좌표계: 발 위치 = origin(0,0), y축 위 = 음수
 */

import type * as PixiNS from 'pixi.js'
import { CHAR, COLORS, AGENT_ROLE_COLORS, AGENT_ROLE_HAIR_COLORS } from '../constants'

type PIXI = typeof PixiNS

export type Direction = 'down' | 'up' | 'left' | 'right'

export interface CharacterConfig {
  bodyColor: number
  hairColor: number
  name: string
  isPlayer?: boolean
  phaseOffset?: number
}

// ─── 교체 가능 인터페이스 ────────────────────────────────────────────────────
export interface CharacterSprite {
  /** Pixi scene graph에 추가할 노드 */
  container: PixiNS.Container
  /** 매 프레임 호출 — 애니메이션 + Y-sort zIndex 갱신 */
  update(totalMs: number, isMoving: boolean, direction: Direction): void
  setPosition(x: number, y: number): void
  getPosition(): { x: number; y: number }
  destroy(): void
}

// ─── 내부 헬퍼 ───────────────────────────────────────────────────────────────

function buildNameplate(PIXI: PIXI, name: string): PixiNS.Container {
  const style = new PIXI.TextStyle({
    fontFamily: 'sans-serif',
    fontSize: 9,
    fontWeight: 'bold',
    fill: COLORS.nameplateText,
  })

  const text = new PIXI.Text(name.slice(0, 6), style)
  text.anchor.set(0.5, 0)

  const padX = CHAR.NAMEPLATE_PAD_X
  const padY = CHAR.NAMEPLATE_PAD_Y
  const w = Math.max(text.width + padX * 2, 24)
  const h = text.height + padY * 2

  const bg = new PIXI.Graphics()
  bg.beginFill(COLORS.nameplateBackground, 0.8)
  bg.drawRoundedRect(-w / 2, 0, w, h, CHAR.NAMEPLATE_R)
  bg.endFill()

  text.y = padY

  const c = new PIXI.Container()
  c.addChild(bg)
  c.addChild(text)
  return c
}

function buildShadow(PIXI: PIXI): PixiNS.Graphics {
  const g = new PIXI.Graphics()
  g.beginFill(0x000000, CHAR.SHADOW_ALPHA)
  g.drawEllipse(0, CHAR.SHADOW_Y, CHAR.SHADOW_RX, CHAR.SHADOW_RY)
  g.endFill()
  return g
}

function buildLeg(PIXI: PIXI, color: number, side: 'left' | 'right'): PixiNS.Graphics {
  const g = new PIXI.Graphics()
  const offsetX = side === 'left' ? -(CHAR.LEG_OFFSET_X + CHAR.LEG_W / 2) : CHAR.LEG_OFFSET_X - CHAR.LEG_W / 2
  g.beginFill(color)
  g.drawRoundedRect(offsetX, CHAR.LEG_TOP_Y, CHAR.LEG_W, CHAR.LEG_H, 2)
  g.endFill()
  return g
}

function buildBodyGroup(PIXI: PIXI, bodyColor: number, hairColor: number): PixiNS.Container {
  const group = new PIXI.Container()

  // 몸통
  const body = new PIXI.Graphics()
  body.beginFill(bodyColor)
  body.drawRoundedRect(
    -CHAR.BODY_W / 2,
    CHAR.BODY_TOP_Y,
    CHAR.BODY_W,
    CHAR.BODY_H,
    CHAR.BODY_RADIUS,
  )
  body.endFill()
  // 몸통 상단 하이라이트
  body.beginFill(0xffffff, 0.15)
  body.drawRoundedRect(-CHAR.BODY_W / 2, CHAR.BODY_TOP_Y, CHAR.BODY_W, 3, CHAR.BODY_RADIUS)
  body.endFill()
  group.addChild(body)

  // 머리 (피부색)
  const head = new PIXI.Graphics()
  head.beginFill(COLORS.skinTone)
  head.drawCircle(0, CHAR.HEAD_CY, CHAR.HEAD_R)
  head.endFill()
  group.addChild(head)

  // 헤어 (위쪽 반원 + arc)
  const hair = new PIXI.Graphics()
  hair.beginFill(hairColor)
  // 머리 꼭대기 반원
  hair.moveTo(-CHAR.HEAD_R, CHAR.HEAD_CY)
  hair.arc(0, CHAR.HEAD_CY, CHAR.HEAD_R, Math.PI, 0)
  hair.lineTo(0, CHAR.HEAD_CY)
  hair.closePath()
  hair.endFill()
  // 앞머리 곡선
  hair.beginFill(hairColor)
  hair.drawEllipse(0, CHAR.HEAD_CY - CHAR.HEAD_R + 3, CHAR.HEAD_R - 1, 5)
  hair.endFill()
  group.addChild(hair)

  // 눈 (두 개)
  const eyes = new PIXI.Graphics()
  eyes.beginFill(COLORS.eyeColor)
  eyes.drawCircle(-CHAR.EYE_OFFSET_X, CHAR.EYE_CY, CHAR.EYE_R)
  eyes.drawCircle(CHAR.EYE_OFFSET_X, CHAR.EYE_CY, CHAR.EYE_R)
  eyes.endFill()
  // 눈 하이라이트
  eyes.beginFill(0xffffff, 0.7)
  eyes.drawCircle(-CHAR.EYE_OFFSET_X + 1, CHAR.EYE_CY - 1, 0.8)
  eyes.drawCircle(CHAR.EYE_OFFSET_X + 1, CHAR.EYE_CY - 1, 0.8)
  eyes.endFill()
  group.addChild(eyes)

  return group
}

// ─── 팩토리 함수 ─────────────────────────────────────────────────────────────

export function createCharacterSprite(PIXI: PIXI, config: CharacterConfig): CharacterSprite {
  const { bodyColor, hairColor, name, phaseOffset = 0 } = config

  const root = new PIXI.Container()
  root.sortableChildren = false

  // 렌더 순서: shadow → legs → bodyGroup → nameplate
  const shadow = buildShadow(PIXI)
  root.addChild(shadow)

  const legL = buildLeg(PIXI, bodyColor, 'left')
  const legR = buildLeg(PIXI, bodyColor, 'right')
  root.addChild(legL)
  root.addChild(legR)

  const bodyGroup = buildBodyGroup(PIXI, bodyColor, hairColor)
  root.addChild(bodyGroup)

  const nameplate = buildNameplate(PIXI, name)
  nameplate.y = CHAR.NAMEPLATE_Y
  root.addChild(nameplate)

  // ── 인터페이스 구현 ──────────────────────────────────────────────────────
  return {
    container: root,

    update(totalMs: number, isMoving: boolean, direction: Direction): void {
      if (!isMoving) {
        // 아이들 보빙 — bodyGroup만 위아래
        bodyGroup.y = Math.sin(totalMs * CHAR.IDLE_SPEED + phaseOffset) * CHAR.IDLE_AMPLITUDE
        legL.y = 0
        legR.y = 0
      } else {
        // 걷기 — 다리 교대 스윙
        bodyGroup.y = 0
        const swing = Math.sin(totalMs * CHAR.WALK_SPEED + phaseOffset) * CHAR.WALK_AMPLITUDE
        legL.y = swing
        legR.y = -swing
      }

      // 좌우 반전 (몸통+머리만)
      if (direction === 'left') {
        bodyGroup.scale.x = -1
      } else if (direction === 'right') {
        bodyGroup.scale.x = 1
      }

      // Y-sort: 발 위치 기준 zIndex 갱신
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

export function createAgentCharacter(
  PIXI: PIXI,
  role: string,
  name: string,
  deskIndex: number,
): CharacterSprite {
  return createCharacterSprite(PIXI, {
    bodyColor: AGENT_ROLE_COLORS[role] ?? 0x9b9b9b,
    hairColor: AGENT_ROLE_HAIR_COLORS[role] ?? 0x555555,
    name,
    phaseOffset: deskIndex * 0.5,
  })
}

export function createPlayerCharacter(PIXI: PIXI): CharacterSprite {
  return createCharacterSprite(PIXI, {
    bodyColor: COLORS.player,
    hairColor: COLORS.playerHair,
    name: '나',
    isPlayer: true,
    phaseOffset: 0,
  })
}
