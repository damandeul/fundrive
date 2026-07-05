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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 flex items-center justify-between bg-white/90 backdrop-blur px-4 py-3 border-b border-slate-100">
        <h1 className="text-lg font-black text-slate-800">
          🚗 부릉<span className="text-sky-500">부릉</span>
        </h1>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          ⭐ {app.points}P
        </span>
      </header>

      {/* 본문 */}
      <main className="flex-1 pb-24">
        {tab === 'drive' && <Drive />}
        {tab === 'game' && <Game />}
        {tab === 'feed' && <Feed />}
        {tab === 'my' && <My />}
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-slate-100 bg-white/95 backdrop-blur">
        <div className="grid grid-cols-4">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-0.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition ${tab === t.id ? 'text-sky-500' : 'text-slate-400'}`}
            >
              <span className={`text-xl ${tab === t.id ? 'animate-pop' : ''}`}>{t.icon}</span>
              <span className="text-[11px] font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 최초 실행 안전 고지 */}
      {!app.safetyAgreed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 animate-pop">
            <div className="text-center">
              <span className="text-5xl">🚦</span>
              <h2 className="mt-2 text-xl font-black text-slate-800">안전 약속</h2>
            </div>
            <ul className="space-y-2 text-sm text-slate-600 leading-relaxed">
              <li>✅ <b>운전자는</b> 주행 시작/종료 버튼만 사용해요.</li>
              <li>✅ 게임과 피드는 <b>동승자 또는 정차 중에만</b> 이용해요.</li>
              <li>✅ 운전 중 휴대전화 조작은 도로교통법 위반이 될 수 있어요.</li>
            </ul>
            <button
              onClick={() => setState({ safetyAgreed: true })}
              className="w-full rounded-2xl bg-sky-500 py-3.5 text-white font-bold"
            >
              약속할게요! 🤙
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
