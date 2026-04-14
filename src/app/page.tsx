import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="public-shell public-grid min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_460px]">
          <section className="max-w-2xl">
            <div className="pixel-font inline-flex items-center rounded-full border border-[var(--public-line-strong)] bg-white/75 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[var(--public-muted)]">
              AI team, staged like a real office
            </div>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[var(--public-text)] sm:text-6xl lg:text-7xl">
              혼자 만드는 제품도,
              <br />
              팀처럼 굴러가게.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--public-muted)] sm:text-xl">
              AI Office는 PM, 개발자, 마케터, 리뷰어가 한 공간에서 움직이는 것처럼 보이는
              1인 개발자용 AI 팀입니다. 채팅 툴 하나 더 만드는 게 아니라, 일하는 맥락 자체를
              묶습니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--public-accent)] px-6 text-base font-semibold text-white transition hover:bg-[#224fb5]"
              >
                무료로 팀 만들기
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[var(--public-line-strong)] bg-white/70 px-6 text-base font-medium text-[var(--public-text)] transition hover:bg-white"
              >
                로그인
              </Link>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-[var(--public-muted)] sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--public-line)] bg-white/65 px-4 py-4">
                회사 정보 입력
              </div>
              <div className="rounded-2xl border border-[var(--public-line)] bg-white/65 px-4 py-4">
                역할별 AI 팀 생성
              </div>
              <div className="rounded-2xl border border-[var(--public-line)] bg-white/65 px-4 py-4">
                오피스에서 바로 실행
              </div>
            </div>
          </section>

          <section className="public-card relative overflow-hidden rounded-[32px] p-5 sm:p-6">
            <div className="rounded-[28px] bg-[var(--public-panel)] p-5 text-white shadow-[0_32px_80px_rgba(13,21,36,0.28)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="pixel-font text-xs uppercase tracking-[0.28em] text-[#9fb4d9]">
                    AI Office
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
                    오늘의 운영 플로우
                  </h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#c7d4ec]">
                  live
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-white/10 bg-[var(--public-panel-soft)] p-4">
                <div className="grid grid-cols-[1.2fr_0.9fr] gap-4">
                  <div className="rounded-[20px] bg-[#f4f1ea] p-4 text-[var(--public-text)]">
                    <div className="flex items-center justify-between text-xs text-[var(--public-muted)]">
                      <span className="pixel-font uppercase tracking-[0.22em]">office map</span>
                      <span>09:41</span>
                    </div>
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      <div className="col-span-4 h-12 rounded-2xl bg-[#d7e3fb]" />
                      <div className="col-span-2 h-24 rounded-2xl bg-[#fffaf2]" />
                      <div className="h-24 rounded-2xl bg-[#e8edf7]" />
                      <div className="h-24 rounded-2xl bg-[#efe6d5]" />
                      <div className="h-16 rounded-2xl bg-[#eef4ff]" />
                      <div className="h-16 rounded-2xl bg-[#f6efe3]" />
                      <div className="col-span-2 h-16 rounded-2xl bg-[#e1e9f8]" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-[20px] border border-white/8 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#90a5c7]">
                        selected team
                      </p>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                          <span>PM 지민</span>
                          <span className="text-xs text-[#8ad0a7]">집중</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                          <span>Dev 태양</span>
                          <span className="text-xs text-[#7eb5ff]">구현</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2">
                          <span>Mkt 유나</span>
                          <span className="text-xs text-[#ffcb77]">전략</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-white/8 bg-[#101a2b] px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-[#90a5c7]">
                        current run
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#dbe7fb]">
                        "신규 기능 출시 전략 정리 후 바로 태스크 생성"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[#97abc9]">
                오피스는 몰입형 홈, 나머지 화면은 운영 콘솔. 같은 팀의 두 표정입니다.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
