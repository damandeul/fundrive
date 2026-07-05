import { useState } from 'react'
import type { PostType } from '../types'
import { addPost, fmtDate, toggleLike, useApp } from '../store'

const TYPE_META: Record<PostType, { label: string; color: string }> = {
  drive: { label: '🚗 주행 기록', color: 'bg-sky-100 text-sky-700' },
  story: { label: '💬 에피소드', color: 'bg-amber-100 text-amber-700' },
  badge: { label: '🏅 자랑', color: 'bg-violet-100 text-violet-700' },
  course: { label: '🗺️ 코스 추천', color: 'bg-emerald-100 text-emerald-700' },
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
    <div className="p-4 space-y-3">
      {/* 작성 영역 */}
      {!composing ? (
        <button
          onClick={() => setComposing(true)}
          className="w-full rounded-2xl bg-white border border-slate-200 px-4 py-3.5 text-left text-sm text-slate-400 shadow-sm"
        >
          🐣 오늘 운전길에 무슨 일이 있었나요?
        </button>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3 shadow-sm animate-pop">
          <div className="flex gap-1.5 flex-wrap">
            {(Object.keys(TYPE_META) as PostType[]).filter((t) => t !== 'drive').map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${type === t ? TYPE_META[t].color + ' ring-2 ring-offset-1 ring-slate-300' : 'bg-slate-100 text-slate-400'}`}
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
            className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:border-sky-400 resize-none"
          />
          <p className="text-[11px] text-slate-400">🔒 사진 업로드 시 타인 번호판·얼굴은 자동 블러 처리돼요 (정식 버전)</p>
          <div className="flex gap-2">
            <button onClick={() => setComposing(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-500">취소</button>
            <button onClick={publish} className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white">게시하기</button>
          </div>
        </div>
      )}

      {/* 피드 */}
      {app.posts.map((p) => (
        <article key={p.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg">{p.avatar}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800">{p.author}</p>
              <p className="text-[11px] text-slate-400">{fmtDate(p.date)}</p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TYPE_META[p.type].color}`}>
              {TYPE_META[p.type].label}
            </span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{p.text}</p>
          {p.drive && (
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 p-4 text-white">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/70">안전점수</p>
                  <p className="text-3xl font-black">{p.drive.score}</p>
                </div>
                <p className="text-xs text-white/70 text-right">
                  {p.drive.distanceKm}km · {Math.round(p.drive.durationSec / 60)}분<br />
                  최고 {p.drive.maxSpeed}km/h
                </p>
              </div>
            </div>
          )}
          <button
            onClick={() => toggleLike(p.id)}
            className={`flex items-center gap-1.5 text-sm font-semibold transition ${p.liked ? 'text-rose-500' : 'text-slate-400'}`}
          >
            {p.liked ? '❤️' : '🤍'} {p.likes}
          </button>
        </article>
      ))}
    </div>
  )
}
