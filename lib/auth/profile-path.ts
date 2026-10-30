import type { UserRole } from "./roles";

export function getProfilePath(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin/profile";
    case "teacher":
      return "/teacher/profile";
    case "student":
      return "/student/profile";
  }
}
