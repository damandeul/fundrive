export interface DriveRecord {
  id: string
  date: string
  durationSec: number
  distanceKm: number
  avgSpeed: number
  maxSpeed: number
  score: number
  overspeedSec: number
  limit: number
  demo?: boolean
}

export type PostType = 'drive' | 'story' | 'badge' | 'course'

export interface Post {
  id: string
  date: string
  type: PostType
  author: string
  avatar: string
  text: string
  drive?: DriveRecord
  likes: number
  liked: boolean
}

export interface AppState {
  points: number
  streak: number
  bestStreak: number
  badges: string[]
  drives: DriveRecord[]
  posts: Post[]
  bingo: number[]
  bingoCount: number
  mathBest: number
  safetyAgreed: boolean
}
