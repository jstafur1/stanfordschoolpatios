"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BreadcrumbItem } from "@/lib/platform/course-nav";

type CourseBreadcrumbContextValue = {
  extraItem: BreadcrumbItem | null;
  setExtraItem: (item: BreadcrumbItem | null) => void;
};

const CourseBreadcrumbContext =
  createContext<CourseBreadcrumbContextValue | null>(null);

export function CourseBreadcrumbProvider({ children }: { children: ReactNode }) {
  const [extraItem, setExtraItemState] = useState<BreadcrumbItem | null>(null);

  const setExtraItem = useCallback((item: BreadcrumbItem | null) => {
    setExtraItemState((current) => {
      if (current?.label === item?.label) return current;
      return item;
    });
  }, []);

  const value = useMemo(
    () => ({ extraItem, setExtraItem }),
    [extraItem, setExtraItem],
  );

  return (
    <CourseBreadcrumbContext.Provider value={value}>
      {children}
    </CourseBreadcrumbContext.Provider>
  );
}

export function useCourseBreadcrumbExtra() {
  return useContext(CourseBreadcrumbContext)?.extraItem ?? null;
}

export function SetCourseBreadcrumb({ label }: { label: string }) {
  const setExtraItem = useContext(CourseBreadcrumbContext)?.setExtraItem;

  useEffect(() => {
    if (!setExtraItem) return;
    setExtraItem({ label });
    return () => setExtraItem(null);
  }, [setExtraItem, label]);

  return null;
}
