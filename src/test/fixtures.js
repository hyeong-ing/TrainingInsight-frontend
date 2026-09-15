export const dashboardFixture = {
  employeeCount: 24,
  courseCount: 13,
  requiredCourseCount: 5,
  overallCompletionRate: 36,
  totalIncompleteEmployeeCount: 33,
  requiredCourseStats: [
    { courseId: 1, courseTitle: '개인정보보호 교육', incompleteCount: 8, completionRate: 67 },
    { courseId: 2, courseTitle: '윤리경영 및 준법 교육', incompleteCount: 12, completionRate: 50 },
    { courseId: 3, courseTitle: '산업안전보건 교육', incompleteCount: 6, completionRate: 75 },
    { courseId: 4, courseTitle: '신입 온보딩 교육', incompleteCount: 5, completionRate: 50 },
    { courseId: 5, courseTitle: '식품안전 교육', incompleteCount: 2, completionRate: 60 },
  ],
};

const employees = [
  { employeeId: 1, name: '김민지', department: '인사팀', position: '매니저', hireType: '경력' },
  { employeeId: 2, name: '이준호', department: '품질관리팀', position: '대리', hireType: '경력' },
  { employeeId: 3, name: '박소라', department: '영업팀', position: '사원', hireType: '신입' },
  { employeeId: 4, name: '최다니엘', department: '개발팀', position: '사원', hireType: '신입' },
  { employeeId: 5, name: '한가람', department: '경영지원팀', position: '대리', hireType: '경력' },
  { employeeId: 6, name: '오하늘', department: '인사팀', position: '사원', hireType: '신입' },
];

const courseDefinitions = [
  ['개인정보보호 교육', '법정교육', true, 'ALL', 'ALL'],
  ['윤리경영 및 준법 교육', '준법교육', true, 'ALL', 'ALL'],
  ['산업안전보건 교육', '법정교육', true, 'ALL', 'ALL'],
  ['신입 온보딩 교육', '온보딩', true, 'ALL', '신입'],
  ['식품안전 교육', '품질관리', true, '품질관리팀', 'ALL'],
  ['AI 업무 자동화 기초', 'AI', false, 'ALL', 'ALL'],
];

export const incompleteFixture = {
  results: courseDefinitions.map(([courseTitle, category, required, targetDepartment, targetHireType], index) => ({
    courseId: index + 1,
    courseTitle,
    category,
    required,
    targetDepartment,
    targetHireType,
    targetEmployeeCount: 12,
    incompleteCount: employees.length,
    completionRate: 50 + index,
    employees: employees.map((employee) => ({ ...employee })),
  })),
};

export const employeeTrainingFixture = {
  results: employees.map((employee, index) => ({
    ...employee,
    targetCourses: [
      {
        courseId: 1,
        title: '개인정보보호 교육',
        category: '법정교육',
        required: true,
        completed: index === 0,
        status: index === 0 ? 'COMPLETED' : 'NOT_STARTED',
      },
      {
        courseId: 2,
        title: '윤리경영 및 준법 교육',
        category: '준법교육',
        required: true,
        completed: false,
        status: 'NOT_STARTED',
      },
    ],
  })),
};

export const aiSearchFixture = {
  interpretedCondition: {
    category: 'AI',
    targetDepartment: 'ALL',
    targetHireType: 'ALL',
    required: false,
    keyword: '업무 자동화',
  },
  reason: 'AI 업무 자동화 관련 선택 교육으로 해석했습니다.',
  fallbackUsed: false,
  results: [
    {
      courseId: 7,
      title: 'AI 업무 자동화 기초',
      category: 'AI',
      description: 'AI를 활용한 반복 업무 자동화 입문 교육입니다.',
      required: false,
      targetDepartment: 'ALL',
      targetHireType: 'ALL',
    },
  ],
};

export function cloneFixture(value) {
  return structuredClone(value);
}
