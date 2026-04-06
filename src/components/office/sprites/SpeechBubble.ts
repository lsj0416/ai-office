/**
 * SpeechBubble — 에이전트 상태 표시 말풍선
 * 캐릭터 머리 위에 떠 있는 작은 텍스트 버블
 */

import type * as PixiNS from 'pixi.js'
import type { AgentFSMStateType } from '@/types/office'
import { PIXEL_SIZE } from '../constants'

type PIXI = typeof PixiNS

// 캐릭터 머리 위 (GRID_H * PIXEL_SIZE = 56px 위, 추가 여백 10px)
const BUBBLE_OFFSET_Y = -(56 + 14)
const BUBBLE_W = 22
const BUBBLE_H = 16
const TAIL_SIZE = 4

const STATE_TEXT: Record<AgentFSMStateType, string> = {
  IDLE_AT_DESK: '💻',
  WANDERING: '☕',
  RETURNING: '←',
}

export interface SpeechBubble {
  container: PixiNS.Container
  setState(state: AgentFSMStateType): void
}

export function createSpeechBubble(PIXI: PIXI): SpeechBubble {
  const root = new PIXI.Container()
  root.y = BUBBLE_OFFSET_Y

  // 배경 + 꼬리 그래픽
  const bg = new PIXI.Graphics()
  root.addChild(bg)

  // 텍스트
  const label = new PIXI.Text(
    '💻',
    new PIXI.TextStyle({
      fontFamily: 'sans-serif',
      fontSize: 10,
      fill: 0xffffff,
    })
  )
  label.anchor.set(0.5, 0.5)
  label.x = 0
  label.y = -(BUBBLE_H / 2)
  root.addChild(label)

  function redrawBg(): void {
    bg.clear()
    const hw = BUBBLE_W / 2
    // 배경
    bg.beginFill(0x1a1a2e, 0.88)
    bg.drawRoundedRect(-hw, -BUBBLE_H, BUBBLE_W, BUBBLE_H, 4)
    bg.endFill()
    // 꼬리 (아래 방향 삼각형)
    bg.beginFill(0x1a1a2e, 0.88)
    bg.moveTo(-TAIL_SIZE / 2, 0)
    bg.lineTo(TAIL_SIZE / 2, 0)
    bg.lineTo(0, TAIL_SIZE)
    bg.closePath()
    bg.endFill()
  }

  redrawBg()

  return {
    container: root,

    setState(state: AgentFSMStateType): void {
      label.text = STATE_TEXT[state] ?? ''
    },
  }
}

// PIXEL_SIZE가 사용되지 않으면 unused import 경고가 날 수 있으므로 참조
void PIXEL_SIZE
