import { useSyncExternalStore } from 'react'
import type { AppState, DriveRecord, Post } from './types'

const KEY = 'vroombuddy-v1'

const seedPosts: Post[] = [
  {
    id: 'seed-2', date: new Date(Date.now() - 3600_000).toISOString(), type: 'course',
    author: '드라이브요정', avatar: '🧚',
    text: '북악스카이웨이 야경 코스 강추! 팔각정에서 보는 서울 야경이 끝내줘요 🌃 초보분들도 천천히 가면 OK',
    likes: 24, liked: false,
  },
  {
    id: 'seed-1', date: new Date(Date.now() - 7200_000).toISOString(), type: 'story',
    author: '출근길전사', avatar: '🦸',
    text: '오늘 출근길에 앞차 번호판이 7777이었음!! 로또 사러 갑니다 🍀',
    likes: 42, liked: false,
  },
]

const initial: AppState = {
  points: 0,
  streak: 0,
  bestStreak: 0,
  badges: [],
  drives: [],
  posts: seedPosts,
  bingo: [],
  bingoCount: 0,
  mathBest: 0,
  safetyAgreed: false,
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initial, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return initial
}

let state: AppState = load()
const listeners = new Set<() => void>()

function emit() {
  localStorage.setItem(KEY, JSON.stringify(state))
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => { listeners.delete(l) }
}

export function useApp(): AppState {
  return useSyncExternalStore(subscribe, () => state)
}

export function setState(patch: Partial<AppState>) {
  state = { ...state, ...patch }
  emit()
}

export function addPoints(n: number) {
  setState({ points: Math.max(0, state.points + n) })
}

export const BADGES: Record<string, { icon: string; name: string; desc: string }> = {
  'first-drive': { icon: '🛞', name: '첫 시동', desc: '첫 주행 완료' },
  'perfect-drive': { icon: '💯', name: '퍼펙트 드라이버', desc: '안전점수 100점 주행' },
  'streak-3': { icon: '🔥', name: '3연속 무과속', desc: '무과속 주행 3회 연속' },
  'drive-10': { icon: '🏁', name: '베테랑', desc: '주행 10회 달성' },
  'bingo-master': { icon: '🎱', name: '빙고 마스터', desc: '번호판 숫자 빙고 완성' },
  'math-genius': { icon: '🧠', name: '암산 천재', desc: '암산 게임 5연속 정답' },
  'first-post': { icon: '📸', name: '첫 공유', desc: '피드에 첫 게시물 작성' },
}

export function addBadge(id: string): boolean {
  if (state.badges.includes(id)) return false
  setState({ badges: [...state.badges, id] })
  return true
}

export function addDrive(d: DriveRecord) {
  const noSpeeding = d.overspeedSec === 0
  const streak = noSpeeding ? state.streak + 1 : 0
  setState({
    drives: [d, ...state.drives],
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
  })
  addBadge('first-drive')
  if (d.score >= 100) addBadge('perfect-drive')
  if (streak >= 3) addBadge('streak-3')
  if (state.drives.length >= 10) addBadge('drive-10')
}

export function addPost(p: Post) {
  setState({ posts: [p, ...state.posts] })
  addBadge('first-post')
}

export function toggleLike(id: string) {
  setState({
    posts: state.posts.map((p) =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p,
    ),
  })
}

// 레벨: 필요 포인트 누적 기준
const LEVEL_THRESHOLDS = [0, 100, 300, 700, 1500, 3000, 6000]

export const CHARACTER_STAGES = [
  { icon: '🥚', name: '부릉알' },
  { icon: '🐣', name: '아기 부릉이' },
  { icon: '🚗', name: '꼬마 부릉이' },
  { icon: '🚙', name: '씩씩 부릉이' },
  { icon: '🏎️', name: '씽씽 부릉이' },
  { icon: '🚀', name: '슈퍼 부릉이' },
  { icon: '🌟', name: '전설의 부릉이' },
]

export function levelInfo(points: number) {
  let level = 1
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i + 1
  }
  const cur = LEVEL_THRESHOLDS[level - 1]
  const next = LEVEL_THRESHOLDS[level] ?? cur
  const progress = next > cur ? Math.min(1, (points - cur) / (next - cur)) : 1
  const stage = CHARACTER_STAGES[Math.min(level - 1, CHARACTER_STAGES.length - 1)]
  return { level, progress, next, stage }
}

export function fmtDate(iso: string) {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
