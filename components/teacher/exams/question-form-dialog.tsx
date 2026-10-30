"use client";

import { useCallback, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  createQuestionAction,
  updateQuestionAction,
} from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormSelect } from "@/components/ui/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { ActionFailure } from "@/lib/actions/result";
import { useActionFormResult } from "@/lib/hooks/use-action-form-result";
import { translateActionError } from "@/lib/i18n/translate-action-error";
import type { QuestionWithOptions } from "@/lib/services/questions.service";

const QUESTION_TYPE_VALUES = [
  "single_choice",
  "multiple_choice",
  "true_false",
  "open",
] as const;

type OptionRow = { text: string; isCorrect: boolean };

type QuestionFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  examId: string;
  questionRow?: QuestionWithOptions | null;
};

function defaultOptions(type: string, existing?: QuestionWithOptions | null): OptionRow[] {
  if (type === "open" || type === "true_false") return [];
  if (existing?.options.length) {
    return existing.options.map((option) => ({
      text: option.text,
      isCorrect: option.isCorrect,
    }));
  }
  return [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ];
}

function defaultTrueFalse(existing?: QuestionWithOptions | null) {
  const trueOption = existing?.options.find((option) => option.text === "True");
  return trueOption?.isCorrect ?? true;
}

export function QuestionFormDialog({
  open,
  onOpenChange,
  courseId,
  examId,
  questionRow,
}: QuestionFormDialogProps) {
  const t = useTranslations("app.teacher.questions");
  const tc = useTranslations("app.common");
  const te = useTranslations("app.errors");
  const isEdit = !!questionRow;
  const action = isEdit ? updateQuestionAction : createQuestionAction;
  const handleSuccess = useCallback(() => {
    toast.success(isEdit ? t("toastUpdated") : t("toastCreated"));
    onOpenChange(false);
  }, [isEdit, onOpenChange, t]);

  const handleError = useCallback(
    (result: ActionFailure) => {
      toast.error(translateActionError(result, te));
    },
    [te],
  );

  const { formAction, pending } = useActionFormResult(action, {
    onSuccess: handleSuccess,
    onError: handleError,
  });

  type QuestionType =
    | "single_choice"
    | "multiple_choice"
    | "true_false"
    | "open";

  const formKey = open ? (questionRow?.question.id ?? "new") : "closed";
  const initialType =
    (questionRow?.question.questionType as QuestionType) ?? "single_choice";
  const [questionType, setQuestionType] = useState<QuestionType>(initialType);
  const [options, setOptions] = useState<OptionRow[]>(() =>
    defaultOptions(initialType, questionRow),
  );
  const [prevFormKey, setPrevFormKey] = useState(formKey);

  if (formKey !== prevFormKey) {
    setPrevFormKey(formKey);
    const nextType =
      (questionRow?.question.questionType as QuestionType) ?? "single_choice";
    setQuestionType(nextType);
    setOptions(defaultOptions(nextType, questionRow));
  }

  const showOptions = useMemo(
    () =>
      questionType === "single_choice" || questionType === "multiple_choice",
    [questionType],
  );


  function handleTypeChange(next: string) {
    const nextType = next as QuestionType;
    setQuestionType(nextType);
    setOptions(defaultOptions(nextType, questionRow));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {open ? (
          <form
            key={questionRow?.question.id ?? "new"}
            action={formAction}
            className="grid gap-4"
          >
            <input type="hidden" name="courseId" value={courseId} />
            <input type="hidden" name="examId" value={examId} />
            {isEdit ? (
              <input type="hidden" name="id" value={questionRow.question.id} />
            ) : null}
            <input type="hidden" name="questionType" value={questionType} />
            <div className="grid gap-2">
              <Label>{tc("columns.type")}</Label>
              <Select
                value={questionType}
                onValueChange={(value) => handleTypeChange(value ?? "single_choice")}
              >
                <SelectTrigger className="w-full">
                  <span className="truncate">
                    {tc(`questionTypes.${questionType}`)}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPE_VALUES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tc(`questionTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="text">{tc("columns.title")}</Label>
              <Input
                id="text"
                name="text"
                required
                defaultValue={questionRow?.question.text ?? ""}
                placeholder={t("textPlaceholder")}
              />
            </div>

            {questionType === "true_false" ? (
              <div className="grid gap-2">
                <Label>{t("correct")}</Label>
                <FormSelect
                  name="trueFalseAnswer"
                  defaultValue={defaultTrueFalse(questionRow) ? "true" : "false"}
                  options={[
                    { value: "true", label: tc("trueFalse.true") },
                    { value: "false", label: tc("trueFalse.false") },
                  ]}
                />
              </div>
            ) : null}

            {showOptions ? (
              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>{t("optionsLabel")}</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setOptions((rows) => [...rows, { text: "", isCorrect: false }])
                    }
                  >
                    <Plus />
                    {t("addOption")}
                  </Button>
                </div>
                {options.map((option, index) => (
                  <div
                    key={index}
                    className="grid gap-2 rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Input
                        name={`optionText_${index}`}
                        value={option.text}
                        onChange={(event) =>
                          setOptions((rows) =>
                            rows.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, text: event.target.value }
                                : row,
                            ),
                          )
                        }
                        placeholder={`${tc("columns.options")} ${index + 1}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={options.length <= 2}
                        onClick={() =>
                          setOptions((rows) =>
                            rows.filter((_, rowIndex) => rowIndex !== index),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      {option.isCorrect ? (
                        <input
                          type="hidden"
                          name={`optionCorrect_${index}`}
                          value="on"
                        />
                      ) : null}
                      <Checkbox
                        checked={option.isCorrect}
                        onCheckedChange={(checked) =>
                          setOptions((rows) =>
                            rows.map((row, rowIndex) =>
                              rowIndex === index
                                ? { ...row, isCorrect: checked === true }
                                : questionType === "single_choice" && checked
                                  ? { ...row, isCorrect: false }
                                  : row,
                            ),
                          )
                        }
                      />
                      {t("correct")}
                    </label>
                  </div>
                ))}
              </div>
            ) : null}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? tc("saving")
                  : isEdit
                    ? tc("saveChanges")
                    : t("createButton")}
              </Button>
            </DialogFooter>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function CreateQuestionButton({ onClick }: { onClick: () => void }) {
  const t = useTranslations("app.teacher.questions");
  return (
    <Button size="sm" onClick={onClick}>
      <Plus />
      {t("newButton")}
    </Button>
  );
}
