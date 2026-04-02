import dynamic from 'next/dynamic'

const OfficeCanvas = dynamic(() => import('@/components/office/OfficeCanvas'), { ssr: false })

export default function OfficePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">오피스</h1>
        <p className="text-sm text-gray-500">AI 직원들이 일하는 공간입니다.</p>
      </div>
      <OfficeCanvas workspaceId={params.id} />
    </div>
  )
}
