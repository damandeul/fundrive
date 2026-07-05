# 🚗 부릉부릉 (BooreungBooreung)

안전 운전이 즐거워지는 드라이브 컴패니언 앱 — MVP 프로토타입

> 상세 기획은 [docs/기획서.md](docs/기획서.md) 참고

## 주요 기능

- **🚗 주행**: GPS 기반 실시간 속도·안전점수·무과속 스트릭, 주행 후 리포트 카드 (GPS 없이 체험 가능한 데모 주행 포함)
- **🎮 게임**: 번호판 암산 게임 / 숫자 빙고 컬렉션 / 숫자 예언 게임 (동승자 모드)
- **📸 피드**: 주행 카드·에피소드·코스 추천 공유, 좋아요
- **🐣 마이**: 포인트·레벨, 부릉이 캐릭터 진화, 배지 컬렉션

## 실행

```bash
npm install
npm run dev     # http://localhost:5173
npm run build   # 프로덕션 빌드
```

## 기술 스택

React 19 + Vite + TypeScript + Tailwind CSS v4.
현재 데이터는 localStorage에 저장 (v0.2에서 Supabase 연동 예정).

## 참고

- GPS 주행은 HTTPS 환경(또는 localhost)에서만 동작합니다 (브라우저 Geolocation 정책).
- 운전 중 화면 조작 금지 — 앱 최초 실행 시 안전 약속 동의 필수.
