export type UserRole = "admin" | "student" | "teacher";

export const ADMIN_EMAIL = "administracion@stanfordschoolpatios.com";

export function getDashboardPath(role: UserRole, locale = "es"): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    default:
      return `/${locale}`;
  }
}

export function isUserRole(value: string): value is UserRole {
  return value === "admin" || value === "student" || value === "teacher";
}

export function getRoleForPath(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/teacher")) return "teacher";
  if (pathname.startsWith("/student")) return "student";
  return null;
}
