# 💊 원료 사용량 계산기 PWA

의약품 원료 사용량을 계산하는 모바일 최적화 PWA 앱입니다.

## 🌐 배포 URL

**Production**: https://raw-material-calculator-next.vercel.app/

## 📱 주요 기능

- ✅ 성분명/실생산처 검색
- ✅ 체크박스 선택 (전체 선택 포함)
- ✅ 원료 사용량 자동 계산 (kg 변환)
- ✅ CSV 내보내기
- ✅ 모바일 반응형 디자인
- ✅ PWA 지원 (홈 화면 설치)

## 🚀 빠른 시작

### 로컬 개발
```bash
npm install
npm run dev
# http://localhost:3000 에서 확인
```

### 배포
```bash
vercel --prod
```

## 📲 모바일 설치 가이드

### Android (Chrome)
1. Chrome에서 https://raw-material-calculator-next.vercel.app/ 접속
2. 메뉴(⋮) → "앱 설치" 또는 "홈 화면에 추가"
3. 홈 화면에서 앱 아이콘으로 실행

### iOS (Safari)
1. **Safari**에서 https://raw-material-calculator-next.vercel.app/ 접속
2. 공유 버튼(□↑) → "홈 화면에 추가"
3. 홈 화면에서 앱 아이콘으로 실행

## 🛠️ 기술 스택

- Next.js 15.5.3
- TypeScript
- Tailwind CSS
- PWA (manifest.json)
- Vercel Hosting

## 📁 프로젝트 구조

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

## 📝 상세 문서

더 자세한 정보는 [README_DEPLOYMENT.md](./README_DEPLOYMENT.md)를 참고해주세요.

---
**Version**: 1.0.0
**Last Updated**: 2025-09-23