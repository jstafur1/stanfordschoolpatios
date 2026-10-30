"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { JobApplyForm } from "@/components/landing/employment/job-apply-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type JobApplyPanelProps = {
  jobId: string;
  jobTitle: string;
};

export function JobApplyPanel({ jobId, jobTitle }: JobApplyPanelProps) {
  const t = useTranslations("employment");
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <JobApplyForm jobId={jobId} variant="panel" />
      </aside>

      <div className="lg:hidden">
        <div className="fixed inset-x-4 bottom-4 z-40">
          <Button
            type="button"
            size="lg"
            className="h-12 w-full rounded-full shadow-lg"
            onClick={() => setOpen(true)}
          >
            {t("applyNow")}
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{jobTitle}</DialogTitle>
            </DialogHeader>
            <JobApplyForm
              jobId={jobId}
              variant="modal"
              onSuccess={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
