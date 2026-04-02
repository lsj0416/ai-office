import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-900">AI Office</h1>
        <p className="mb-8 text-xl text-gray-600">역할 기반 멀티 에이전트 AI 팀 서비스</p>
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-medium text-white hover:bg-blue-700"
        >
          시작하기
        </Link>
      </div>
    </main>
  )
}
