import { test, expect } from "@playwright/test";

const studentEmail =
  process.env.E2E_STUDENT_EMAIL ?? "e2e-student@stanfordschoolpatios.com";
const teacherEmail =
  process.env.E2E_TEACHER_EMAIL ?? "e2e-teacher@stanfordschoolpatios.com";
const adminEmail =
  process.env.E2E_ADMIN_EMAIL ?? "administracion@stanfordschoolpatios.com";
const password = process.env.E2E_SEED_PASSWORD ?? "12345678";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/es/login");
  await page.getByLabel(/correo|email/i).fill(email);
  await page.getByLabel(/contraseña|password/i).fill(password);
  await page.getByRole("button", { name: /iniciar|log in|sign in/i }).click();
}

test.describe("Stanford School Patios smoke", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/es");
    await expect(page.locator("#plataforma")).toBeVisible();
  });

  test("login page renders", async ({ page }) => {
    await page.goto("/es/login");
    await expect(page.getByLabel(/correo|email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
  });

  test("admin can login without generic error", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, adminEmail);
    await expect(page).toHaveURL(/\/admin/);
    await expect(
      page.getByText(/could not sign in|no se pudo iniciar/i),
    ).not.toBeVisible();
  });

  test("teacher can login without generic error", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, teacherEmail);
    await expect(page).toHaveURL(/\/teacher/);
    await expect(
      page.getByText(/could not sign in|no se pudo iniciar/i),
    ).not.toBeVisible();
  });

  test("student can login without generic error", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, studentEmail);
    await expect(page).toHaveURL(/\/student/);
    await expect(
      page.getByText(/could not sign in|no se pudo iniciar/i),
    ).not.toBeVisible();
  });

  test("student can see course group roster", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, studentEmail);
    await page.goto("/student");
    await page.getByRole("link", { name: /E2E English Course/i }).click();

    await expect(page.getByText(/E2E Teacher/i)).toBeVisible();
    await expect(page.getByText(/E2E Student/i)).toBeVisible();
  });

  test("student can open course content viewer", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, studentEmail);
    await page.goto("/student");

    await page.getByRole("link", { name: /E2E English Course/i }).click();
    await page.getByRole("link", { name: /view|ver|voir/i }).first().click();

    await expect(page).toHaveURL(/\/content\//);
    await expect(
      page.getByRole("heading", { name: /E2E Sample Video/i }),
    ).toBeVisible();
  });

  test("student can login and open course exams", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, studentEmail);
    await expect(page).toHaveURL(/\/student/);

    await page.getByRole("link", { name: /E2E English Course|exams|exámenes/i }).first().click();
    await page.getByRole("link", { name: /ver exámenes|view exams/i }).click();
    await expect(page.getByRole("heading", { name: /exams|exámenes/i })).toBeVisible();
    await expect(page.getByText(/E2E Smoke Exam/i)).toBeVisible();
  });

  test("student can start exam and submit", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, studentEmail);
    await page.goto("/student");

    const courseLink = page.getByRole("link", { name: /E2E English Course/i });
    await courseLink.click();
    await page.getByRole("link", { name: /ver exámenes|view exams/i }).click();

    const startButton = page.getByRole("button", { name: /start exam|iniciar/i });
    if (await startButton.isVisible()) {
      await startButton.click();
    } else {
      await page.getByRole("link", { name: /continue|continuar/i }).click();
    }

    await expect(page.getByText(/2 \+ 2|What is 2/i)).toBeVisible();
    await page.getByLabel("4").check();
    await page.getByRole("button", { name: /save answer|guardar/i }).click();
    await page.getByRole("button", { name: /submit exam|entregar/i }).click();

    await expect(page).toHaveURL(/\/result/);
    await expect(page.getByText(/E2E Smoke Exam/i)).toBeVisible();
  });

  test("teacher can open grades after student submit", async ({ page }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, teacherEmail);
    await expect(page).toHaveURL(/\/teacher/);

    await page.getByRole("link", { name: /E2E English Course/i }).click();
    await page.getByRole("link", { name: /grades|calificaciones|notes/i }).click();
    await expect(page.getByText(/E2E Smoke Exam/i)).toBeVisible();
  });

  test("open question exam: student submit, teacher grade, student sees result", async ({
    page,
  }) => {
    test.skip(
      !process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Requires Supabase (run npm run seed:e2e first)",
    );

    await login(page, studentEmail);
    await page.goto("/student");
    await page.getByRole("link", { name: /E2E English Course/i }).click();
    await page.getByRole("link", { name: /ver exámenes|view exams/i }).click();

    const openExamRow = page
      .getByRole("listitem")
      .filter({ hasText: /E2E Open Question Exam/i });
    await openExamRow
      .getByRole("button", { name: /start exam|iniciar/i })
      .click();

    await expect(
      page.getByText(/E2E open exam: What is 2 \+ 2\?/i),
    ).toBeVisible();
    await page.getByLabel("4").check();
    await page.getByRole("button", { name: /save answer|guardar/i }).first().click();

    await page
      .getByLabel(/your answer|tu respuesta|votre réponse/i)
      .fill("I enjoy reading books in my free time.");
    await page.getByRole("button", { name: /save answer|guardar/i }).last().click();
    await page.getByRole("button", { name: /submit exam|entregar/i }).click();

    await expect(page).toHaveURL(/\/result/);
    await expect(page.getByText(/E2E Open Question Exam/i)).toBeVisible();
    await expect(
      page.getByText(/pending review|pendiente de revisión|en attente/i),
    ).toBeVisible();
    await expect(
      page.getByText(/correct|correcto|correcte/i).first(),
    ).toBeVisible();

    await login(page, teacherEmail);
    await page.getByRole("link", { name: /E2E English Course/i }).click();
    await page.getByRole("link", { name: /grades|calificaciones|notes/i }).click();
    await expect(
      page.getByText(/E2E Open Question Exam/i),
    ).toBeVisible();
    await page
      .getByRole("button", { name: /^(correct|correcta)$/i })
      .first()
      .click();

    await login(page, studentEmail);
    await page.goto("/student");
    await page.getByRole("link", { name: /E2E English Course/i }).click();
    await page.getByRole("link", { name: /ver exámenes|view exams/i }).click();
    await openExamRow
      .getByRole("link", { name: /view answers|ver respuestas|voir les réponses/i })
      .click();

    await expect(page.getByText(/100%/)).toBeVisible();
    await expect(
      page.getByText(/passed|aprobado|réussi/i).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/correct|correcto|correcte/i).first(),
    ).toBeVisible();
  });
});
