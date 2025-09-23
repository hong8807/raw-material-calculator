# 🎉 원료 사용량 계산기 - 배포 완료

## 📅 배포 정보
- **배포일**: 2025-09-23
- **기술 스택**: Next.js 15.5.3 + TypeScript + Tailwind CSS
- **호스팅**: Vercel
- **상태**: ✅ Production 배포 완료

## 🌐 접속 정보

### Production URL
**메인 URL**: https://raw-material-calculator-next.vercel.app/

### 백업 URL
- https://raw-material-calculator-next-q8czqxrcb-hongs-projects-1ef6c17d.vercel.app/

## 📱 모바일 앱 설치 방법

### Android (Chrome 브라우저)
1. Chrome 브라우저 실행
2. 주소창에 입력: `https://raw-material-calculator-next.vercel.app/`
3. 페이지 로드 완료 대기
4. Chrome 메뉴 버튼(⋮) 클릭
5. **"앱 설치"** 또는 **"홈 화면에 추가"** 선택
6. 설치 확인
7. 홈 화면에서 **"원료계산기"** 아이콘으로 실행

### iOS (Safari 브라우저)
> ⚠️ 주의: iOS는 Safari에서만 설치 가능 (Chrome 불가)

1. **Safari** 브라우저 실행 (Chrome 사용 불가)
2. 주소창에 입력: `https://raw-material-calculator-next.vercel.app/`
3. 페이지 로드 완료 대기
4. 하단 공유 버튼(□↑) 탭
5. **"홈 화면에 추가"** 선택
6. 이름 확인 후 **"추가"** 탭
7. 홈 화면에서 앱 아이콘으로 실행

## 🚀 주요 기능

### 1. 검색 기능
- **성분명 검색**: 원료 성분명으로 검색
- **실생산처 검색**: 제조사명으로 검색
- 실시간 검색 결과 표시

### 2. 계산 기능
- **자동 단위 변환**: mg, g, μg → kg 자동 변환
- **원료 사용량 계산**:
  - 생산량 = 생산실적 ÷ 보험약가
  - 원료사용량(kg) = 생산량 × 단위변환값
- **실시간 합계**: 선택된 항목들의 총 원료량 자동 계산

### 3. 데이터 관리
- **체크박스 선택**: 개별 선택 및 전체 선택
- **CSV 내보내기**: 선택한 데이터를 CSV 파일로 저장
- **모바일 최적화**: 반응형 디자인으로 모든 기기 지원

### 4. PWA 기능
- **오프라인 지원**: 한 번 접속 후 오프라인에서도 사용 가능
- **홈 화면 설치**: 일반 앱처럼 설치 및 실행
- **전체 화면 모드**: 브라우저 UI 없이 앱처럼 사용

## 📊 샘플 데이터
현재 5개의 샘플 데이터가 포함되어 있습니다:
1. 한미탐스플러스정 (탄산수소나트륨)
2. 타이레놀정500mg (아세트아미노펜)
3. 부루펜정 (이부프로펜)
4. 아스피린정100mg (아스피린)
5. 판콜에이내복액 (아세트아미노펜)

## 🔧 기술 상세

### Frontend
- **Framework**: Next.js 15.5.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: manifest.json 구성

### 배포
- **Platform**: Vercel
- **CI/CD**: GitHub 연동 자동 배포
- **Branch**: nextjs

### GitHub
- **Repository**: https://github.com/hong8807/raw-material-calculator
- **Branch**: nextjs (Next.js 버전)

## 📝 향후 계획
1. Supabase 연동으로 실제 데이터베이스 구축
2. 의약품안전나라.xlsx (54,948건) 데이터 업로드
3. 상세 정보 수정 기능 추가
4. 사용자 인증 및 권한 관리

## 🛠️ 개발자 정보

### 로컬 개발
```bash
cd raw-material-calculator-next
npm install
npm run dev
# http://localhost:3000 에서 확인
```

### 배포 명령
```bash
vercel --prod
```

### 프로젝트 구조
```
raw-material-calculator-next/
├── app/
│   ├── page.tsx          # 메인 페이지 컴포넌트
│   ├── layout.tsx        # 레이아웃 설정
│   └── globals.css       # 전역 스타일
├── public/
│   ├── manifest.json     # PWA 설정
│   └── icon-*.png        # 앱 아이콘
├── next.config.js        # Next.js 설정
└── package.json          # 의존성 관리
```

## ⚠️ 주의사항
- iOS는 반드시 Safari에서만 설치 가능
- Chrome에서는 Android만 설치 가능
- 첫 접속 시 네트워크 연결 필요
- CSV 파일은 UTF-8 BOM 인코딩 적용

## 📞 문의
기술 지원이 필요하시면 GitHub Issues를 이용해 주세요.

---
**Last Updated**: 2025-09-23
**Version**: 1.0.0 (Next.js)