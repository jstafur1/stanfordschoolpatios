import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  assertNoError,
  getSupabase,
  throwOnError,
} from "@/lib/supabase/server-query";
import {
  mapJobApplication,
  mapJobPosting,
  type JobApplicationRow,
  type JobPostingRow,
} from "@/lib/supabase/mappers";

export type JobPostingInput = {
  title: string;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  employmentType: string;
  workMode: string;
  location?: string | null;
  salaryMin?: string | null;
  salaryMax?: string | null;
  salaryCurrency?: string | null;
  showSalary?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
  applicationDeadline?: string | null;
  status?: string;
  createdBy?: string | null;
};

export type JobApplicationInput = {
  jobPostingId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  yearsOfExperience?: number | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  availabilityStartDate?: string | null;
  coverLetter?: string | null;
  cvStoragePath?: string | null;
  cvOriginalFilename?: string | null;
};

export type JobPostingWithCount = {
  job: ReturnType<typeof mapJobPosting>;
  applicantCount: number;
};

function utcDayStart(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Published jobs stay open through the deadline calendar day (UTC). */
function isJobOpen(job: ReturnType<typeof mapJobPosting>): boolean {
  if (job.status !== "published") return false;
  if (!job.applicationDeadline) return true;
  return utcDayStart(job.applicationDeadline) >= utcDayStart(new Date());
}

export async function listJobPostingsForAdmin(): Promise<JobPostingWithCount[]> {
  const supabase = await getSupabase();
  const result = await supabase
    .from("job_postings")
    .select("*, job_applications(count)")
    .order("created_at", { ascending: false });

  if (result.error) {
    if (
      result.error.message.includes("does not exist") ||
      result.error.message.includes("schema cache") ||
      result.error.code === "42P01"
    ) {
      return [];
    }
    throwOnError("listJobPostingsForAdmin", result);
  }

  const data = result.data ?? [];

  return data.map((row) => {
    const apps = row.job_applications as { count: number }[] | { count: number };
    const count = Array.isArray(apps) ? (apps[0]?.count ?? 0) : (apps?.count ?? 0);
    const { job_applications: _apps, ...jobRow } = row;
    void _apps;
    return {
      job: mapJobPosting(jobRow as JobPostingRow),
      applicantCount: count,
    };
  });
}

export async function getJobPostingById(id: string) {
  const supabase = await getSupabase();
  const data = throwOnError<JobPostingRow | null>(
    "getJobPostingById",
    await supabase.from("job_postings").select("*").eq("id", id).maybeSingle(),
  );
  return data ? mapJobPosting(data) : null;
}

export async function countApplications(jobId: string): Promise<number> {
  const supabase = await getSupabase();
  const { count, error } = await supabase
    .from("job_applications")
    .select("id", { count: "exact", head: true })
    .eq("job_posting_id", jobId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function createJobPosting(input: JobPostingInput) {
  const supabase = await getSupabase();
  const data = throwOnError<JobPostingRow>(
    "createJobPosting",
    await supabase
      .from("job_postings")
      .insert({
        title: input.title,
        description: input.description,
        requirements: input.requirements ?? null,
        benefits: input.benefits ?? null,
        employment_type: input.employmentType,
        work_mode: input.workMode,
        location: input.location ?? null,
        salary_min: input.salaryMin ?? null,
        salary_max: input.salaryMax ?? null,
        salary_currency: input.salaryCurrency ?? "EUR",
        show_salary: input.showSalary ?? false,
        contact_email: input.contactEmail ?? null,
        contact_phone: input.contactPhone ?? null,
        application_deadline: input.applicationDeadline ?? null,
        status: input.status ?? "draft",
        created_by: input.createdBy ?? null,
      })
      .select()
      .single(),
  );
  return mapJobPosting(data);
}

export async function updateJobPosting(id: string, input: JobPostingInput) {
  const supabase = await getSupabase();
  const data = throwOnError<JobPostingRow>(
    "updateJobPosting",
    await supabase
      .from("job_postings")
      .update({
        title: input.title,
        description: input.description,
        requirements: input.requirements ?? null,
        benefits: input.benefits ?? null,
        employment_type: input.employmentType,
        work_mode: input.workMode,
        location: input.location ?? null,
        salary_min: input.salaryMin ?? null,
        salary_max: input.salaryMax ?? null,
        salary_currency: input.salaryCurrency ?? "EUR",
        show_salary: input.showSalary ?? false,
        contact_email: input.contactEmail ?? null,
        contact_phone: input.contactPhone ?? null,
        application_deadline: input.applicationDeadline ?? null,
        status: input.status ?? "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single(),
  );
  return mapJobPosting(data);
}

export async function deleteJobPosting(id: string) {
  const supabase = await getSupabase();
  assertNoError(
    "deleteJobPosting",
    await supabase.from("job_postings").delete().eq("id", id),
  );
}

/** Server-only public catalog; uses service role because anon RLS grants are easy to miss on new tables. */
async function fetchPublishedJobRows() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_postings")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error) {
    if (
      error.message.includes("does not exist") ||
      error.message.includes("schema cache") ||
      error.code === "42P01"
    ) {
      return [] as JobPostingRow[];
    }
    throw new Error(error.message);
  }
  return (data ?? []) as JobPostingRow[];
}

export async function listPublishedJobPostings() {
  const data = await fetchPublishedJobRows();

  return data
    .map((row) => mapJobPosting(row))
    .filter(isJobOpen);
}

export async function getPublishedJobPosting(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_postings")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const job = mapJobPosting(data as JobPostingRow);
  return isJobOpen(job) ? job : null;
}

export async function assertJobAcceptingApplications(jobId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("job_postings")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Job not found");

  const job = mapJobPosting(data as JobPostingRow);
  if (!isJobOpen(job)) {
    throw new Error("Job is not accepting applications");
  }
  return job;
}

export async function createJobApplication(input: JobApplicationInput) {
  const admin = createAdminClient();
  const data = throwOnError<JobApplicationRow>(
    "createJobApplication",
    await admin
      .from("job_applications")
      .insert({
        job_posting_id: input.jobPostingId,
        full_name: input.fullName,
        email: input.email,
        phone: input.phone ?? null,
        years_of_experience: input.yearsOfExperience ?? null,
        linkedin_url: input.linkedinUrl ?? null,
        portfolio_url: input.portfolioUrl ?? null,
        availability_start_date: input.availabilityStartDate ?? null,
        cover_letter: input.coverLetter ?? null,
        cv_storage_path: input.cvStoragePath ?? null,
        cv_original_filename: input.cvOriginalFilename ?? null,
      })
      .select()
      .single(),
  );
  return mapJobApplication(data);
}

export async function updateJobApplicationCv(
  applicationId: string,
  cvStoragePath: string,
  cvOriginalFilename: string,
) {
  const admin = createAdminClient();
  const data = throwOnError<JobApplicationRow>(
    "updateJobApplicationCv",
    await admin
      .from("job_applications")
      .update({
        cv_storage_path: cvStoragePath,
        cv_original_filename: cvOriginalFilename,
      })
      .eq("id", applicationId)
      .select()
      .single(),
  );
  return mapJobApplication(data);
}

export async function listApplicationsForJob(jobId: string) {
  const supabase = await getSupabase();
  const data = throwOnError(
    "listApplicationsForJob",
    await supabase
      .from("job_applications")
      .select("*")
      .eq("job_posting_id", jobId)
      .order("created_at", { ascending: false }),
  );
  return data.map((row) => mapJobApplication(row as JobApplicationRow));
}

export async function getApplicationById(id: string) {
  const supabase = await getSupabase();
  const data = throwOnError<JobApplicationRow | null>(
    "getApplicationById",
    await supabase.from("job_applications").select("*").eq("id", id).maybeSingle(),
  );
  return data ? mapJobApplication(data) : null;
}

export async function updateApplicationStatus(input: {
  applicationId: string;
  status: string;
  adminNotes?: string | null;
}) {
  const supabase = await getSupabase();
  const data = throwOnError<JobApplicationRow>(
    "updateApplicationStatus",
    await supabase
      .from("job_applications")
      .update({
        status: input.status,
        admin_notes: input.adminNotes ?? null,
      })
      .eq("id", input.applicationId)
      .select()
      .single(),
  );
  return mapJobApplication(data);
}
