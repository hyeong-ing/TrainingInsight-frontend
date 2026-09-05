# 👥 Training Insight 📊

<br/>

<p align="center">

  <br/>
    Codex CLI와 하위 에이전트를 활용해 처음부터 끝까지 개발한 HR 교육 관리 프로젝트입니다. <br/>
    1차 개발을 마친 뒤, AI가 만든 UI의 반복적인 패턴을 개선하기 위해 <br/>
    새롭게 알게 된 AI Skill과 라이브러리를 Codex에 적용하여 프로젝트를 한 번 더 개선했습니다.<br/>
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
Training Insight는 직원의 부서, 입사 유형, 교육 이수 기록을 기준으로 HR 담당자가 교육 현황과 미수료자를 관리할 수 있도록 만든 서비스입니다. <br/>
<br/>

<p align="center">
  
  <img width="800" height="500" alt="image" src="https://github.com/user-attachments/assets/719521e0-02f2-4ae9-bbaf-774d40c53aa1" />

</p>

<br/>

+ 전체 교육 현황과 수료율을 Dashboard에서 확인합니다.
+ 교육별 미수료자와 직원별 교육 이수 상태를 조회합니다.
+ 직원의 교육 이수 여부를 체크박스로 변경합니다.
+ 직원의 조건에 따라 필요한 교육을 자동으로 판별합니다.
+ 자연어로 교육을 검색할 수 있는 Fake AI 검색 기능을 제공합니다.

<br/>
<br/>

### 🔶 기술 스택
+ 프론트엔드 : JavaScript, React, Vite
+ 백엔드 : Java 17, Spring Boot
+ 데이터베이스 : H2 Database
+ 서버 상태 관리 : TanStack Query
+ UI : Radix UI, Sonner
+ 테스트 : Vitest, React Testing Library, MSW
+ AI 개발 : Codex CLI, Sub Agent, Project Skill

<br/>
<br/>

### 🔶 Codex 개발 과정
#### 1차 개발_ Codex와 하위 에이전트로 프로젝트 개발

1. 프로젝트 목표
+ Codex CLI와 하위 에이전트를 실제 개발 과정에 활용하기.
+ 프로젝트 전체를 한 번에 요청하지 않고 역할과 기능을 나누어 작업하기.

<br/>

2. 하위 에이전트 역할

| Agent               | 역할                               |
| ------------------- | -------------------------------- |
| **Backend Worker**  | Spring Boot 도메인, API, 비즈니스 로직 구현 |
| **Frontend Worker** | React 화면 구성과 API 연동              |
| **Tester**          | 테스트와 빌드 결과 확인                    |
| **Reviewer**        | 비즈니스 로직, API 구조, 테스트 누락 검토       |

<br/>

3. 작업 진행 방식
+ 작업은 [요구사항 정의 → 구현 → 테스트 → 리뷰 → 직접 결과 확인 → 다음 작업]으로 진행했습니다.
+ Codex가 생성한 결과를 그대로 사용하는 것이 아니라 요구사항에 맞게 구현됐는지 직접 확인했습니다.
+ 확인한 결과를 바탕으로 다음 작업 범위를 다시 정하는 방식으로 프로젝트를 완성했습니다.

<br/>

----


#### 2차 개발_ 개선 부분
+ 1차 개발 이후 AI 기반 UI의 반복적인 패턴을 개선할 필요가 있다고 느꼈습니다.
+ Project Skill과 필요한 라이브러리를 추가해 기존 프로젝트를 다시 검토했습니다.
  
| 영역            | 1차 개발                      | 2차 개선                       |
| ------------- | -------------------------- | --------------------------- |
| **Dashboard** | 비슷한 형태의 카드 반복              | 정보 중요도에 따라 위계 조정            |
| **교육 현황**     | 여러 기능이 한 화면에 배치            | 교육별 / 직원별 Tab 분리            |
| **교육 상세**     | 페이지 내부에 상세 정보 표시           | Drawer로 분리                  |
| **직원 현황**     | 여러 직원 정보가 펼쳐짐              | Accordion으로 한 명씩 확인         |
| **서버 데이터**    | `useState`, `useEffect` 중심 | TanStack Query              |
| **오류 처리**     | 오류 메시지 중심                  | Retry 가능한 UI                |
| **접근성**       | 부분적으로 적용                   | Focus, Skip Link, ARIA 등 보완 |
| **테스트**       | 자동화 테스트 없음                 | 5개 파일, 29개 테스트              |

<br/>
<br/>

### 🔶 적용한 Skill & Library
#### Project Skill
+ 다양한 스킬이 있었지만 현재 프로젝트의 문제를 해결할 수 있는지를 기준으로 선택했습니다.
+ `redesign-existing-projects`  <br/>
: 기존 기능을 유지하면서 반복적인 UI와 정보 위계를 다시 검토했습니다.
+ `web-design-guidelines`  <br/>
: 접근성, Focus, 입력 요소, 오류 복구 등 웹 UI 품질을 점검했습니다.

<br/>

#### Library
| 목적                       | 적용                                         |
| ------------------------ | ------------------------------------------ |
| Tab · Drawer · Accordion | `Radix UI`                                 |
| 서버 데이터 조회 및 갱신           | `TanStack Query`                           |
| 저장 성공 · 실패 피드백           | `Sonner`                                   |
| 사용자 흐름 자동화 테스트           | `Vitest` · `React Testing Library` · `MSW` |


<br/>
<br/>

### 🔶 핵심 개선

### [ 교육 이수 상태 변경 후 데이터 일관성 유지 ]

1. 문제
+ 직원의 교육 이수 상태를 변경하면 직원 화면뿐 아니라 Dashboard, 교육별 미수료 현황, 상세 Drawer에도 변경된 데이터가 반영되어야 했습니다.
+ 각 화면에서 데이터를 별도로 관리하면 같은 정보를 서로 다르게 보여줄 가능성이 있었습니다.

2. 해결
+ TanStack Query를 도입하고 상태 변경이 성공하면 관련 Query를 다시 조회하도록 구성했습니다.
+ 교육 이숭 상태 변경 → 관련 Query 갱신 → Dashboard · 교육 현황 · 직원 현황 · Drawer 갱신

3. 결과
+ 하나의 교육 이수 정보가 변경되어도 관련 화면이 동일한 최신 데이터를 기준으로 갱신되도록 개선했습니다.

<br/>

### [ 이전 AI 검색 결과가 최신 검색을 덮어쓰는 문제 ]

1. 문제
+ 사용자가 검색을 연속으로 실행하면서 먼저 시작한 요청이 더 늦게 완료될 수 있었습니다.
+ 이 경우 이전 검색 결과가 마지막으로 요청한 결과를 덮어쓸 가능성이 있었습니다.

2. 해결
+ 검색 요청마다 ID를 부여하고 현재 요청과 일치하는 응답만 화면에 반영하도록 변경했습니다.

3. 결과
+ 검색 응답의 도착 순서가 달라져도 사용자가 마지막으로 실행한 검색 결과가 유지되도록 개선했습니다.

<br/>

### [ 오류 발생 후 다시 시도할 수 없는 문제 ]

1. 문제
+ 기존에는 오류가 발생하면 메시지만 표시되어 사용자가 다시 데이터를 요청하려면 화면을 새로고침해야 하는 경우가 있었습니다.

2. 해결
+ 실패한 작업만 다시 실행할 수 있도록 Retry 동작을 추가했습니다.
```
Dashboard 데이터 다시 불러오기
교육 현황 다시 불러오기
Drawer 상세 데이터 다시 불러오기
기존 검색 조건을 유지한 AI 검색 재시도하기
```
3. 결과
+ 오류가 발생해도 현재 작업 흐름을 유지하면서 사용자가 직접 복구할 수 있도록 개선했습니다.

<br/>
<br/>

### 🔶 테스트 및 검증


<br/>
<br/>










