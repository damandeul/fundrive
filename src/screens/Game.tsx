import { useState } from 'react'
import { addBadge, addPoints, setState, useApp } from '../store'

type GameTab = 'math' | 'bingo' | 'predict'

function randPlate(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10))
}

/* 한국 번호판 스타일 */
function Plate({ digits, state }: { digits: string; state?: 'correct' | 'wrong' | null }) {
  return (
    <div
      className={`relative mx-auto w-fit rounded-[10px] border-[3px] bg-white px-6 py-3 shadow-[0_4px_12px_rgba(15,23,42,0.15),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors ${
        state === 'correct' ? 'border-emerald-400' : state === 'wrong' ? 'border-rose-400' : 'border-slate-800'
      }`}
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)' }}
    >
      <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-slate-300 shadow-inner" />
      <span className="absolute right-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-slate-300 shadow-inner" />
      <span className="mr-2 align-middle text-[15px] font-bold text-slate-600">12가</span>
      <span className="align-middle text-[34px] font-black tracking-[0.12em] text-slate-900 tabular-nums">{digits}</span>
    </div>
  )
}

export default function Game() {
  const app = useApp()
  const [tab, setTab] = useState<GameTab>('math')
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-3 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-sky-50 px-5 py-4">
        <span className="text-2xl">🧑‍🤝‍🧑</span>
        <p className="text-[12px] font-medium leading-relaxed text-indigo-600">
          <b className="font-extrabold">동승자 모드</b> — 게임은 동승자나 정차 중에만!<br />
          운전자는 눈은 도로에, 답은 입으로 🗣️
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-200/60 p-1.5">
        {([['math', '🧮', '암산'], ['bingo', '🎱', '빙고'], ['predict', '🔮', '예언']] as [GameTab, string, string][]).map(([t, icon, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13.5px] font-extrabold transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'
            }`}
          >
            <span>{icon}</span>{label}
          </button>
        ))}
      </div>

      {tab === 'math' && <MathGame onToast={showToast} />}
      {tab === 'bingo' && <BingoGame onToast={showToast} bingo={app.bingo} bingoCount={app.bingoCount} />}
      {tab === 'predict' && <PredictGame onToast={showToast} />}

      {toast && (
        <div className="fixed bottom-28 left-1/2 z-50 -translate-x-1/2 animate-pop whitespace-nowrap rounded-full bg-slate-900/95 px-5 py-3 text-[13.5px] font-bold text-white shadow-2xl backdrop-blur">
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 암산 게임 ---------- */
function MathGame({ onToast }: { onToast: (m: string) => void }) {
  const [plate, setPlate] = useState(randPlate)
  const [choices, setChoices] = useState<number[]>(() => makeChoices(plate))
  const [combo, setCombo] = useState(0)
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)

  function makeChoices(p: number[]): number[] {
    const answer = p.reduce((a, b) => a + b, 0)
    const set = new Set([answer])
    while (set.size < 4) {
      const delta = Math.floor(Math.random() * 7) - 3
      const c = answer + (delta === 0 ? 4 : delta)
      if (c >= 0) set.add(c)
    }
    return [...set].sort(() => Math.random() - 0.5)
  }

  function next() {
    const p = randPlate()
    setPlate(p)
    setChoices(makeChoices(p))
    setResult(null)
  }

  function answer(c: number) {
    const correct = c === plate.reduce((a, b) => a + b, 0)
    setResult(correct ? 'correct' : 'wrong')
    if (correct) {
      const newCombo = combo + 1
      setCombo(newCombo)
      addPoints(10)
      onToast(`정답! +10P ${newCombo >= 2 ? `🔥 ${newCombo}콤보` : ''}`)
      if (newCombo >= 5 && addBadge('math-genius')) onToast('🏅 배지 획득: 암산 천재!')
    } else {
      setCombo(0)
      onToast('아쉬워요! 다음 번호판에 도전 🚗')
    }
    setTimeout(next, 900)
  }

  return (
    <div className="card animate-slide-up space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">번호판 숫자 합 맞히기</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-400">앞차 번호판, 네 숫자의 합은?</p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-[12px] font-extrabold ${combo > 0 ? 'grad-sunset text-white shadow-lg shadow-orange-500/25' : 'bg-slate-100 text-slate-400'}`}>
          🔥 {combo}콤보
        </span>
      </div>

      <Plate digits={plate.join('')} state={result} />

      <div className="grid grid-cols-4 gap-2">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => answer(c)}
            disabled={result !== null}
            className="rounded-2xl border border-indigo-100 bg-indigo-50/60 py-4 text-[19px] font-extrabold text-indigo-600 transition active:scale-95 active:bg-indigo-500 active:text-white disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>
      <p className="text-center text-[11.5px] text-slate-300">💡 실제 운전 중엔 동승자가 문제를 내고 운전자가 말로 답해요</p>
    </div>
  )
}

/* ---------- 빙고 ---------- */
function BingoGame({ onToast, bingo, bingoCount }: { onToast: (m: string) => void; bingo: number[]; bingoCount: number }) {
  const [input, setInput] = useState('')

  function submit() {
    const digits = input.replace(/\D/g, '').split('').map(Number)
    if (digits.length === 0) return
    const newSet = [...new Set([...bingo, ...digits])].sort((a, b) => a - b)
    const gained = newSet.length - bingo.length
    if (newSet.length >= 10) {
      setState({ bingo: [], bingoCount: bingoCount + 1 })
      addPoints(50)
      if (addBadge('bingo-master')) onToast('🏅 배지 획득: 빙고 마스터!')
      else onToast('🎉 빙고 완성! +50P')
    } else {
      setState({ bingo: newSet })
      onToast(gained > 0 ? `숫자 ${gained}개 수집! (${newSet.length}/10)` : '이미 모은 숫자예요!')
    }
    setInput('')
  }

  return (
    <div className="card animate-slide-up space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">번호판 숫자 빙고</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-400">0~9를 모두 모으면 +50P</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-extrabold text-slate-500">완성 {bingoCount}회</span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => {
          const owned = bingo.includes(i)
          return (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-2xl text-[20px] font-black transition-all ${
                owned
                  ? 'grad-brand scale-100 text-white shadow-lg shadow-indigo-500/30'
                  : 'border border-dashed border-slate-200 bg-slate-50 text-slate-200'
              }`}
            >
              {i}
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          inputMode="numeric"
          placeholder="본 번호판 숫자 (예: 3971)"
          className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-semibold transition focus:border-indigo-400 focus:bg-white focus:outline-none"
        />
        <button onClick={submit} className="grad-brand rounded-2xl px-6 text-[14px] font-extrabold text-white shadow-lg shadow-indigo-500/25 transition active:scale-95">
          수집
        </button>
      </div>
    </div>
  )
}

/* ---------- 예언 게임 ---------- */
function PredictGame({ onToast }: { onToast: (m: string) => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<{ digit: number; hit: boolean }[]>([])

  function check() {
    if (picked === null) return
    const digits = input.replace(/\D/g, '').split('').map(Number)
    if (digits.length === 0) return
    const hit = digits.includes(picked)
    setHistory((h) => [{ digit: picked, hit }, ...h].slice(0, 8))
    if (hit) {
      addPoints(15)
      onToast(`🔮 예언 적중! +15P`)
    } else {
      onToast('빗나갔어요! 다시 예언해 보세요 😄')
    }
    setPicked(null)
    setInput('')
  }

  return (
    <div className="card animate-slide-up space-y-5 p-6">
      <div>
        <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">번호판 숫자 예언</h2>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-400">
          숫자를 고르고, 다음에 본 번호판을 입력하세요. 적중 시 +15P
        </p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={`flex aspect-square items-center justify-center rounded-2xl text-[20px] font-black transition-all ${
              picked === i
                ? 'animate-pop bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-slate-100 text-slate-400 active:bg-slate-200'
            }`}
          >
            {i}
          </button>
        ))}
      </div>

      {picked !== null && (
        <div className="flex animate-pop gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            inputMode="numeric"
            placeholder={`다음 번호판에 ${picked}이(가) 있을까요?`}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-[14px] font-semibold transition focus:border-violet-400 focus:bg-white focus:outline-none"
          />
          <button onClick={check} className="rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-6 text-[14px] font-extrabold text-white shadow-lg shadow-violet-500/25 transition active:scale-95">
            확인
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {history.map((h, i) => (
            <span key={i} className={`rounded-full px-3 py-1.5 text-[11.5px] font-extrabold ${h.hit ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
              {h.digit} {h.hit ? '적중 ✓' : '실패'}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
