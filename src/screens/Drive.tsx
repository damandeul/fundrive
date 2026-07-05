import { useEffect, useRef, useState } from 'react'
import type { DriveRecord } from '../types'
import { addDrive, addPoints, addPost, useApp } from '../store'

const LIMITS = [30, 50, 60, 80, 100, 110]
const GAUGE_MAX = 140

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

/* 반원형 속도 게이지 */
function SpeedGauge({ speed, limit, over }: { speed: number; limit: number; over: boolean }) {
  const r = 80
  const cx = 100
  const cy = 106
  const circ = Math.PI * r
  const ratio = Math.min(speed / GAUGE_MAX, 1)
  const arc = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`
  // 제한속도 눈금 위치
  const ang = Math.PI * (1 - Math.min(limit / GAUGE_MAX, 1))
  const tickIn = { x: cx + Math.cos(ang) * (r - 13), y: cy - Math.sin(ang) * (r - 13) }
  const tickOut = { x: cx + Math.cos(ang) * (r + 13), y: cy - Math.sin(ang) * (r + 13) }

  return (
    <svg viewBox="0 0 200 118" className="w-full max-w-[280px]">
      <defs>
        <linearGradient id="gauge-ok" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <linearGradient id="gauge-over" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fda4af" />
          <stop offset="100%" stopColor="#fff" />
        </linearGradient>
      </defs>
      <path d={arc} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="13" strokeLinecap="round" />
      <path
        d={arc}
        fill="none"
        stroke={over ? 'url(#gauge-over)' : 'url(#gauge-ok)'}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${circ * ratio} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <line x1={tickIn.x} y1={tickIn.y} x2={tickOut.x} y2={tickOut.y} stroke="rgba(255,255,255,0.65)" strokeWidth="3" strokeLinecap="round" />
      <text x={cx} y={cy - 18} textAnchor="middle" fontSize="52" fontWeight="900" fill="#fff" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {Math.round(speed)}
      </text>
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.5)">
        km/h
      </text>
    </svg>
  )
}

interface LiveState {
  speed: number
  distanceKm: number
  maxSpeed: number
  score: number
  overspeedSec: number
  startedAt: number
  demo: boolean
}

export default function Drive() {
  const app = useApp()
  const [limit, setLimit] = useState(50)
  const [live, setLive] = useState<LiveState | null>(null)
  const [report, setReport] = useState<DriveRecord | null>(null)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const watchRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const lastPos = useRef<{ lat: number; lon: number; t: number } | null>(null)
  const liveRef = useRef<LiveState | null>(null)
  liveRef.current = live

  function stopSensors() {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current)
    if (tickRef.current !== null) window.clearInterval(tickRef.current)
    watchRef.current = null
    tickRef.current = null
  }

  useEffect(() => () => stopSensors(), [])

  function start(demo: boolean) {
    setGpsError(null)
    setReport(null)
    const init: LiveState = {
      speed: 0, distanceKm: 0, maxSpeed: 0, score: 100, overspeedSec: 0,
      startedAt: Date.now(), demo,
    }
    setLive(init)
    lastPos.current = null

    if (demo) {
      tickRef.current = window.setInterval(() => {
        setLive((prev) => {
          if (!prev) return prev
          const target = limit + (Math.random() < 0.15 ? 12 : -8)
          const speed = Math.max(0, prev.speed + (target - prev.speed) * 0.3 + (Math.random() - 0.5) * 6)
          const over = speed > limit
          return {
            ...prev,
            speed,
            distanceKm: prev.distanceKm + speed / 3600,
            maxSpeed: Math.max(prev.maxSpeed, speed),
            score: over ? Math.max(0, prev.score - 0.5) : prev.score,
            overspeedSec: prev.overspeedSec + (over ? 1 : 0),
          }
        })
      }, 1000)
      return
    }

    if (!('geolocation' in navigator)) {
      setGpsError('이 기기에서 GPS를 사용할 수 없어요. 데모 주행으로 체험해 보세요.')
      setLive(null)
      return
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, speed: rawSpeed } = pos.coords
        const t = pos.timestamp
        setLive((prev) => {
          if (!prev) return prev
          let speedKmh = rawSpeed != null && rawSpeed >= 0 ? rawSpeed * 3.6 : prev.speed
          let addKm = 0
          if (lastPos.current) {
            const dt = (t - lastPos.current.t) / 1000
            const dKm = haversineKm(lastPos.current, { lat, lon })
            if (dt > 0.5 && dKm < 0.5) {
              addKm = dKm
              if (rawSpeed == null || rawSpeed < 0) speedKmh = (dKm / dt) * 3600
            }
          }
          lastPos.current = { lat, lon, t }
          return {
            ...prev,
            speed: speedKmh,
            distanceKm: prev.distanceKm + addKm,
            maxSpeed: Math.max(prev.maxSpeed, speedKmh),
          }
        })
      },
      (err) => {
        setGpsError(err.code === 1 ? '위치 권한이 거부됐어요. 브라우저 설정에서 허용하거나 데모 주행을 이용하세요.' : `GPS 오류: ${err.message}`)
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    )
    tickRef.current = window.setInterval(() => {
      setLive((prev) => {
        if (!prev) return prev
        const over = prev.speed > limit
        return {
          ...prev,
          score: over ? Math.max(0, prev.score - 0.5) : prev.score,
          overspeedSec: prev.overspeedSec + (over ? 1 : 0),
        }
      })
    }, 1000)
  }

  function end() {
    const cur = liveRef.current
    stopSensors()
    if (!cur) return
    const durationSec = Math.round((Date.now() - cur.startedAt) / 1000)
    const record: DriveRecord = {
      id: `d-${Date.now()}`,
      date: new Date().toISOString(),
      durationSec,
      distanceKm: Math.round(cur.distanceKm * 100) / 100,
      avgSpeed: durationSec > 0 ? Math.round((cur.distanceKm / (durationSec / 3600)) * 10) / 10 : 0,
      maxSpeed: Math.round(cur.maxSpeed),
      score: Math.round(cur.score),
      overspeedSec: cur.overspeedSec,
      limit,
      demo: cur.demo,
    }
    const earned = Math.round(record.score / 10) + Math.round(record.distanceKm * 2)
    addDrive(record)
    addPoints(earned)
    setLive(null)
    setReport(record)
  }

  function shareReport() {
    if (!report) return
    addPost({
      id: `p-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'drive',
      author: '나',
      avatar: '🐣',
      text: report.overspeedSec === 0 ? '오늘도 무과속 완주! 🎉' : '오늘의 주행 기록 공유합니다 🚗',
      drive: report,
      likes: 0,
      liked: false,
    })
    setReport(null)
  }

  const over = live ? live.speed > limit : false

  return (
    <div className="space-y-4 p-4">
      {/* 스트릭 배너 */}
      <div className="card flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="grad-sunset flex h-10 w-10 items-center justify-center rounded-2xl text-lg shadow-lg shadow-orange-500/25">🔥</span>
          <div>
            <p className="text-[13px] font-bold text-slate-800">무과속 스트릭</p>
            <p className="text-[11px] text-slate-400">과속 없이 완주하면 이어져요</p>
          </div>
        </div>
        <p className="text-[22px] font-extrabold tracking-tight text-orange-500">
          {app.streak}<span className="ml-0.5 text-[13px] font-bold text-orange-300">회 연속</span>
        </p>
      </div>

      {!live && (
        <div className="card space-y-5 p-6 animate-slide-up">
          <div>
            <h2 className="text-[19px] font-extrabold tracking-tight text-slate-900">주행 준비</h2>
            <p className="mt-0.5 text-[13px] text-slate-400">제한속도를 고르고 출발해요</p>
          </div>
          <div>
            <p className="mb-2 text-[12px] font-bold text-slate-500">도로 제한속도 (km/h)</p>
            <div className="grid grid-cols-6 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
              {LIMITS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={`rounded-xl py-2.5 text-[14px] font-extrabold transition-all ${
                    limit === l ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {gpsError && (
            <p className="rounded-2xl bg-rose-50 p-4 text-[13px] font-medium leading-relaxed text-rose-600">{gpsError}</p>
          )}
          <button
            onClick={() => start(false)}
            className="grad-brand animate-pulse-ring w-full rounded-2xl py-4 text-[17px] font-extrabold text-white shadow-xl shadow-indigo-500/30 transition active:scale-[0.98]"
          >
            🚗 주행 시작
          </button>
          <button
            onClick={() => start(true)}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-[13.5px] font-bold text-slate-500 transition active:bg-slate-50"
          >
            🎬 데모 주행으로 체험하기 <span className="font-medium text-slate-300">· GPS 없이</span>
          </button>
          <p className="text-center text-[11px] leading-relaxed text-slate-300">
            주행 중 화면 조작은 하지 마세요 · 시작 버튼만 누르면 자동 기록
          </p>
        </div>
      )}

      {live && (
        <div className={`animate-slide-up overflow-hidden rounded-[28px] p-6 shadow-2xl transition-colors duration-500 ${over ? 'bg-gradient-to-b from-rose-500 to-rose-600 shadow-rose-500/30' : 'bg-gradient-to-b from-slate-900 to-slate-800 shadow-slate-900/30'}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11.5px] font-bold text-white/80">
              <span className={`h-1.5 w-1.5 rounded-full ${over ? 'bg-white' : 'bg-emerald-400'} animate-pulse`} />
              {live.demo ? '데모 주행 중' : 'GPS 주행 중'}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11.5px] font-bold text-white/80">
              제한 {limit}km/h
            </span>
          </div>

          <div className="mt-2 flex justify-center">
            <SpeedGauge speed={live.speed} limit={limit} over={over} />
          </div>

          <p className={`text-center text-[13.5px] font-bold text-white transition-opacity ${over ? 'opacity-100' : 'opacity-0'}`}>
            천천히~ 부릉이가 걱정해요 🐣
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              [String(Math.round(live.score)), '안전점수'],
              [live.distanceKm.toFixed(1), '거리 km'],
              [String(Math.round((Date.now() - live.startedAt) / 60000)), '시간 분'],
            ].map(([v, label]) => (
              <div key={label} className="rounded-2xl bg-white/10 py-3.5 text-center backdrop-blur">
                <p className="text-[22px] font-extrabold tabular-nums text-white">{v}</p>
                <p className="text-[11px] font-semibold text-white/50">{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={end}
            className="mt-4 w-full rounded-2xl bg-white py-4 text-[16px] font-extrabold text-slate-900 shadow-lg transition active:scale-[0.98]"
          >
            주행 종료
          </button>
        </div>
      )}

      {/* 주행 리포트 모달 */}
      {report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-5 backdrop-blur-sm" onClick={() => setReport(null)}>
          <div className="w-full max-w-sm animate-pop rounded-[28px] bg-white p-7" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <span className="inline-block animate-float text-6xl">{report.score >= 90 ? '🏆' : report.score >= 70 ? '👍' : '🌱'}</span>
              <h3 className="mt-3 text-[22px] font-extrabold tracking-tight text-slate-900">주행 완료!</h3>
              <p className="mt-1 text-[13px] text-slate-400">
                {report.overspeedSec === 0 ? '무과속 완주! 스트릭이 이어졌어요 🔥' : '다음엔 더 여유있게 가봐요 😊'}
              </p>
            </div>
            <div className="grad-brand mt-5 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/25">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] font-bold text-white/60">안전점수</p>
                  <p className="text-[44px] font-black leading-none tracking-tight">{report.score}</p>
                </div>
                <div className="text-right text-[11.5px] font-semibold leading-relaxed text-white/70">
                  {report.distanceKm}km · {Math.round(report.durationSec / 60)}분<br />
                  평균 {report.avgSpeed} · 최고 {report.maxSpeed}km/h
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[14px] font-extrabold text-amber-500">
              +{Math.round(report.score / 10) + Math.round(report.distanceKm * 2)}P 획득!
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setReport(null)} className="flex-1 rounded-2xl bg-slate-100 py-3.5 text-[14px] font-bold text-slate-500 transition active:bg-slate-200">닫기</button>
              <button onClick={shareReport} className="grad-brand flex-1 rounded-2xl py-3.5 text-[14px] font-extrabold text-white shadow-lg shadow-indigo-500/25 transition active:scale-[0.98]">📸 피드에 공유</button>
            </div>
          </div>
        </div>
      )}

      {/* 최근 주행 */}
      {app.drives.length > 0 && !live && (
        <div className="card p-6">
          <h3 className="text-[15px] font-extrabold text-slate-900">최근 주행</h3>
          <div className="mt-3 space-y-1.5">
            {app.drives.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <span className="text-[12.5px] font-semibold text-slate-400">
                  {new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {d.demo ? '🎬' : '🛰️'}
                </span>
                <span className="text-[12.5px] font-bold text-slate-500">{d.distanceKm}km</span>
                <span className={`rounded-full px-2.5 py-1 text-[12px] font-extrabold ${d.score >= 90 ? 'bg-emerald-100 text-emerald-600' : d.score >= 70 ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-500'}`}>
                  {d.score}점
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
