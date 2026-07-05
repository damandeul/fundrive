import { BADGES, CHARACTER_STAGES, levelInfo, useApp } from '../store'

export default function My() {
  const app = useApp()
  const { level, progress, next, stage } = levelInfo(app.points)
  const totalKm = Math.round(app.drives.reduce((a, d) => a + d.distanceKm, 0) * 10) / 10

  return (
    <div className="p-4 space-y-4">
      {/* 캐릭터 카드 */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-100 via-orange-50 to-sky-50 border border-amber-200 p-6 text-center space-y-2">
        <span className="inline-block text-7xl animate-wiggle">{stage.icon}</span>
        <h2 className="text-xl font-black text-slate-800">{stage.name}</h2>
        <p className="text-sm text-slate-500">Lv.{level} · {app.points}P</p>
        <div className="h-3 rounded-full bg-white/70 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-400">
          {progress >= 1 ? '최고 레벨이에요!' : `다음 진화까지 ${next - app.points}P — 안전 운전하면 부릉이가 자라나요!`}
        </p>
      </div>

      {/* 진화 로드맵 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <p className="text-xs font-bold text-slate-500 mb-2">부릉이 진화 로드맵</p>
        <div className="flex items-center justify-between">
          {CHARACTER_STAGES.map((s, i) => (
            <span key={s.name} className={`text-2xl transition ${i < level ? '' : 'opacity-25 grayscale'}`} title={s.name}>
              {s.icon}
            </span>
          ))}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          [String(app.drives.length), '총 주행'],
          [`${totalKm}km`, '누적 거리'],
          [`${app.bestStreak}회`, '최고 스트릭'],
        ].map(([v, label]) => (
          <div key={label} className="rounded-2xl bg-white border border-slate-100 shadow-sm py-4 text-center">
            <p className="text-xl font-black text-slate-800">{v}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* 배지 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <p className="text-sm font-bold text-slate-700 mb-3">배지 컬렉션 ({app.badges.length}/{Object.keys(BADGES).length})</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(BADGES).map(([id, b]) => {
            const owned = app.badges.includes(id)
            return (
              <div key={id} className={`rounded-xl p-2.5 text-center ${owned ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 opacity-40'}`}>
                <p className="text-2xl">{owned ? b.icon : '🔒'}</p>
                <p className="text-[10px] font-bold text-slate-600 mt-1 leading-tight">{b.name}</p>
              </div>
            )
          })}
        </div>
      </div>

      <p className="text-center text-[11px] text-slate-300 pb-2">
        부릉부릉 v0.1 프로토타입 · 데이터는 이 기기에만 저장돼요
      </p>
    </div>
  )
}
