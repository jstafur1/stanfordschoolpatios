"use client";

import { useEffect, useRef } from "react";
import { recordContentViewAction } from "@/app/actions/student";

type ContentViewTrackerProps = {
  courseId: string;
  contentId: string;
};

export function ContentViewTracker({
  courseId,
  contentId,
}: ContentViewTrackerProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    void recordContentViewAction(courseId, contentId);
  }, [courseId, contentId]);

  return null;
}
