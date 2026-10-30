"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/guards";
import { actionError, actionFail, type ActionResult } from "@/lib/actions/result";
import {
  uploadJobApplicationCv,
} from "@/lib/services/job-applications-storage.service";
import {
  assertJobAcceptingApplications,
  createJobApplication,
  createJobPosting,
  deleteJobPosting,
  updateApplicationStatus,
  updateJobApplicationCv,
  updateJobPosting,
} from "@/lib/services/jobs.service";

function revalidateJobPaths(jobId?: string) {
  revalidatePath("/admin/jobs");
  revalidatePath("/es/employment");
  revalidatePath("/en/employment");
  revalidatePath("/fr/employment");
  if (jobId) {
    revalidatePath(`/admin/jobs/${jobId}/applications`);
    revalidatePath(`/es/employment/${jobId}`);
    revalidatePath(`/en/employment/${jobId}`);
    revalidatePath(`/fr/employment/${jobId}`);
  }
}

function parseJobForm(formData: FormData) {
  const trimOrNull = (key: string) => {
    const value = String(formData.get(key) ?? "").trim();
    return value || null;
  };

  const salaryMin = trimOrNull("salaryMin");
  const salaryMax = trimOrNull("salaryMax");
  const deadline = trimOrNull("applicationDeadline");

  return {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    requirements: trimOrNull("requirements"),
    benefits: trimOrNull("benefits"),
    employmentType: String(formData.get("employmentType") ?? ""),
    workMode: String(formData.get("workMode") ?? ""),
    location: trimOrNull("location"),
    salaryMin,
    salaryMax,
    salaryCurrency: trimOrNull("salaryCurrency") ?? "EUR",
    showSalary: formData.get("showSalary") === "on",
    contactEmail: trimOrNull("contactEmail"),
    contactPhone: trimOrNull("contactPhone"),
    applicationDeadline: deadline ? new Date(deadline).toISOString() : null,
    status: String(formData.get("status") ?? "draft"),
  };
}

export async function createJobPostingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const profile = await requireRole("admin");
    const input = parseJobForm(formData);

    if (!input.title || !input.description || !input.employmentType || !input.workMode) {
      return actionFail("titleRequired");
    }

    await createJobPosting({ ...input, createdBy: profile.id });
    revalidateJobPaths();
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateJobPostingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const id = String(formData.get("id") ?? "");
    const input = parseJobForm(formData);

    if (!id || !input.title || !input.description) {
      return actionFail("titleRequired");
    }

    await updateJobPosting(id, input);
    revalidateJobPaths(id);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteJobPostingAction(id: string): Promise<ActionResult> {
  try {
    await requireRole("admin");
    await deleteJobPosting(id);
    revalidateJobPaths(id);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function submitJobApplicationAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const honeypot = String(formData.get("website") ?? "").trim();
    if (honeypot) {
      return actionFail("honeypotTriggered");
    }

    const jobId = String(formData.get("jobId") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const yearsRaw = String(formData.get("yearsOfExperience") ?? "").trim();
    const linkedinUrl = String(formData.get("linkedinUrl") ?? "").trim();
    const portfolioUrl = String(formData.get("portfolioUrl") ?? "").trim();
    const availabilityStartDate = String(
      formData.get("availabilityStartDate") ?? "",
    ).trim();
    const coverLetter = String(formData.get("coverLetter") ?? "").trim();
    const cvFile = formData.get("cv") as File | null;

    if (!jobId || !fullName || !email) {
      return actionFail("invalidApplication");
    }

    await assertJobAcceptingApplications(jobId);

    const yearsOfExperience = yearsRaw ? Number(yearsRaw) : null;
    const application = await createJobApplication({
      jobPostingId: jobId,
      fullName,
      email,
      phone: phone || null,
      yearsOfExperience: Number.isFinite(yearsOfExperience)
        ? yearsOfExperience
        : null,
      linkedinUrl: linkedinUrl || null,
      portfolioUrl: portfolioUrl || null,
      availabilityStartDate: availabilityStartDate || null,
      coverLetter: coverLetter || null,
    });

    if (cvFile && cvFile.size > 0) {
      const path = await uploadJobApplicationCv(
        jobId,
        application.id,
        cvFile,
      );
      await updateJobApplicationCv(application.id, path, cvFile.name);
    }

    revalidateJobPaths(jobId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateApplicationStatusFormAction(
  formData: FormData,
): Promise<void> {
  await updateApplicationStatusAction(null, formData);
}

export async function updateApplicationStatusAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireRole("admin");
    const applicationId = String(formData.get("applicationId") ?? "");
    const jobId = String(formData.get("jobId") ?? "");
    const status = String(formData.get("status") ?? "");
    const adminNotes = String(formData.get("adminNotes") ?? "").trim();

    if (!applicationId || !status) {
      return actionFail("applicationNotFound");
    }

    await updateApplicationStatus({
      applicationId,
      status,
      adminNotes: adminNotes || null,
    });

    revalidateJobPaths(jobId);
    return { ok: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function getCvDownloadUrlAction(
  storagePath: string,
): Promise<ActionResult & { url?: string }> {
  try {
    await requireRole("admin");
    const { getSignedCvUrl } = await import(
      "@/lib/services/job-applications-storage.service"
    );
    const url = await getSignedCvUrl(storagePath);
    return { ok: true, url };
  } catch (error) {
    return actionError(error);
  }
}
