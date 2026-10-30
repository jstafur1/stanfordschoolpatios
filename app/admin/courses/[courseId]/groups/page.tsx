import { notFound } from "next/navigation";
import { CourseGroupsPanel } from "@/components/admin/groups/course-groups-panel";
import { requireRole } from "@/lib/auth/guards";
import {
  getGroupTeacherIds,
  getNextGroupSortOrder,
  listGroupsForCourse,
} from "@/lib/services/groups.service";
import { listStudents, listUsersByRole } from "@/lib/services/users.service";
import { getCourseById } from "@/lib/services/courses.service";

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function AdminCourseGroupsPage({ params }: Props) {
  const { courseId } = await params;
  await requireRole("admin");

  const [course, groups, teachers, allStudents, nextSortOrder] = await Promise.all([
    getCourseById(courseId),
    listGroupsForCourse(courseId),
    listUsersByRole("teacher"),
    listStudents(),
    getNextGroupSortOrder(courseId),
  ]);

  if (!course) notFound();

  const groupRows = await Promise.all(
    groups.map(async (group) => {
      const teacherIds = await getGroupTeacherIds(group.id);
      const students = allStudents
        .filter((student) =>
          student.enrollments.some(
            (enrollment) =>
              enrollment.courseId === courseId && enrollment.groupId === group.id,
          ),
        )
        .map((student) => ({
          id: student.id,
          fullName: student.fullName,
          email: student.email,
        }));

      return {
        group,
        studentCount: students.length,
        teacherCount: teacherIds.length,
        teacherIds,
        students,
      };
    }),
  );

  return (
    <CourseGroupsPanel
      courseId={courseId}
      groups={groupRows}
      teachers={teachers}
      allStudents={allStudents}
      nextSortOrder={nextSortOrder}
    />
  );
}
