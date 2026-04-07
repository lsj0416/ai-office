import { describe, expect, it } from 'vitest'
import { buildMeetingSeatAssignments, MEETING_SEAT_TILES } from '../meeting'

describe('meeting seat assignments', () => {
  it('assigns seats in a stable order for selected participants', () => {
    const assignments = buildMeetingSeatAssignments(['a', 'b', 'c'])

    expect(assignments.a).toEqual(MEETING_SEAT_TILES[0])
    expect(assignments.b).toEqual(MEETING_SEAT_TILES[1])
    expect(assignments.c).toEqual(MEETING_SEAT_TILES[2])
  })

  it('rejects more participants than available seats', () => {
    expect(() =>
      buildMeetingSeatAssignments(
        Array.from({ length: MEETING_SEAT_TILES.length + 1 }, (_, index) => `agent-${index}`)
      )
    ).toThrow(/최대/)
  })
})
