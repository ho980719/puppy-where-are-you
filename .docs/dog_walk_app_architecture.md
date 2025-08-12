# Dog Walk & Pet-Friendly Places App — Architecture & Tech Stack

> **Purpose:** 모바일 앱(React Native/Expo) + 백엔드로 구성된 서비스로, 사용자가 산책 경로를 기록하고(트래킹), 반려동반이 가능한 식당/장소를 검색·리뷰·공유할 수 있도록 합니다. 이 문서는 아키텍처, 기술 스택, 주요 API, 데이터베이스 설계, REST 엔드포인트, 오프라인/동기화 전략, 빌드·배포(특히 Expo EAS), 보안 및 운영 고려사항을 **상세하게** 정리한 것입니다.

---

## 목차
1. 목표 및 핵심 기능
2. 전체 아키텍처 개요
3. 기술 스택 (권장)
4. 컴포넌트별 상세 설계
   - 모바일 앱(프론트)
   - 백엔드
   - 데이터베이스
   - 스토리지
   - 외부 API 통합
5. 데이터베이스 스키마 (ERD 형태)
6. REST API 설계 (핵심 엔드포인트)
7. 인증/인가 흐름
8. 오프라인 및 동기화 전략
9. 위치(트래킹)·배터리·백그라운드 고려사항 (iOS/Android 차이)
10. 배포 & CI/CD (EAS 포함)
11. 보안·개인정보·규정 고려사항
12. 운영·모니터링·로깅
13. 권장 개발 로드맵 & 마일스톤
14. 부록: 예시 `eas.json`, Expo 설정 스니펫

---

## 1) 목표 및 핵심 기능
- **핵심가치:** 산책 기록을 쉽고 안전하게 남기고, 반려동반 가능한 장소 정보를 공유받아 편하게 외출할 수 있도록 지원.
- **핵심 기능 목록**
  - 사용자 가입/로그인 (이메일, 소셜 로그인: Apple/Google/Kakao)
  - 실시간 GPS 기반 산책 경로 기록 (start/stop/pause) 및 통계 (거리/시간/속도)
  - 산책 경로 저장, 사진 첨부
  - 반려동반 가능 장소 검색(지도 기반) + 필터(카페/식당/공원/숙소 등)
  - 장소 상세: 리뷰, 사진, 태그(반려동물 친화적,테이블/실내외,애완용품 제공 여부 등)
  - 커뮤니티(게시글, 좋아요, 댓글)
  - 푸시 알림(리뷰 알림, 친구 초대, 이벤트)
  - 오프라인 산책 기록 저장 후 온라인 복원(범위: 네트워크 없이도 기록)

---

## 2) 전체 아키텍처 개요
```
[Mobile (Expo/React Native)] <--> [REST/GQL API Gateway] <--> [Backend (NestJS / Spring Boot)]
                                             |--> PostgreSQL (+ PostGIS)
                                             |--> S3 (images)
                                             |--> Redis (cache, rate-limit)
                                             |--> 3rd party: Google Maps/Kakao, OpenWeather, FCM
```
- 모바일은 Expo 기반으로 개발하여 EAS로 빌드(TestFlight/Play Store/Direct APK).
- 백엔드는 REST(또는 GraphQL) API 제공, 인증은 JWT + Refresh Token.
- 위치 기반 쿼리는 PostGIS로 처리(거리 기반 검색, 반경검색 등).

---

## 3) 기술 스택 (권장)

### 프론트엔드 (모바일)
- **Framework:** React Native + Expo (managed 또는 bare, 기능 필요에 따라)
- **언어:** TypeScript
- **지도:** `react-native-maps` (Google Maps), or web view + Kakao/Naver Map SDK if region-specific
- **상태관리:** Zustand 또는 Redux Toolkit
- **네비게이션:** React Navigation
- **위치/트래킹:** `expo-location`, `react-native-background-geolocation`(필요시)
- **이미지/미디어:** `expo-image-picker`, `expo-media-library`
- **오프라인 DB:** SQLite (`expo-sqlite`) 또는 WatermelonDB/Realm (대량 데이터)
- **파일 업로드:** presigned URL -> S3
- **푸시 알림:** FCM (Android), Apple Push Notification via EAS/Apple 계정 (iOS)

### 백엔드
- **언어 / 프레임워크:** Node.js + NestJS (TypeScript) *또는* Spring Boot (Kotlin/Java)
- **DB:** PostgreSQL + PostGIS
- **ORM:** TypeORM / Prisma (Node) 혹은 JPA (Spring)
- **캐시:** Redis
- **스토리지:** AWS S3 (이미지/미디어)
- **문서화:** Swagger / OpenAPI
- **CI/CD:** GitHub Actions + EAS build steps (모바일) / Docker images

### 인프라
- **클라우드:** AWS / GCP / DigitalOcean
- **컨테이너:** Docker + ECS / Kubernetes (작게 시작하면 ECS / App Runner / Render)
- **CDN:** CloudFront / Cloudflare
- **모니터링:** Sentry (Crash/Errors), Prometheus + Grafana, CloudWatch

---

## 4) 컴포넌트별 상세 설계

### A. 모바일 앱(React Native + Expo)
- **앱 구조 추천**
```
src/
├─ assets/
├─ components/
├─ screens/
│  ├─ Home/
│  ├─ Map/
│  ├─ WalkRecorder/  # 산책 시작/종료/일시정지 화면
│  ├─ Place/
│  └─ Profile/
├─ navigation/
├─ hooks/
├─ services/         # API wrapper, location-service
├─ store/            # Zustand or Redux
├─ utils/
└─ App.tsx
```
- **주요 화면**: 홈, 지도탭(검색), 산책기록(리스트/상세), 기록하기(트래킹), 장소 추가/리뷰, 프로필/설정
- **지도 화면**: 클러스터링, 마커, 현재위치 포커스, 지도 레이어
- **산책 트래킹 구현**: foreground + background 위치 수집, 경로 그리기(Polyline), 거리 계산(turf.js)
- **오프라인**: 기록을 local SQLite에 우선 저장 → 네트워크 회복 시 서버에 업로드

### B. 백엔드 (예: NestJS)
- **모듈 구조**: Auth, Users, Walks, Places, Reviews, Media, Notifications
- **API 기준**: REST 기반, 응답은 표준 `ApiResponse<T>` 형태로 통일
- **대량 위치 연산**: PostGIS의 `ST_DWithin`, `ST_Distance`, `ST_MakeLine` 사용
- **이미지 업로드 흐름**: 모바일 -> 백엔드 요청 -> 백엔드 presigned URL 생성 -> 모바일 S3 업로드 -> 업로드 완료 콜
- **검색/필터**: 장소 타입, 반려동물 허용 여부, 거리, 평점 등

### C. 데이터 저장
- **PostgreSQL + PostGIS**: 장소 위치, 산책 경로(GeoJSON 또는 LineString), 인덱스(GIST)
- **S3**: user photos, place photos
- **Redis**: 세션 (optional), rate-limit, 캐시

---

## 5) 데이터베이스 스키마 (핵심 테이블)
> Postgres (simplified)

### users
```sql
id UUID PRIMARY KEY,
email VARCHAR UNIQUE,
password_hash VARCHAR,
display_name VARCHAR,
avatar_url TEXT,
created_at TIMESTAMP,
... (social ids)
```

### places
```sql
id UUID PRIMARY KEY,
name VARCHAR,
description TEXT,
location GEOGRAPHY(POINT, 4326),
address TEXT,
phone VARCHAR,
tags TEXT[],
is_pet_friendly BOOLEAN DEFAULT false,
metadata JSONB,
created_by UUID REFERENCES users(id),
created_at TIMESTAMP
```

### walks
```sql
id UUID PRIMARY KEY,
user_id UUID REFERENCES users(id),
start_at TIMESTAMP,
end_at TIMESTAMP,
distance_meters DOUBLE PRECISION,
duration_seconds INT,
path GEOMETRY(LINESTRING, 4326), -- or GeoJSON in JSONB
photos TEXT[],
note TEXT,
created_at TIMESTAMP
```

### reviews
```sql
id UUID PRIMARY KEY,
place_id UUID REFERENCES places(id),
user_id UUID REFERENCES users(id),
rating INT,
content TEXT,
photos TEXT[],
created_at TIMESTAMP
```

### place_tags (optional normalized)
- place_id, tag

---

## 6) REST API 설계 (핵심)
**기본 규칙**: `/api/v1` prefix, JSON, 표준 HTTP 상태코드

### Auth
- `POST /api/v1/auth/register` — {email, password, name}
- `POST /api/v1/auth/login` — {email, password} → {accessToken, refreshToken}
- `POST /api/v1/auth/refresh` — {refreshToken}
- `POST /api/v1/auth/social` — social login

### Users
- `GET /api/v1/users/me` — 사용자 정보
- `PUT /api/v1/users/me` — 프로필 수정

### Walks
- `POST /api/v1/walks` — 산책 기록 생성 (body: start_at, end_at, distance, path(GeoJSON), photos[], note)
- `GET /api/v1/walks?userId=&from=&to=&limit=` — 산책 목록
- `GET /api/v1/walks/{id}` — 상세
- `PATCH /api/v1/walks/{id}` — 수정

### Places
- `POST /api/v1/places` — 장소 추가(관리자/사용자)
- `GET /api/v1/places?lat=&lng=&radius=&tags=&petFriendly=&q=` — 반경검색(사용자 위치 기반)
- `GET /api/v1/places/{id}` — 장소 상세 (평균 평점, 리뷰 등)
- `POST /api/v1/places/{id}/reviews` — 리뷰 작성

### Media
- `GET /api/v1/media/presign?filename=...&contentType=...` — presigned S3 URL

### Notifications
- `POST /api/v1/notifications/send` — 푸시 전송(관리자)

---

## 7) 인증/인가 흐름
- 로그인 시 JWT(액세스 토큰, 15m) + Refresh Token(長주기, DB 또는 Redis에 저장)
- 민감한 API는 액세스 토큰 확인
- 소셜 로그인: OAuth flow, 서버에서 idToken 검증
- 토큰 탈취 대비: refresh token은 DB에 저장 후 블랙리스트 또는 revoke 기능 확보

---

## 8) 오프라인 및 동기화 전략
- **원칙:** 사용자 경험 우선 — 네트워크 불안시에 데이터 손실이 없어야 함
- **로컬 저장소:** SQLite에 `walks_pending` 테이블을 만들어 네트워크 연결 시 서버와 동기화
- **충돌 해결:** 마지막 쓰기 우선 또는 타임스탬프 기반 병합
- **이미지 업로드 워크플로우:** 사진은 우선 로컬에 보관(pending), 네트워크 복구 시 presigned URL을 받아 업로드 후 서버에 메타데이터 전송
- **Sync Trigger:** 앱이 foreground로 돌아올 때, 네트워크 복구 이벤트 수신 시, 또는 주기적(수동) 동기화

---

## 9) 위치(트래킹)·배터리·백그라운드 고려사항
- **Android**: background 위치 권한 허용하면 비교적 자유로움. `foreground service`로 안정성 확보.
- **iOS**: 엄격한 제한 — background location 허가(Always) 필요, 사용자는 민감하게 인식함. 앱스토어 심사 시 설명 요구.
- **정밀도 vs 배터리**: 위치 업데이트 간격, distanceFilter 설정 권장(예: 5~10초 또는 5~10m)
- **데이터 압축**: 경로는 모든 포인트를 보내지 말고, Ramer–Douglas–Peucker 같은 알고리즘으로 단순화
- **권한 안내 UX**: 왜 권한이 필요한지 명확히 보여줘야 승인율 높음

---

## 10) 배포 & CI/CD (EAS 포함)

### Expo / EAS 빌드
- `eas build -p ios --profile preview` 로 iOS 빌드 후 TestFlight 업로드(또는 `.ipa` 다운로드)
- `eas build -p android --profile preview` 로 Android `.apk`/`.aab`
- iOS TestFlight 배포를 위해 Apple Developer Program 필요
- EAS Build는 Apple keys/certs 자동 관리 가능(권장)

### CI/CD 예시 (GitHub Actions)
- **워크플로우**
  1. PR 생성 → unit tests, lint
  2. merge → backend Docker image 빌드 → push to registry → deploy to staging
  3. tag/release → run `eas build` (Android/iOS) → upload artifacts → deploy to stores (manual)

### 백엔드 배포
- 이미지 빌드 → ECS/Fargate 또는 Heroku/Render에 배포
- DB 마이그레이션 자동화 (Flyway / Liquibase / Prisma migrate)

---

## 11) 보안·개인정보·규정 고려사항
- **개인정보**: 위치 데이터는 민감정보로 분류될 가능성 있음. 수집·보관·목적을 이용약관/개인정보처리방침에 명시
- **암호화**: 전송(TLS), 저장(민감필드: 암호화 또는 해시)
- **로그 최소화**: 민감한 정보를 로그에 남기지 말 것
- **권한 관리**: 최소 권한 원칙
- **GDPR/국내법**: 해외 서비스 대상으로 할 경우 규정 점검

---

## 12) 운영·모니터링·로깅
- **Crash/Exception**: Sentry
- **성능·인프라**: Prometheus + Grafana / CloudWatch
- **로그 수집**: ELK stack / Cloud provider logging
- **유저 피드백**: In-app feedback form + 이메일/헬프데스크

---

## 13) 권장 개발 로드맵 & 마일스톤 (예: 12주)
- **Week 0-1**: 기획, 와이어프레임(Figma), 데이터 모델 확정
- **Week 2-4**: 백엔드 기초 (Auth, Users, Places 기본 API), DB 세팅
- **Week 3-6**: 모바일 기본 화면(로그인, 지도, 장소검색) + 지도 연동
- **Week 5-8**: 산책 트래킹(로컬/서버 동기화), 사진 업로드, 리뷰 기능
- **Week 8-10**: 오프라인/동기화, 테스트 케이스, QA
- **Week 10-12**: E2E 테스트, EAS 빌드, TestFlight 내부 배포, 배포 준비

---

## 14) 부록: 예시 `eas.json` 및 Expo 설정 스니펫
```json
{
  "build": {
    "production": {
      "ios": {
        "workflow": "managed",
        "buildType": "archive"
      },
      "android": {
        "buildType": "app-bundle"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {"simulator": false},
      "android": {"gradleCommand": ":app:assembleRelease"}
    }
  }
}
```

**expo config (app.json/app.config.js)** - iOS 권한 설명 예시
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSLocationAlwaysAndWhenInUseUsageDescription": "백그라운드에서 산책 경로를 기록하기 위해 위치 접근이 필요합니다.",
        "NSLocationWhenInUseUsageDescription": "산책 시작 시 위치를 사용합니다."
      }
    }
  }
}
```

---

### 마무리
이 문서는 시작부터 배포까지 **엔드투엔드**로 설계된 가이드입니다. 원하시면 다음을 바로 만들어 드릴게요:
- DB 마이그레이션(Prisma schema 또는 SQL) 템플릿
- 핵심 API의 구체적인 구현 샘플(예: `POST /api/v1/walks` NestJS 컨트롤러 + service)
- Expo 앱의 샘플 프로젝트 구조(파일별 간단 코드 스니펫)

원하시는 것을 말해주시면 바로 추가 작성해드릴게요.

