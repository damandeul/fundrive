import { useState } from 'react'
import { setState, useApp } from './store'
import Drive from './screens/Drive'
import Game from './screens/Game'
import Feed from './screens/Feed'
import My from './screens/My'

type Tab = 'drive' | 'game' | 'feed' | 'my'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'drive', icon: '🚗', label: '주행' },
  { id: 'game', icon: '🎮', label: '게임' },
  { id: 'feed', icon: '📸', label: '피드' },
  { id: 'my', icon: '🐣', label: '마이' },
]

export default function App() {
  const app = useApp()
  const [tab, setTab] = useState<Tab>('drive')

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#eef1f7]">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-slate-900/5 bg-[#eef1f7]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="grad-brand flex h-9 w-9 items-center justify-center rounded-[12px] text-lg shadow-lg shadow-indigo-500/25">
              🚗
            </span>
            <h1 className="text-[19px] font-extrabold tracking-tight text-slate-900">
              부릉<span className="text-grad-brand">부릉</span>
            </h1>
          </div>
          <span className="flex items-center gap-1 rounded-full border border-amber-200/60 bg-gradient-to-b from-amber-50 to-amber-100 px-3.5 py-1.5 text-[13px] font-extrabold text-amber-700 shadow-sm">
            ⭐ {app.points.toLocaleString()}<span className="font-bold text-amber-500">P</span>
          </span>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 pb-28">
        {tab === 'drive' && <Drive />}
        {tab === 'game' && <Game />}
        {tab === 'feed' && <Feed />}
        {tab === 'my' && <My />}
      </main>

      {/* 플로팅 탭바 */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-4 rounded-[22px] border border-white/60 bg-white/90 p-1.5 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.25)] backdrop-blur-xl">
          {TABS.map((t) => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 transition-all duration-200 ${
                  active ? 'bg-slate-900 shadow-lg shadow-slate-900/20' : 'active:bg-slate-100'
                }`}
              >
                <span className={`text-[19px] leading-none ${active ? 'animate-pop' : 'grayscale opacity-60'}`}>{t.icon}</span>
                <span className={`text-[10.5px] font-bold ${active ? 'text-white' : 'text-slate-400'}`}>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* 최초 실행 안전 고지 */}
      {!app.safetyAgreed && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm animate-slide-up rounded-[28px] bg-white p-7 shadow-2xl">
            <div className="text-center">
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-b from-sky-50 to-indigo-100 text-4xl shadow-inner">🚦</span>
              <h2 className="mt-3 text-[22px] font-extrabold tracking-tight text-slate-900">안전 약속</h2>
              <p className="mt-1 text-[13px] text-slate-400">부릉부릉과 함께하는 첫 번째 약속이에요</p>
            </div>
            <ul className="mt-5 space-y-2.5">
              {[
                ['🚗', '운전자는 주행 시작/종료 버튼만 사용해요'],
                ['🧑‍🤝‍🧑', '게임과 피드는 동승자 또는 정차 중에만'],
                ['⚖️', '운전 중 휴대전화 조작은 법 위반이 될 수 있어요'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-[13.5px] font-medium text-slate-600">
                  <span className="text-lg">{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setState({ safetyAgreed: true })}
              className="grad-brand mt-5 w-full rounded-2xl py-4 text-[15px] font-extrabold text-white shadow-lg shadow-indigo-500/30 transition active:scale-[0.98]"
            >
              약속할게요 🤙
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
