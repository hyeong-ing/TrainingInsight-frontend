# 👥 Training Insight 📊

<br/>

<p align="center">

  <br/>
    Codex CLI와 하위 에이전트를 개발 과정에 활용하고<br/>
    이후 기존 UI와 데이터 처리 방식을 다시 검토해<br/>
    접근성, 서버 상태 관리, 테스트 구조까지 개선한 HR 교육 관리 프로젝트입니다.
  <br/>

  <br/>
 
  <img width="800" height="450" alt="image" src="https://github.com/user-attachments/assets/f968f4f7-f6d2-4db3-a36b-4d6514a69fea" />
  
</p>

<br/>
<br/>
<br/>

### 🔶 프로젝트 관련 링크

+ [Github (프론트엔드 코드)](https://github.com/hyeong-ing/TrainingInsight-frontend)
+ [Github (백엔드 코드)](https://github.com/hyeong-ing/TrainingInsight-backend)
+ [Blog (프로젝트 기록)](https://post-this.tistory.com/186)
+ Youtube (동작화면)
+ [Figma (다이어그램)](https://www.figma.com/board/vqi2iGGbuNM2ncDwadaKBz/Training-Insight?node-id=0-1&t=S5bJFuwvUbhZNjm3-1)

<br/>
<br/>

### 🔶 프로젝트 설명
Training Insight는 직원의 부서, 입사 유형, 교육 이수 기록​을 기준으로 HR 담당자가 교육 현황과 미수료자를 관리할 수 있도록 만든 서비스입니다. <br/>
<br/>

<p align="center">
  
  <img width="800" height="500" alt="image" src="https://github.com/user-attachments/assets/719521e0-02f2-4ae9-bbaf-774d40c53aa1" />

</p>

<br/>

+ 전체 교육 현황과 수료율을 Dashboard에서 확인합니다.
+ 교육별 미수료자와 직원별 교육 이수 상태를 조회합니다.
+ 직원의 부서와 입사 유형에 맞는 대상 교육을 자동으로 판별합니다.
+ 체크박스로 직원의 교육 이수 상태를 변경합니다.
+ Fake AI를 이용해 자연어로 교육 조건을 검색합니다.

<br/>
<br/>

### 🔶 기술 스택
+ 프론트엔드 : JavaScript, React, Vite
+ 백엔드 : Java 17, Spring Boot
+ 데이터베이스 : H2 Database
+ 서버 상태 관리 : TanStack Query
+ UI/Feedback : Radix UI, Sonner
+ 테스트 : Vitest, React Testing Library, MSW
+ AI 개발 : Codex CLI, Sub Agent, Project Skill

<br/>
<br/>

### 🔶 1차 개발 → 2차 개선

1차 개발을 이후 기존 프로젝트를 다시 검토하면서
UI 구조뿐 아니라 서버 데이터 관리, 오류 복구, 접근성, 테스트 구조​까지 함께 개선했습니다.

| 영역            | 1차 개발                      | 2차 개선                       |
| ------------- | -------------------------- | --------------------------- |
| **Dashboard** | 비슷한 형태의 카드 반복              | 정보 중요도에 따라 위계 조정            |
| **교육 현황**     | 여러 기능이 한 화면에 배치            | 교육별 / 직원별 Tab 분리            |
| **교육 상세**     | 페이지 내부에 상세 정보 표시           | Drawer로 상세 정보 분리                  |
| **직원 현황**     | 여러 직원 정보가 펼쳐짐              | Accordion으로 한 명씩 확인         |
| **서버 데이터**    | `useState`, `useEffect` 중심 | TanStack Query  기반 서버 상태 관리            |
| **오류 처리**     | 오류 메시지 중심                  | 현재 상태를 유지한 Retry UI                |
| **접근성**       | 부분적으로 적용                   | Focus, Skip Link, ARIA 등 동작 보완 |
| **테스트**       | 자동화 테스트 없음                 | 5개 테스트 파일, 29개 테스트              |

<br/>
<br/>

### 🔶 핵심 개선

### [ 교육 이수 상태 변경 후 여러 화면의 데이터 일관성 유지 ]

#### - Problem

직원의 교육 이수 상태가 변경되면 Dashboard뿐 아니라 교육별 미수료 현황과 직원별 교육 현황도 함께 변경되어야 합니다. <br/>
1차 구현에서는 화면별로 데이터를 직접 조회하고 관리하고 있었습니다. <br/>
그래서 하나의 상태 변경 후 여러 화면의 최신 상태를 각각 관리해야 했습니다.

<br/>

#### - Solution

TanStack Query를 도입해 서버 데이터를 Query 단위로 관리했습니다. <br/>
교육 이수 상태 변경이 성공하면 세 Query를 함께 무효화하여 최신 데이터를 다시 조회하도록 구성했습니다.

`교육 이수 상태 변경 → PATCH 성공 → 관련 Query 무효화 → 최신 데이터 재조회`

무효화 대상 Query: <br/>
‣ `employeeTrainingStatuses` <br/>
‣ `incompleteTrainings` <br/>
‣ `dashboard` <br/>

<br/>

#### - Result

하나의 교육 이수 상태가 변경되어도 관련 화면들이 동일한 최신 서버 데이터를 기준으로 갱신되도록 개선했습니다.

<br/>

### [ 이전 AI 검색 응답이 최신 검색 결과를 덮어쓰는 문제 ]

#### - Problem

사용자가 검색을 연속으로 실행하면 요청 순서와 응답 순서가 달라질 수 있습니다. <br/>
`검색 A 요청 → 검색 B 요청 → 검색 B 응답 → 검색 A 응답` <br/>
이 경우 먼저 실행한 검색 A가 늦게 도착하면서 마지막으로 실행한 검색 B의 결과를 덮어쓸 가능성이 있었습니다.

<br/>

##### - Solution

검색 요청마다 ID를 부여하고 현재 요청 ID와 일치하는 응답만 화면에 반영하도록 변경했습니다. <br/>
검색 초기화할 때도 요청 ID를 변경해 이미 진행 중이던 이전 요청이 이후 화면 상태에 영향을 주지 않도록 처리했습니다.

<br/>

#### - Result

응답 도착 순서와 관계없이 사용자가 마지막으로 실행한 검색 결과만 화면에 유지되도록 개선했습니다.

<br/>

### [ 오류 발생 후 사용자가 작업을 이어갈 수 있도록 Retry 추가 ]

#### - Problem

기존에는 데이터 요청에 실패하면 오류 메시지만 표시되어 사용자가 다시 시도하려면 화면을 새로고침해야 하는 경우가 있었습니다.

<br/>

#### - Solution

실패한 요청만 다시 실행할 수 있도록 Retry 동작을 추가했습니다.

- Dashboard 및 교육 현황 데이터 재조회
- 기존 화면 상태를 유지한 재시도
- 기존 검색어를 유지한 AI 검색 재시도

Retry 과정에서는 가능한 경우 현재 검색어나 화면 상태를 유지하도록 구성했습니다.

<br/>

#### - Result

일시적인 오류가 발생해도 전체 작업을 처음부터 다시 시작하지 않고 현재 흐름 안에서 사용자가 직접 복구할 수 있도록 개선했습니다.

<br/>
<br/>


### 🔶 테스트 및 검증

AI가 수정한 결과를 직접 확인하는 것에서 끝내지 않고 주요 사용자 흐름을 반복 검증할 수 있도록 자동화 테스트를 추가했습니다.

### [ 주요 항목 검증 ]
- Dashboard와 교육 현황의 정상 · 오류 · Retry 흐름
- 교육 이수 상태 변경 후 관련 Query 갱신
- 교육별 / 직원별 Tab 전환
- Drawer 열기 · 닫기 · Focus 복귀
- Accordion 및 Keyboard 동작
- AI 검색과 이전 응답이 최신 결과를 덮어쓰는 상황
- Skip Link와 주요 ARIA 속성

### [ Test Stack ] <br/>
- Vitest
- React Testing Library
- MSW


### [ 결과 ] <br/>
✅ 5 Test Files · 29 Tests Passed <br/>
✅ Production Build <br/>
✅ Browser / Accessibility QA

<br/>
<br/>

### 🔶 Codex CLI 활용 방식
### [ 1차 개발: Codex와 하위 에이전트를 이용한 역할 분리 ]

#### 프로젝트 목표
+ Codex CLI와 하위 에이전트를 실제 프로젝트 개발 과정에 활용해보는 것이었습니다.
+ 프로젝트 전체를 한 번에 요청하지 않고 역할과 기능을 나누어 작업했습니다.

| Agent               | 역할                               |
| ------------------- | -------------------------------- |
| **Backend Worker**  | Spring Boot 도메인 ∙ API ∙ 비즈니스 로직 구현 |
| **Frontend Worker** | React 화면 구성 및 API 연동              |
| **Tester**          | 빌드 및 주요 기능 동작 검증                 |
| **Reviewer**        | 비즈니스 로직 ∙ API 구조 ∙ 테스트 누락 검토       |

<br/>

#### 작업 진행 방식
+ 작업은 `요구사항 정의 → 구현 → 테스트 → 리뷰 → 직접 결과 확인 → 다음 작업 범위 결정`으로 진행했습니다.
+ Codex가 생성한 결과를 그대로 사용하는 것이 아니라 요구사항에 맞게 구현됐는지 직접 확인했습니다.
+ 그리고 그 결과를 바탕으로 다음 작업 범위를 정했습니다.

<br/>


### [ 2차 개발: 완성된 프로젝트 다시 검토 ]
1차 개발 이후 기존 프로젝트를 다시 살펴보았습니다. <br/>
반복적인 UI 구조와 정보 위계뿐 아니라 데이터 처리와 오류 복구 방식도 함께 개선할 필요가 있다고 판단했습니다. <br/>
사용 가능한 Skill을 모두 적용하기보다 현재 프로젝트에서 실제로 개선할 문제와 연결되는지를 기준으로 선택했습니다.
  
#### Project Skill
+ `redesign-existing-projects` <br/>
: 기존 기능을 유지하면서 반복적인 UI 구조와 정보 위계를 다시 검토했습니다.
+ `web-design-guidelines` <br/>
: 접근성, Focus, 입력 요소, 오류 복구, Keyboard interaction 등 웹 UI 품질을 점검하는 기준으로 활용했습니다.

<br/>

#### Library
| 문제            | 적용                              |
| ------------------- | -------------------------------- |
| **교육별/직원별 화면 구분**  | `React UI Tabs` |
| **교육 상세 정보 분리** | `Radix UI Dialog`              |
| **직원 정보 단계적 표시**          | `Radix UI Accordion`                 |
| **서버 데이터 조회 및 갱신**        | `TanStack Query`       |
| **저장 성공 ∙ 실패 피드백**  | `Sonner` |
| **사용자 흐름 자동화 테스트** | `Vitest` · `React Testing Library` · `MSW`             |

<br/>
<br/>

### 🔶 실행 방법
#### Frontend
`npm install`
`npm run dev`

#### Test
`npm test`

#### Production Build
`npm run build`

Backend 서버가 함께 실행되어 있어야 실제 API 기반 기능을 확인할 수 있습니다.





