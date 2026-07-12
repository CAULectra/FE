// 스모크 테스트용 — Claude 리뷰 검증 후 삭제 예정
// 의도적 버그: admin이 없으면(undefined) admin.name 접근에서 런타임 크래시
export function firstAdminName(users: { name: string; role: string }[]): string {
  const admin = users.find((u) => u.role === "admin");
  return admin.name;
}
