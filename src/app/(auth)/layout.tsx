export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-shell public-grid min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-8 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
          <section className="hidden max-w-2xl lg:block">
            <div className="pixel-font inline-flex items-center rounded-full border border-[var(--public-line-strong)] bg-white/70 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--public-muted)]">
              AI Office access
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-[var(--public-text)]">
              AI 팀의 문을 여는
              <br />
              가장 짧은 입구.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--public-muted)]">
              로그인만 끝나면 오피스, AUTO 실행, 회의, 태스크가 한 워크스페이스 안에서
              이어집니다. 화면 수는 많아도 느낌은 하나여야 합니다.
            </p>

            <div className="mt-8 grid max-w-xl gap-3">
              <div className="public-card rounded-[28px] p-5">
                <p className="text-sm font-semibold text-[var(--public-text)]">들어오면 바로 오피스</p>
                <p className="mt-2 text-sm leading-6 text-[var(--public-muted)]">
                  팀 상태를 보고, 가까이 가서 대화하고, 바로 회의를 시작합니다.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl border border-[var(--public-line)] bg-white/65 px-4 py-4 text-[var(--public-muted)]">
                  팀 생성
                </div>
                <div className="rounded-2xl border border-[var(--public-line)] bg-white/65 px-4 py-4 text-[var(--public-muted)]">
                  실행
                </div>
                <div className="rounded-2xl border border-[var(--public-line)] bg-white/65 px-4 py-4 text-[var(--public-muted)]">
                  기록 축적
                </div>
              </div>
            </div>
          </section>

          <div className="public-card w-full rounded-[32px] p-6 sm:p-8">
            <div className="mb-6 lg:hidden">
              <p className="pixel-font text-[11px] uppercase tracking-[0.28em] text-[var(--public-muted)]">
                AI Office
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">
                로그인 후 바로 오피스와 운영 콘솔을 이어서 사용합니다.
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
