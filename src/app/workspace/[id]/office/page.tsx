import dynamic from 'next/dynamic'

const OfficeCanvas = dynamic(() => import('@/components/office/OfficeCanvas'), { ssr: false })

export default function OfficePage({ params }: { params: { id: string } }) {
  return (
    <div className="h-full">
      <OfficeCanvas workspaceId={params.id} />
    </div>
  )
}
