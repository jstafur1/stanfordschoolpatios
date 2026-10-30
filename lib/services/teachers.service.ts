import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapLanguage,
  mapProfile,
  mapTeacherProfile,
  type Language,
  type Profile,
  type TeacherProfile,
  type TeacherProfileRow,
} from "@/lib/supabase/mappers";
import { deleteUserAccount } from "./auth-users.service";
import { createUser } from "./users.service";
import {
  batchGroupIdsByTeacher,
  getGroupTeacherIds,
  getTeacherCourseIdsFromGroups,
  getTeacherGroupIds,
  setGroupTeachers,
} from "./groups.service";

export type TeacherAdminRow = {
  profile: Profile;
  teacherProfile: TeacherProfile | null;
  language: Language | null;
  email: string;
  courseIds: string[];
  groupIds: string[];
};

export async function listTeachers() {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listTeachers",
    await supabase
      .from("profiles")
      .select(
        `
        *,
        teacher_profiles (
          *,
          languages (*)
        )
      `,
      )
      .eq("role", "teacher"),
  );

  return data.map((row) => {
    const teacherRow = Array.isArray(row.teacher_profiles)
      ? row.teacher_profiles[0]
      : row.teacher_profiles;
    const languageRow = teacherRow?.languages
      ? Array.isArray(teacherRow.languages)
        ? teacherRow.languages[0]
        : teacherRow.languages
      : null;

    return {
      profile: mapProfile({
        id: row.id,
        role: row.role,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
      teacherProfile: teacherRow
        ? mapTeacherProfile({
            profile_id: teacherRow.profile_id,
            language_id: teacherRow.language_id,
            bio: teacherRow.bio,
            created_at: teacherRow.created_at,
          })
        : null,
      language: languageRow ? mapLanguage(languageRow) : null,
    };
  });
}

export async function listTeachersForAdmin(): Promise<TeacherAdminRow[]> {
  const [teachers, admin, groupIdsByTeacher] = await Promise.all([
    listTeachers(),
    Promise.resolve(createAdminClient()),
    batchGroupIdsByTeacher(),
  ]);

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (authError) throw new Error(authError.message);

  const emailById = new Map(
    (authData.users ?? []).map((user) => [user.id, user.email ?? ""]),
  );

  const courseIdsByTeacher = new Map<string, string[]>();
  for (const teacher of teachers) {
    const groupIds = groupIdsByTeacher.get(teacher.profile.id) ?? [];
    const courseIds = await getTeacherCourseIdsFromGroups(teacher.profile.id);
    courseIdsByTeacher.set(teacher.profile.id, courseIds);
    groupIdsByTeacher.set(teacher.profile.id, groupIds);
  }

  return teachers.map((teacher) => ({
    ...teacher,
    email: emailById.get(teacher.profile.id) ?? "—",
    courseIds: courseIdsByTeacher.get(teacher.profile.id) ?? [],
    groupIds: groupIdsByTeacher.get(teacher.profile.id) ?? [],
  }));
}

export async function setTeacherGroups(teacherId: string, groupIds: string[]) {
  const currentGroupIds = await getTeacherGroupIds(teacherId);
  const next = [...new Set(groupIds)];
  const toAdd = next.filter((id) => !currentGroupIds.includes(id));
  const toRemove = currentGroupIds.filter((id) => !next.includes(id));

  for (const groupId of toAdd) {
    const existing = await getGroupTeacherIds(groupId);
    await setGroupTeachers(groupId, [...existing, teacherId]);
  }

  for (const groupId of toRemove) {
    const existing = await getGroupTeacherIds(groupId);
    await setGroupTeachers(
      groupId,
      existing.filter((id) => id !== teacherId),
    );
  }
}

export async function updateTeacherAccount(
  id: string,
  input: {
    fullName?: string;
    email?: string;
    password?: string;
    languageId?: string | null;
    bio?: string | null;
    courseIds?: string[];
    groupIds?: string[];
  },
) {
  const supabase = await getSupabase();

  if (input.fullName !== undefined) {
    assertNoError(
      "updateTeacherProfileName",
      await supabase
        .from("profiles")
        .update({ full_name: input.fullName })
        .eq("id", id),
    );
  }

  if (input.languageId !== undefined || input.bio !== undefined) {
    await updateTeacher(id, {
      ...(input.languageId !== undefined ? { languageId: input.languageId } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
    });
  }

  const admin = createAdminClient();
  const authUpdates: { email?: string; password?: string } = {};
  if (input.email) authUpdates.email = input.email;
  if (input.password) authUpdates.password = input.password;

  if (Object.keys(authUpdates).length > 0) {
    const { error } = await admin.auth.admin.updateUserById(id, authUpdates);
    if (error) throw new Error(error.message);
  }

  if (input.groupIds !== undefined) {
    await setTeacherGroups(id, input.groupIds);
  }
}

export async function deleteTeacher(id: string) {
  await deleteUserAccount(id);
}

export async function createTeacher(input: {
  email: string;
  password: string;
  fullName: string;
  languageId?: string;
  bio?: string;
  courseIds?: string[];
  groupIds?: string[];
}) {
  const user = await createUser({
    email: input.email,
    password: input.password,
    role: "teacher",
    fullName: input.fullName,
    languageId: input.languageId,
  });

  if (input.bio || input.languageId) {
    const supabase = await getSupabase();
    assertNoError(
      "updateTeacherProfile",
      await supabase
        .from("teacher_profiles")
        .update({
          bio: input.bio,
          language_id: input.languageId,
        })
        .eq("profile_id", user.id),
    );
  }

  if (input.groupIds?.length) {
    await setTeacherGroups(user.id, input.groupIds);
  }

  return user;
}

export async function updateTeacher(
  profileId: string,
  input: { languageId?: string | null; bio?: string | null },
) {
  const supabase = await getSupabase();
  const data = throwOnError<TeacherProfileRow>(
    "updateTeacher",
    await supabase
      .from("teacher_profiles")
      .update({
        ...(input.languageId !== undefined
          ? { language_id: input.languageId }
          : {}),
        ...(input.bio !== undefined ? { bio: input.bio } : {}),
      })
      .eq("profile_id", profileId)
      .select()
      .single(),
  );
  return mapTeacherProfile(data);
}
