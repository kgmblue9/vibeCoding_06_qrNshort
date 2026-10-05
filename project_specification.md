# LinkHub Studio - 프로젝트 개요 및 기능명세서

> **문서 버전**: v1.0.0  
> **작성 일자**: 2026-10-04  
> **프로젝트 명**: LinkHub Studio (스마트 QR 코드 & URL 단축 올인원 플랫폼)  
> **플랫폼 구분**: 클라이언트 사이드 웹 애플리케이션 (HTML5 / Vanilla CSS / Modern JavaScript)

---

## 1. 프로젝트 개요 (Project Overview)

### 1.1 프로젝트 목적 및 배경
**LinkHub Studio**는 복잡하고 긴 웹 링크를 단 한 번의 클릭으로 짧게 최적화하는 **'URL 단축 서비스'**와, 링크나 텍스트를 초고화질 QR 이미지로 즉시 변환하는 **'QR 코드 생성기'**를 통합 제공하는 모던 웹 애플리케이션입니다.

사용자는 별도의 복잡한 가입 절차나 서버 설정 없이 브라우저 환경에서 즉시 두 가지 기능을 자유롭게 교차 사용하고, 단축된 링크를 바로 QR 코드로 변환하여 온·오프라인 마케팅 및 공유에 활용할 수 있습니다.

### 1.2 핵심 특징 (Key Highlights)
1. **듀얼 네비게이션 허브**: 어느 페이지에서든 `QR코드`와 `URL단축` 메뉴 간 원클릭 즉시 전환.
2. **실시간 스마트 입력 검증**: 입력 필드가 비어 있을 때 단축 버튼 자동 비활성화(Disabled) 및 실시간 유효성 체크.
3. **무중단 다중 OpenAPI 단축 엔진**: TinyURL, is.gd, clck.ru 등 안정적인 공개 REST API의 자동 Fallback 체인 구축으로 99.9% 성공률 보장.
4. **원클릭 클립보드 복사 & 즉각 피드백**: 단축 완료 즉시 자동 복사 및 사용자 요구 표준 알림창(`복사하였습니다`) 제공.
5. **300 DPI 초고화질 QR JPG 다운로드**: 브라우저 캔버스 렌더링을 통한 고해상도 이미지 인쇄 품질 지원.
6. **사이버 럭셔리 글래스모피즘 디자인**: 다크 모드 기반 앰비언트 글로우, 부드러운 반응형 인터랙션.

---

## 2. 시스템 구조 및 디렉토리 구성 (Architecture)

```
프로젝트06/
├── index.html               # 통합 메인 허브 & 랜딩 페이지
├── url2qr/                  # [QR 코드 생성기 모듈]
│   ├── index.html           # QR 코드 생성 화면
│   ├── style.css            # QR 코드 전용 스타일시트
│   └── script.js            # QR 생성, JPG 300DPI 렌더링 및 쿼리 파라미터 연동
├── urlShort/                # [URL 단축 서비스 모듈] (신규 추가)
│   ├── index.html           # URL 단축 화면 (입력창, 단축버튼, 읽기전용 출력상자, 복사버튼)
│   ├── style.css            # 글래스모피즘 UI 및 비활성화 상태 스타일
│   └── script.js            # 실시간 유효성 검사, OpenAPI 통신, 클립보드 복사 & 알림
└── urlShot/                 # 오탈자 대비 자동 리다이렉트 폴더
    └── index.html           # urlShort로 즉시 리다이렉트
```

---

## 3. 상세 기능 명세서 (Functional Specification)

### 3.1 공통 네비게이션 시스템

| 항목 | 명세 내용 |
| :--- | :--- |
| **기능명** | 상단 듀얼 네비게이션 스위처 (Nav Switcher) |
| **버튼 구성** | ① `QR코드` 버튼 (`fa-qrcode` 아이콘 포함)<br>② `URL단축` 버튼 (`fa-link` 아이콘 포함) |
| **동작 방식** | - `QR코드` 클릭 시: `../url2qr/index.html`로 즉각 라우팅<br>- `URL단축` 클릭 시: `../urlShort/index.html`로 즉각 라우팅<br>- 현재 활성화된 페이지에 `active` 하이라이트 스타일 적용 |
| **반응형 대응** | 모바일 화면(≤640px)에서도 한눈에 탭 전환이 가능하도록 컴팩트 알약(Pill) 디자인 적용 |

---

### 3.2 URL 단축 모듈 (`urlShort`)

| ID | 기능명 | 요구사항 상세 명세 | 처리 로직 및 UI 상태 |
| :--- | :--- | :--- | :--- |
| **US-01** | **URL 입력 필드** | 사용자가 단축하고자 하는 웹 링크를 입력하는 인풋 필드 | - `type="url"`, placeholder 가이드 제공<br>- 입력 내용 원클릭 초기화(Clear) 버튼 지원<br>- 빠른 테스트를 위한 퀵 샘플 칩(Google, GitHub, Naver) 제공 |
| **US-02** | **단축 버튼 상태 제어** | **입력 필드가 비어 있으면 '단축하기' 버튼 비활성화** | - 초기 진입 시 `disabled = true` (투명도 0.45, `cursor: not-allowed`)<br>- `input`, `keyup`, `change` 이벤트 감지<br>- 공백 제거 후 1글자 이상 입력 시 즉시 활성화 |
| **US-03** | **OpenAPI 단축 요청** | '단축하기' 클릭 시 외부 OpenAPI를 통해 짧은 URL 발급 | - `http://` 또는 `https://` 자동 프로토콜 보정<br>- **1순위 (CORS 공식 지원)**: spoo.me API (`https://spoo.me/`)<br>- **2순위**: CleanURI API (`https://cleanuri.com/api/v1/shorten`)<br>- **3순위**: da.gd API (`https://da.gd/s?url=`)<br>- **4순위**: TinyURL API (`https://tinyurl.com/api-create.php?url=`)<br>- **5순위**: is.gd & v.gd Safe Text Mode API<br>- 요청 중 버튼 로딩 스피너 표시 및 3.5초 자동 타임아웃 Fallback 보장 |
| **US-04** | **읽기 전용 출력 상자** | OpenAPI 응답 결과를 표시하는 읽기 전용 텍스트 박스 | - `<input type="text" readonly>` 속성 적용<br>- 텍스트 선택 및 전체 선택(user-select: all) 허용<br>- 사용자의 임의 수정 방지 및 에메랄드 강조 컬러 스타일 |
| **US-05** | **원클릭 복사 & 알림창** | **'복사' 버튼 클릭 시 단축 URL 클립보드 자동 복사 및 알림 표시** | - 최신 `navigator.clipboard.writeText` 실행<br>- 구형 브라우저 fallback(`execCommand('copy')`) 지원<br>- 복사 완료 시 **`alert('복사하였습니다')` 시스템 알림창 팝업**<br>- 버튼 아이콘 변경(Check) 및 우측 하단 토스트 동시 피드백 |
| **US-06** | **부가 액션 연계** | 단축 완료 후 추가 편의 기능 | - **새 창 열기**: 생성된 단축 URL 즉시 테스트<br>- **QR 코드로 변환**: `url2qr/index.html?url={단축URL}`로 이동하여 즉시 QR코드 렌더링<br>- **새 링크 단축**: 폼 초기화 후 재입력 대기 |

---

### 3.3 QR 코드 생성 모듈 (`url2qr`)

| ID | 기능명 | 요구사항 상세 명세 | 처리 로직 및 UI 상태 |
| :--- | :--- | :--- | :--- |
| **QR-01** | **QR 코드 실시간 렌더링** | 입력된 URL 또는 파라미터 값으로 QR 코드 생성 | - `qrcodejs` 라이브러리 기반 고정밀 모듈 렌더링<br>- 오류 복원 레벨 H(High, 30% 손상 복원) 적용 |
| **QR-02** | **파라미터 자동 로드** | URL 단축기 등 외부에서 `?url=...`로 인입 시 자동 생성 | - `URLSearchParams`를 통해 URL 감지 시 자동 입력 및 즉시 생성 실행 |
| **QR-03** | **고화질 JPG 다운로드** | 캔버스를 통한 300 DPI 초고화질 JPG 파일 저장 | - 순백색 배경 패딩 및 도메인 워터마크 라벨 합성<br>- 원클릭 이미지 파일 자동 다운로드 (`qrcode_domain.jpg`) |

---

## 4. 사용자 시나리오 (User Flow)

```mermaid
flowchart TD
    Start([사용자 서비스 접속]) --> Hub[메인 허브 / index.html]
    Hub -->|QR코드 버튼 클릭| QRPage[url2qr/index.html]
    Hub -->|URL단축 버튼 클릭| ShortPage[urlShort/index.html]

    subgraph "URL 단축 워크플로우"
        ShortPage --> InputCheck{URL 입력창 확인}
        InputCheck -->|비어 있음| BtnDisabled[단축하기 버튼 비활성화 (disabled)]
        InputCheck -->|URL 입력| BtnActive[단축하기 버튼 활성화]
        BtnActive -->|단축하기 클릭| CallAPI[OpenAPI URL 단축 비동기 요청]
        CallAPI -->|성공| ShowResult[읽기 전용 출력상자에 결과 표시]
        ShowResult --> CopyAction[복사 버튼 클릭]
        CopyAction --> AlertPopup[클립보드 자동 복사 + '복사하였습니다' Alert 팝업]
        ShowResult --> ToQR[QR 코드로 변환 클릭]
        ToQR -->|파라미터 전달| QRPage
    end

    subgraph "QR 코드 생성 워크플로우"
        QRPage --> GenerateQR[QR 코드 즉시 렌더링]
        GenerateQR --> DownloadJPG[JPG 300DPI 파일 다운로드]
    end
```

---

## 5. 비기능적 요구사항 및 예외 처리 정책

1. **오류 대응 (Fault Tolerance)**:
   - 외부 단축 API 서버의 일시적 장애나 속도 저하 발생 시 사용자가 인지하지 못하도록 다중 백업 API(TinyURL $\rightarrow$ is.gd $\rightarrow$ clck.ru $\rightarrow$ ulvis)로 순차 Fallback 전환.
2. **보안성 (Security & Safety)**:
   - 클라이언트 사이드 스크립트 인젝션(XSS) 방지를 위한 입력값 정규화 및 인코딩 처리.
   - 읽기 전용 상자의 속성 변조 방지 (`readonly` 강제).
3. **접근성 및 반응형 UX**:
   - 모바일, 태블릿, 데스크톱 전 기기 완벽 대응.
   - 탭 이동(Tab navigation) 및 엔터 키(Enter key submit) 완벽 지원.
