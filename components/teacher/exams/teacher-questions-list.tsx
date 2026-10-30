"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  deleteQuestionAction,
  reorderQuestionsAction,
} from "@/app/actions/teacher";
import { actionFail } from "@/lib/actions/result";
import {
  ConfirmDeleteDialog,
  useDeleteDialog,
} from "@/components/admin/confirm-delete-dialog";
import { RowActionsMenu } from "@/components/admin/row-actions-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { translateQuestionType } from "@/lib/i18n/enum-labels";
import type { QuestionWithOptions } from "@/lib/services/questions.service";
import { cn } from "@/lib/utils";
import {
  CreateQuestionButton,
  QuestionFormDialog,
} from "./question-form-dialog";

type TeacherQuestionsListProps = {
  courseId: string;
  examId: string;
  questions: QuestionWithOptions[];
};

function optionsPreview(
  row: QuestionWithOptions,
  tc: ReturnType<typeof useTranslations>,
  t: ReturnType<typeof useTranslations>,
): string {
  const { question, options } = row;

  if (question.questionType === "open") {
    return tc("dash");
  }

  if (question.questionType === "true_false") {
    return translateQuestionType("true_false", tc);
  }

  const previewTexts = options
    .slice(0, 2)
    .map((option) => option.text)
    .filter(Boolean)
    .join(", ");

  const countLabel = t("optionsPreview", { count: options.length });
  return previewTexts ? `${countLabel} · ${previewTexts}` : countLabel;
}

type SortableQuestionCardProps = {
  row: QuestionWithOptions;
  displayNumber: number;
  dragEnabled: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function SortableQuestionCard({
  row,
  displayNumber,
  dragEnabled,
  onEdit,
  onDelete,
}: SortableQuestionCardProps) {
  const t = useTranslations("app.teacher.questions");
  const tc = useTranslations("app.common");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 px-4 py-3",
        isDragging && "z-10 rounded-lg bg-muted/50 shadow-sm",
      )}
    >
      <button
        type="button"
        className={cn(
          "mt-0.5 shrink-0 touch-none text-muted-foreground",
          dragEnabled
            ? "cursor-grab hover:text-foreground active:cursor-grabbing"
            : "cursor-not-allowed opacity-40",
        )}
        aria-label={t("dragToReorder")}
        disabled={!dragEnabled}
        {...(dragEnabled ? { ...attributes, ...listeners } : {})}
      >
        <GripVertical className="size-4" />
      </button>

      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums">
        {displayNumber}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {translateQuestionType(row.question.questionType, tc)}
          </Badge>
          <p className="min-w-0 flex-1 truncate font-medium" title={row.question.text}>
            {row.question.text}
          </p>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {optionsPreview(row, tc, t)}
        </p>
      </div>

      <RowActionsMenu onEdit={onEdit} onDelete={onDelete} />
    </li>
  );
}

export function TeacherQuestionsList({
  courseId,
  examId,
  questions: initialQuestions,
}: TeacherQuestionsListProps) {
  const t = useTranslations("app.teacher.questions");
  const tc = useTranslations("app.common");
  const [items, setItems] = useState(initialQuestions);
  const [prevQuestions, setPrevQuestions] = useState(initialQuestions);
  const [filter, setFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionWithOptions | null>(null);
  const [isReordering, startReorder] = useTransition();
  const deleteDialog = useDeleteDialog<QuestionWithOptions>();

  if (initialQuestions !== prevQuestions) {
    setPrevQuestions(initialQuestions);
    setItems(initialQuestions);
  }

  const isFiltering = filter.trim().length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredItems = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return items;
    return items.filter((row) =>
      row.question.text.toLowerCase().includes(query),
    );
  }, [filter, items]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (isFiltering) return;
      const { active, over } = event;
      if (!over || active.id === over.id || isReordering) return;

      const oldIndex = items.findIndex((row) => row.question.id === active.id);
      const newIndex = items.findIndex((row) => row.question.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const nextItems = arrayMove(items, oldIndex, newIndex);
      const previousItems = items;
      setItems(nextItems);

      startReorder(async () => {
        const result = await reorderQuestionsAction(
          examId,
          courseId,
          nextItems.map((row) => row.question.id),
        );
        if (result.ok) {
          toast.success(t("reorderSuccess"));
        } else {
          setItems(previousItems);
          toast.error(t("reorderError"));
        }
      });
    },
    [courseId, examId, isFiltering, isReordering, items, t],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <p className="text-sm font-medium text-muted-foreground">
              {t("count", { count: items.length })}
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={tc("filters.questions")}
                className="pl-8"
              />
            </div>
          </div>
          <CreateQuestionButton onClick={openCreate} />
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <p className="font-medium">{t("emptyTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
            <div className="mt-4">
              <CreateQuestionButton onClick={openCreate} />
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
            {tc("filters.questions")}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredItems.map((row) => row.question.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {filteredItems.map((row) => {
                  const displayNumber =
                    items.findIndex(
                      (item) => item.question.id === row.question.id,
                    ) + 1;
                  return (
                    <SortableQuestionCard
                      key={row.question.id}
                      row={row}
                      displayNumber={displayNumber}
                      dragEnabled={!isFiltering}
                      onEdit={() => {
                        setEditing(row);
                        setFormOpen(true);
                      }}
                      onDelete={() => deleteDialog.openFor(row)}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <QuestionFormDialog
        key={formOpen ? (editing?.question.id ?? "create") : "closed"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        courseId={courseId}
        examId={examId}
        questionRow={editing}
      />

      <ConfirmDeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => {
          if (!open) deleteDialog.close();
        }}
        title={t("deleteTitle")}
        description={t("deleteDescription")}
        onConfirm={async () => {
          const target = deleteDialog.target;
          if (!target) return actionFail("generic");
          const result = await deleteQuestionAction(
            target.question.id,
            examId,
            courseId,
          );
          if (result.ok) {
            setItems((current) =>
              current.filter((row) => row.question.id !== target.question.id),
            );
          }
          return result;
        }}
      />
    </>
  );
}
