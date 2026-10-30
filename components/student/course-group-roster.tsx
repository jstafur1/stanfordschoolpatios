import { getTranslations } from "next-intl/server";
import type { Profile } from "@/lib/supabase/mappers";
import type { CourseGroup } from "@/lib/supabase/mappers";

type Roster = {
  group: CourseGroup;
  teachers: Profile[];
  students: Array<{ student: Profile }>;
};

type Props = {
  roster: Roster;
  className?: string;
};

export async function CourseGroupRoster({ roster, className }: Props) {
  const t = await getTranslations("app.groups");

  return (
    <section className={className}>
      <h2 className="text-lg font-semibold">
        {t("yourGroup", { name: roster.group.name })}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("teachers")}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {roster.teachers.map((teacher) => (
              <li key={teacher.id}>{teacher.fullName ?? t("unnamedTeacher")}</li>
            ))}
            {roster.teachers.length === 0 ? (
              <li className="text-muted-foreground">{t("noTeachers")}</li>
            ) : null}
          </ul>
        </div>

        <div className="rounded-2xl border border-border p-4">
          <h3 className="text-sm font-medium text-muted-foreground">{t("classmates")}</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {roster.students.map(({ student }) => (
              <li key={student.id}>{student.fullName ?? t("unnamedStudent")}</li>
            ))}
            {roster.students.length === 0 ? (
              <li className="text-muted-foreground">{t("noClassmates")}</li>
            ) : null}
          </ul>
        </div>
      </div>
    </section>
  );
}
