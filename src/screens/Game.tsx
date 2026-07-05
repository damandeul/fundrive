import { useState } from 'react'
import { addBadge, addPoints, setState, useApp } from '../store'

type GameTab = 'math' | 'bingo' | 'predict'

function randPlate(): number[] {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10))
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
    <div className="p-4 space-y-4">
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs text-indigo-700 leading-relaxed">
        🧑‍🤝‍🧑 <b>동승자 모드</b> — 게임은 동승자나 정차 중에만 즐겨주세요. 운전자는 눈은 도로에, 답은 입으로!
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {([['math', '🧮 암산'], ['bingo', '🎱 빙고'], ['predict', '🔮 예언']] as [GameTab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${tab === t ? 'bg-indigo-500 text-white shadow' : 'bg-white text-slate-500 border border-slate-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'math' && <MathGame onToast={showToast} />}
      {tab === 'bingo' && <BingoGame onToast={showToast} bingo={app.bingo} bingoCount={app.bingoCount} />}
      {tab === 'predict' && <PredictGame onToast={showToast} />}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-slate-900 text-white text-sm font-semibold px-5 py-2.5 animate-pop whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  )
}

/* ---------- 암산 게임: 앞차 번호판 숫자 합 맞히기 ---------- */
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
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">번호판 숫자 합 맞히기</h2>
        <span className="text-xs font-bold text-indigo-500">🔥 {combo}콤보</span>
      </div>
      <p className="text-sm text-slate-500">앞차 번호판이에요! 네 숫자의 합은?</p>
      {/* 번호판 */}
      <div className={`mx-auto w-fit rounded-lg border-4 px-5 py-2.5 bg-white transition ${result === 'correct' ? 'border-emerald-400' : result === 'wrong' ? 'border-rose-400' : 'border-slate-800'}`}>
        <span className="text-sm text-slate-500 font-bold mr-2">12가</span>
        <span className="text-3xl font-black tracking-widest tabular-nums">{plate.join('')}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => answer(c)}
            disabled={result !== null}
            className="rounded-xl bg-indigo-50 active:bg-indigo-500 active:text-white text-indigo-700 font-bold py-3.5 text-lg transition disabled:opacity-50"
          >
            {c}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-400">💡 실제로 운전할 땐 동승자가 문제를 내고 운전자가 말로 답해요!</p>
    </div>
  )
}

/* ---------- 빙고: 실제 본 번호판 숫자로 0~9 컬렉션 ---------- */
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
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800">번호판 숫자 빙고</h2>
        <span className="text-xs font-bold text-indigo-500">완성 {bingoCount}회</span>
      </div>
      <p className="text-sm text-slate-500">오늘 본 번호판 숫자를 입력해서 0~9를 모두 모으면 빙고! (+50P)</p>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div
            key={i}
            className={`rounded-xl py-3 text-center text-lg font-black transition ${bingo.includes(i) ? 'bg-indigo-500 text-white shadow' : 'bg-slate-100 text-slate-300'}`}
          >
            {i}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          inputMode="numeric"
          placeholder="본 번호판 숫자 (예: 3971)"
          className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-indigo-400"
        />
        <button onClick={submit} className="rounded-xl bg-indigo-500 text-white font-bold px-5">수집</button>
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
    <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
      <h2 className="font-bold text-slate-800">번호판 숫자 예언</h2>
      <p className="text-sm text-slate-500">
        "다음 번호판엔 <b>이 숫자</b>가 있다!" — 숫자를 고르고, 다음에 본 번호판을 입력하세요. 적중 시 +15P
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => setPicked(i)}
            className={`rounded-xl py-3 text-lg font-black transition ${picked === i ? 'bg-violet-500 text-white shadow animate-pop' : 'bg-slate-100 text-slate-500'}`}
          >
            {i}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="flex gap-2 animate-pop">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && check()}
            inputMode="numeric"
            placeholder={`다음 번호판에 ${picked}이(가) 있을까요?`}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:border-violet-400"
          />
          <button onClick={check} className="rounded-xl bg-violet-500 text-white font-bold px-5">확인</button>
        </div>
      )}
      {history.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {history.map((h, i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-xs font-bold ${h.hit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
              {h.digit} {h.hit ? '적중' : '실패'}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
