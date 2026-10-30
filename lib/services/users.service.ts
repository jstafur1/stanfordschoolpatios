import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import { mapProfile } from "@/lib/supabase/mappers";
import type { UserRole } from "@/lib/auth/roles";
import { deleteUserAccount } from "./auth-users.service";
import {
  batchEnrollmentsByStudent,
  setStudentEnrollments,
  type StudentEnrollmentInput,
} from "./enrollments.service";

export type CreateUserInput = {
  email: string;
  password: string;
  role: UserRole;
  fullName?: string;
  languageId?: string;
};

export async function createUser(
  input: CreateUserInput & {
    courseIds?: string[];
    enrollments?: StudentEnrollmentInput[];
  },
) {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    app_metadata: {
      role: input.role,
    },
    user_metadata: {
      role: input.role,
      full_name: input.fullName ?? input.email,
      ...(input.languageId ? { language_id: input.languageId } : {}),
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("User creation failed");

  if (input.role === "student") {
    if (input.enrollments?.length) {
      await setStudentEnrollments(data.user.id, input.enrollments);
    } else if (input.courseIds?.length) {
      const { setStudentEnrollmentsByCourseIds } = await import("./enrollments.service");
      await setStudentEnrollmentsByCourseIds(data.user.id, input.courseIds);
    }
  }

  return data.user;
}

export async function listUsersByRole(role: UserRole) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listUsersByRole",
    await supabase.from("profiles").select("*").eq("role", role),
  );
  return data.map(mapProfile);
}

export async function listAllProfiles() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listAllProfiles",
    await supabase.from("profiles").select("*"),
  );
  return data.map(mapProfile);
}

export type StudentRow = {
  id: string;
  fullName: string | null;
  email: string;
  createdAt: Date;
  courseIds: string[];
  enrollments: StudentEnrollmentInput[];
};

export async function listStudents(): Promise<StudentRow[]> {
  const [profiles, admin, enrollmentsByStudent] = await Promise.all([
    listUsersByRole("student"),
    Promise.resolve(createAdminClient()),
    batchEnrollmentsByStudent(),
  ]);

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw new Error(error.message);

  const emailById = new Map(
    (data.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  return profiles.map((profile) => {
    const enrollments = enrollmentsByStudent.get(profile.id) ?? [];
    return {
      id: profile.id,
      fullName: profile.fullName,
      email: emailById.get(profile.id) ?? "—",
      createdAt: profile.createdAt,
      courseIds: enrollments.map((enrollment) => enrollment.courseId),
      enrollments,
    };
  });
}

export async function updateStudent(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    password?: string;
    courseIds?: string[];
    enrollments?: StudentEnrollmentInput[];
  },
) {
  const supabase = await getSupabase();

  if (input.fullName !== undefined) {
    assertNoError(
      "updateStudentProfile",
      await supabase
        .from("profiles")
        .update({ full_name: input.fullName })
        .eq("id", id),
    );
  }

  const admin = createAdminClient();
  const authUpdates: { email?: string; password?: string } = {};
  if (input.email) authUpdates.email = input.email;
  if (input.password) authUpdates.password = input.password;

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(id, authUpdates);
    if (error) throw new Error(error.message);
  }

  if (input.enrollments !== undefined) {
    await setStudentEnrollments(id, input.enrollments);
  } else if (input.courseIds !== undefined) {
    const { setStudentEnrollmentsByCourseIds } = await import("./enrollments.service");
    await setStudentEnrollmentsByCourseIds(id, input.courseIds);
  }
}

export async function deleteStudent(id: string) {
  await deleteUserAccount(id);
}
