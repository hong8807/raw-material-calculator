# Vercel 환경변수 설정 가이드

## 1. Vercel 대시보드에서 설정

### 접속 및 이동
1. https://vercel.com 접속 후 로그인
2. `raw-material-calculator-next` 프로젝트 클릭
3. Settings → Environment Variables 메뉴

### 환경변수 추가
다음 두 개의 환경변수를 추가해주세요:

#### 1) NEXT_PUBLIC_SUPABASE_URL
```
Key: NEXT_PUBLIC_SUPABASE_URL
Value: https://xqyjupvsnliunozphenq.supabase.co
Environment: Production, Preview, Development (모두 체크)
```

#### 2) NEXT_PUBLIC_SUPABASE_ANON_KEY
```
Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxeWp1cHZzbmxpdW5venBoZW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjYxMDIsImV4cCI6MjA3NDEwMjEwMn0.rCl2oWnOPqzv_egcOYZl-C-gM34JkOAo7nB9bI0y3Co
Environment: Production, Preview, Development (모두 체크)
```

### 재배포
1. 환경변수 저장 후 Deployments 탭 이동
2. 최신 배포의 ⋮ 메뉴 클릭
3. "Redeploy" 선택
4. "Redeploy" 버튼 클릭

## 2. CLI로 설정 (대안)

```bash
# Vercel CLI 설치 (이미 설치됨)
npm i -g vercel

# 환경변수 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 값 입력: https://xqyjupvsnliunozphenq.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# 값 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 재배포
vercel --prod
```

## 3. 확인사항

### 환경변수가 제대로 설정되었는지 확인
- Vercel 대시보드 → Settings → Environment Variables에서 확인
- 두 개의 변수가 모두 표시되어야 함

### 배포 상태 확인
- Deployments 탭에서 배포 상태 확인
- Ready 상태가 되면 사이트 접속 테스트

### 문제 해결
- 404 에러: 환경변수가 설정되지 않았거나 재배포가 필요함
- 데이터 안 나옴: Supabase API 키가 잘못되었거나 RLS 정책 확인 필요

## Supabase 프로젝트 정보
- Project URL: https://xqyjupvsnliunozphenq.supabase.co
- 데이터: 59,814개 의약품 정보
- 테이블명: drug_items