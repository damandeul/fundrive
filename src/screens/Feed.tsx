import { useState } from 'react'
import type { PostType } from '../types'
import { addPost, fmtDate, toggleLike, useApp } from '../store'

const TYPE_META: Record<PostType, { label: string; color: string; ring: string }> = {
  drive: { label: '🚗 주행 기록', color: 'bg-sky-100 text-sky-600', ring: 'from-sky-400 to-indigo-500' },
  story: { label: '💬 에피소드', color: 'bg-amber-100 text-amber-600', ring: 'from-amber-400 to-orange-500' },
  badge: { label: '🏅 자랑', color: 'bg-violet-100 text-violet-600', ring: 'from-violet-400 to-fuchsia-500' },
  course: { label: '🗺️ 코스 추천', color: 'bg-emerald-100 text-emerald-600', ring: 'from-emerald-400 to-teal-500' },
}

export default function Feed() {
  const app = useApp()
  const [composing, setComposing] = useState(false)
  const [text, setText] = useState('')
  const [type, setType] = useState<PostType>('story')

  function publish() {
    if (!text.trim()) return
    addPost({
      id: `p-${Date.now()}`,
      date: new Date().toISOString(),
      type,
      author: '나',
      avatar: '🐣',
      text: text.trim(),
      likes: 0,
      liked: false,
    })
    setText('')
    setComposing(false)
  }

  return (
    <div className="space-y-3 p-4">
      {/* 작성 영역 */}
      {!composing ? (
        <button
          onClick={() => setComposing(true)}
          className="card flex w-full items-center gap-3 px-5 py-4 text-left transition active:scale-[0.99]"
        >
          <span className="grad-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-[2px]">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-lg">🐣</span>
          </span>
          <span className="text-[13.5px] font-medium text-slate-400">오늘 운전길에 무슨 일이 있었나요?</span>
          <span className="ml-auto rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-bold text-slate-400">글쓰기</span>
        </button>
      ) : (
        <div className="card animate-pop space-y-4 p-5">
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(TYPE_META) as PostType[]).filter((t) => t !== 'drive').map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full px-3.5 py-2 text-[12px] font-extrabold transition-all ${
                  type === t ? TYPE_META[t].color + ' shadow-sm ring-2 ring-slate-900/10' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="예: 오늘 옆 차선에 노란 클래식카가 지나갔다! 기분 좋은 출근길 ☀️"
            className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-[14px] leading-relaxed transition focus:border-sky-400 focus:bg-white focus:outline-none"
          />
          <p className="text-[11px] text-slate-300">🔒 사진 업로드 시 타인 번호판·얼굴은 자동 블러 처리돼요 (정식 버전)</p>
          <div className="flex gap-2">
            <button onClick={() => setComposing(false)} className="flex-1 rounded-2xl bg-slate-100 py-3 text-[13.5px] font-bold text-slate-500 transition active:bg-slate-200">취소</button>
            <button onClick={publish} className="grad-brand flex-1 rounded-2xl py-3 text-[13.5px] font-extrabold text-white shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]">게시하기</button>
          </div>
        </div>
      )}

      {/* 피드 */}
      {app.posts.map((p) => (
        <article key={p.id} className="card space-y-3.5 p-5">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr p-[2.5px] ${TYPE_META[p.type].ring}`}>
              <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-xl">{p.avatar}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold text-slate-900">{p.author}</p>
              <p className="text-[11px] font-medium text-slate-300">{fmtDate(p.date)}</p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${TYPE_META[p.type].color}`}>
              {TYPE_META[p.type].label}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-slate-700">{p.text}</p>

          {p.drive && (
            <div className="grad-brand rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/20">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white/60">안전점수</p>
                  <p className="text-[38px] font-black leading-none tracking-tight">{p.drive.score}</p>
                </div>
                <div className="text-right text-[11.5px] font-semibold leading-relaxed text-white/70">
                  {p.drive.distanceKm}km · {Math.round(p.drive.durationSec / 60)}분<br />
                  최고 {p.drive.maxSpeed}km/h
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 border-t border-slate-50 pt-3">
            <button
              onClick={() => toggleLike(p.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-extrabold transition active:scale-95 ${
                p.liked ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'
              }`}
            >
              {p.liked ? '❤️' : '🤍'} {p.likes}
            </button>
            <span className="text-[12px] font-semibold text-slate-300">댓글은 정식 버전에서 🙌</span>
          </div>
        </article>
      ))}
    </div>
  )
}
