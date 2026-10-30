import "server-only";
import { getSupabase } from "@/lib/supabase/server-query";

export async function assertPublishedCourseForStudent(courseId: string) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("published")
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data?.published) {
    throw new Error("This course is not available yet");
  }
}
