import VoiceMeetingPanel from '@/components/meeting/VoiceMeetingPanel'

export default function MeetingPage({ params }: { params: { id: string } }) {
  return <VoiceMeetingPanel workspaceId={params.id} />
}
