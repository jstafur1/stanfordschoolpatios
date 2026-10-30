# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Stanford School Patios smoke >> login page renders
- Location: e2e/smoke.spec.ts:22:7

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/es/login
Call log:
  - navigating to "http://localhost:3000/es/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const studentEmail =
  4  |   process.env.E2E_STUDENT_EMAIL ?? "e2e-student@stanfordschoolpatios.com";
  5  | const teacherEmail =
  6  |   process.env.E2E_TEACHER_EMAIL ?? "e2e-teacher@stanfordschoolpatios.com";
  7  | const password = process.env.E2E_SEED_PASSWORD ?? "123456";
  8  | 
  9  | async function login(page: import("@playwright/test").Page, email: string) {
  10 |   await page.goto("/es/login");
  11 |   await page.getByLabel(/correo|email/i).fill(email);
  12 |   await page.getByLabel(/contraseña|password/i).fill(password);
  13 |   await page.getByRole("button", { name: /iniciar|log in|sign in/i }).click();
  14 | }
  15 | 
  16 | test.describe("Stanford School Patios smoke", () => {
  17 |   test("landing page loads", async ({ page }) => {
  18 |     await page.goto("/es");
  19 |     await expect(page.locator("#plataforma")).toBeVisible();
  20 |   });
  21 | 
  22 |   test("login page renders", async ({ page }) => {
> 23 |     await page.goto("/es/login");
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/es/login
  24 |     await expect(page.getByLabel(/correo|email/i)).toBeVisible();
  25 |     await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
  26 |   });
  27 | 
  28 |   test("student can login and open course exams", async ({ page }) => {
  29 |     test.skip(
  30 |       !process.env.SUPABASE_SERVICE_ROLE_KEY,
  31 |       "Requires Supabase (run npm run seed:e2e first)",
  32 |     );
  33 | 
  34 |     await login(page, studentEmail);
  35 |     await expect(page).toHaveURL(/\/student/);
  36 | 
  37 |     await page.getByRole("link", { name: /E2E English Course|exams|exámenes/i }).first().click();
  38 |     await page.getByRole("link", { name: /ver exámenes|view exams/i }).click();
  39 |     await expect(page.getByRole("heading", { name: /exams|exámenes/i })).toBeVisible();
  40 |     await expect(page.getByText(/E2E Smoke Exam/i)).toBeVisible();
  41 |   });
  42 | 
  43 |   test("student can start exam and submit", async ({ page }) => {
  44 |     test.skip(
  45 |       !process.env.SUPABASE_SERVICE_ROLE_KEY,
  46 |       "Requires Supabase (run npm run seed:e2e first)",
  47 |     );
  48 | 
  49 |     await login(page, studentEmail);
  50 |     await page.goto("/student");
  51 | 
  52 |     const courseLink = page.getByRole("link", { name: /E2E English Course/i });
  53 |     await courseLink.click();
  54 |     await page.getByRole("link", { name: /ver exámenes|view exams/i }).click();
  55 | 
  56 |     const startButton = page.getByRole("button", { name: /start exam|iniciar/i });
  57 |     if (await startButton.isVisible()) {
  58 |       await startButton.click();
  59 |     } else {
  60 |       await page.getByRole("link", { name: /continue|continuar/i }).click();
  61 |     }
  62 | 
  63 |     await expect(page.getByText(/2 \+ 2|What is 2/i)).toBeVisible();
  64 |     await page.getByLabel("4").check();
  65 |     await page.getByRole("button", { name: /save answer|guardar/i }).click();
  66 |     await page.getByRole("button", { name: /submit exam|entregar/i }).click();
  67 | 
  68 |     await expect(page).toHaveURL(/\/result/);
  69 |     await expect(page.getByText(/E2E Smoke Exam/i)).toBeVisible();
  70 |   });
  71 | 
  72 |   test("teacher can open grades after student submit", async ({ page }) => {
  73 |     test.skip(
  74 |       !process.env.SUPABASE_SERVICE_ROLE_KEY,
  75 |       "Requires Supabase (run npm run seed:e2e first)",
  76 |     );
  77 | 
  78 |     await login(page, teacherEmail);
  79 |     await expect(page).toHaveURL(/\/teacher/);
  80 | 
  81 |     await page.getByRole("link", { name: /E2E English Course/i }).click();
  82 |     await page.getByRole("link", { name: /grades|calificaciones|notes/i }).click();
  83 |     await expect(page.getByText(/E2E Smoke Exam/i)).toBeVisible();
  84 |   });
  85 | });
  86 | 
```