import { BADGES, CHARACTER_STAGES, levelInfo, useApp } from '../store'

export default function My() {
  const app = useApp()
  const { level, progress, next, stage } = levelInfo(app.points)
  const totalKm = Math.round(app.drives.reduce((a, d) => a + d.distanceKm, 0) * 10) / 10

  return (
    <div className="space-y-4 p-4">
      {/* 캐릭터 카드 */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-7 text-center shadow-2xl shadow-slate-900/30">
        {/* 배경 장식 */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-44 w-44 rounded-full bg-indigo-500/25 blur-3xl" />

        <div className="relative">
          <span className="mx-auto flex h-28 w-28 animate-float items-center justify-center rounded-full bg-gradient-to-b from-white/15 to-white/5 text-[64px] shadow-inner ring-1 ring-white/10">
            {stage.icon}
          </span>
          <h2 className="mt-4 text-[22px] font-extrabold tracking-tight text-white">{stage.name}</h2>
          <p className="mt-1 text-[13px] font-semibold text-white/40">
            Lv.{level} · <span className="text-amber-300">{app.points.toLocaleString()}P</span>
          </p>

          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="grad-sunset h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
            />
          </div>
          <p className="mt-2 text-[11.5px] font-medium text-white/35">
            {progress >= 1 ? '최고 레벨이에요!' : `다음 진화까지 ${(next - app.points).toLocaleString()}P — 안전 운전하면 부릉이가 자라나요`}
          </p>
        </div>
      </div>

      {/* 진화 로드맵 */}
      <div className="card p-5">
        <p className="text-[12px] font-extrabold text-slate-400">부릉이 진화 로드맵</p>
        <div className="mt-3 flex items-center justify-between">
          {CHARACTER_STAGES.map((s, i) => (
            <div key={s.name} className="flex flex-col items-center gap-1">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[22px] transition ${
                  i < level ? 'bg-gradient-to-b from-amber-50 to-orange-100 shadow-sm' : 'bg-slate-50 opacity-30 grayscale'
                }`}
                title={s.name}
              >
                {s.icon}
              </span>
              {i === level - 1 && <span className="h-1 w-1 rounded-full bg-orange-400" />}
            </div>
          ))}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          ['🚗', String(app.drives.length), '총 주행'],
          ['🛣️', `${totalKm}`, '누적 km'],
          ['🔥', `${app.bestStreak}`, '최고 스트릭'],
        ].map(([icon, v, label]) => (
          <div key={label} className="card py-5 text-center">
            <p className="text-lg">{icon}</p>
            <p className="mt-1 text-[22px] font-extrabold tracking-tight text-slate-900">{v}</p>
            <p className="text-[11px] font-semibold text-slate-300">{label}</p>
          </div>
        ))}
      </div>

      {/* 배지 */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <p className="text-[15px] font-extrabold text-slate-900">배지 컬렉션</p>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11.5px] font-extrabold text-slate-400">
            {app.badges.length}/{Object.keys(BADGES).length}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {Object.entries(BADGES).map(([id, b]) => {
            const owned = app.badges.includes(id)
            return (
              <div
                key={id}
                className={`rounded-2xl p-3 text-center transition ${
                  owned
                    ? 'border border-amber-200/70 bg-gradient-to-b from-amber-50 to-orange-50 shadow-sm'
                    : 'border border-dashed border-slate-200 bg-slate-50/50 opacity-45'
                }`}
              >
                <p className="text-[26px]">{owned ? b.icon : '🔒'}</p>
                <p className="mt-1 text-[10px] font-extrabold leading-tight text-slate-600">{b.name}</p>
              </div>
            )
          })}
        </div>
      </div>

      <p className="pb-2 text-center text-[11px] font-medium text-slate-300">
        부릉부릉 v0.1 프로토타입 · 데이터는 이 기기에만 저장돼요
      </p>
    </div>
  )
}
