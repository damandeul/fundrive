import { useEffect, useRef, useState } from 'react'
import type { DriveRecord } from '../types'
import { addDrive, addPoints, addPost, useApp } from '../store'

const LIMITS = [30, 50, 60, 80, 100, 110]

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
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
      // 데모: 속도를 시뮬레이션 (제한속도 근처에서 오르내림, 가끔 초과)
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
    // 1초마다 과속 감점 체크
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
    <div className="p-4 space-y-4">
      {/* 스트릭 배너 */}
      <div className="flex items-center justify-between rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3">
        <span className="text-sm text-orange-800 font-medium">🔥 무과속 스트릭</span>
        <span className="text-lg font-bold text-orange-600">{app.streak}회 연속</span>
      </div>

      {!live && (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-4">
          <h2 className="text-lg font-bold text-slate-800">주행 준비</h2>
          <div>
            <p className="text-sm text-slate-500 mb-2">도로 제한속도 (km/h)</p>
            <div className="grid grid-cols-6 gap-1.5">
              {LIMITS.map((l) => (
                <button
                  key={l}
                  onClick={() => setLimit(l)}
                  className={`rounded-xl py-2 text-sm font-bold transition ${
                    limit === l ? 'bg-sky-500 text-white shadow' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          {gpsError && (
            <p className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{gpsError}</p>
          )}
          <button
            onClick={() => start(false)}
            className="w-full rounded-2xl bg-sky-500 active:bg-sky-600 text-white text-lg font-bold py-4 shadow-lg shadow-sky-200"
          >
            🚗 주행 시작
          </button>
          <button
            onClick={() => start(true)}
            className="w-full rounded-2xl bg-slate-100 active:bg-slate-200 text-slate-600 text-sm font-semibold py-3"
          >
            🎬 데모 주행으로 체험하기 (GPS 없이)
          </button>
          <p className="text-xs text-slate-400 leading-relaxed">
            ⚠️ 주행 중 화면 조작은 하지 마세요. 시작 버튼만 누르면 자동으로 기록됩니다.
          </p>
        </div>
      )}

      {live && (
        <div className={`rounded-3xl p-6 text-center space-y-4 transition-colors ${over ? 'bg-rose-500' : 'bg-slate-900'}`}>
          <p className="text-white/60 text-sm">{live.demo ? '🎬 데모 주행 중' : '🛰️ GPS 주행 중'} · 제한 {limit}km/h</p>
          <div>
            <span className="text-7xl font-black text-white tabular-nums">{Math.round(live.speed)}</span>
            <span className="text-white/60 text-xl ml-1">km/h</span>
          </div>
          {over && <p className="text-white font-bold animate-pulse">천천히~ 부릉이가 걱정해요 🐣</p>}
          <div className="grid grid-cols-3 gap-2 text-white">
            <div className="rounded-xl bg-white/10 py-3">
              <p className="text-2xl font-bold tabular-nums">{Math.round(live.score)}</p>
              <p className="text-xs text-white/60">안전점수</p>
            </div>
            <div className="rounded-xl bg-white/10 py-3">
              <p className="text-2xl font-bold tabular-nums">{live.distanceKm.toFixed(1)}</p>
              <p className="text-xs text-white/60">거리 km</p>
            </div>
            <div className="rounded-xl bg-white/10 py-3">
              <p className="text-2xl font-bold tabular-nums">{Math.round((Date.now() - live.startedAt) / 60000)}</p>
              <p className="text-xs text-white/60">시간 분</p>
            </div>
          </div>
          <button
            onClick={end}
            className="w-full rounded-2xl bg-white text-slate-900 text-lg font-bold py-4"
          >
            주행 종료
          </button>
        </div>
      )}

      {/* 주행 리포트 모달 */}
      {report && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setReport(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 space-y-4 animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <span className="text-5xl">{report.score >= 90 ? '🏆' : report.score >= 70 ? '👍' : '🌱'}</span>
              <h3 className="text-xl font-bold text-slate-800 mt-2">주행 완료!</h3>
              <p className="text-sm text-slate-500">
                {report.overspeedSec === 0 ? '무과속 완주! 스트릭이 이어졌어요 🔥' : '다음엔 더 여유있게 가봐요 😊'}
              </p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 p-4 text-white">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-white/70">안전점수</p>
                  <p className="text-4xl font-black">{report.score}</p>
                </div>
                <p className="text-xs text-white/70 text-right">
                  {report.distanceKm}km · {Math.round(report.durationSec / 60)}분<br />
                  평균 {report.avgSpeed} · 최고 {report.maxSpeed}km/h
                </p>
              </div>
            </div>
            <p className="text-center text-sm font-semibold text-amber-600">
              +{Math.round(report.score / 10) + Math.round(report.distanceKm * 2)} 포인트 획득!
            </p>
            <div className="flex gap-2">
              <button onClick={() => setReport(null)} className="flex-1 rounded-xl bg-slate-100 py-3 font-semibold text-slate-600">닫기</button>
              <button onClick={shareReport} className="flex-1 rounded-xl bg-sky-500 py-3 font-semibold text-white">📸 피드에 공유</button>
            </div>
          </div>
        </div>
      )}

      {/* 최근 주행 */}
      {app.drives.length > 0 && !live && (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5">
          <h3 className="font-bold text-slate-800 mb-3">최근 주행</h3>
          <div className="space-y-2">
            {app.drives.slice(0, 5).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm rounded-xl bg-slate-50 px-3 py-2.5">
                <span className="text-slate-500">{new Date(d.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {d.demo ? '🎬' : '🛰️'}</span>
                <span className="text-slate-600">{d.distanceKm}km</span>
                <span className={`font-bold ${d.score >= 90 ? 'text-emerald-600' : d.score >= 70 ? 'text-amber-600' : 'text-rose-500'}`}>{d.score}점</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
