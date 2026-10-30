import type { CourseLevel } from "@/lib/courses/levels";

export type LandingCourseKey = "c1" | "c2" | "c3" | "c4";

export type LandingCourse = {
  id: string;
  courseKey: LandingCourseKey;
  image: string;
  languageCode: string;
  level: CourseLevel | null;
  studentCount: number;
  teacherCount: number;
  materialCount: number;
};

export const landingCourses: LandingCourse[] = [
  {
    id: "1",
    courseKey: "c1",
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600&h=400&fit=crop",
    languageCode: "en",
    level: "A1",
    studentCount: 24,
    teacherCount: 2,
    materialCount: 12,
  },
  {
    id: "2",
    courseKey: "c2",
    image:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=400&fit=crop",
    languageCode: "fr",
    level: "B1",
    studentCount: 18,
    teacherCount: 1,
    materialCount: 10,
  },
  {
    id: "3",
    courseKey: "c3",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop",
    languageCode: "en",
    level: "C1",
    studentCount: 12,
    teacherCount: 2,
    materialCount: 16,
  },
  {
    id: "4",
    courseKey: "c4",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=400&fit=crop",
    languageCode: "en",
    level: "B2",
    studentCount: 20,
    teacherCount: 2,
    materialCount: 14,
  },
];

export const heroImage =
  "/landing/main-image/504775241_1550009162915343_7119841909684576180_n.jpg";

/** Four student photos + i18n review keys for the stories carousel */
export const studentStoryItems = [
  {
    image:
      "/landing/student-reviews/481295476_9330653026994835_7805813447370412857_n.jpg",
    reviewKey: "s1",
  },
  {
    image:
      "/landing/student-reviews/481905208_9330653016994836_8758995898916017414_n.jpg",
    reviewKey: "s2",
  },
  {
    image:
      "/landing/student-reviews/482087947_9330653006994837_4344951905551685746_n.jpg",
    reviewKey: "s3",
  },
  {
    image:
      "/landing/student-reviews/482214514_9330652990328172_4248209363633139939_n.jpg",
    reviewKey: "s4",
  },
] as const;

export type StudentReviewKey = (typeof studentStoryItems)[number]["reviewKey"];

/** @deprecated Use studentStoryItems */
export const studentReviewImages = studentStoryItems.map((item) => item.image);

/** @deprecated Use studentStoryItems */
export const studentStories = studentStoryItems.map((item, index) => ({
  id: String(index + 1),
  image: item.image,
}));

export const testimonialImage =
  "/landing/89460889_2849953375064865_9169974125802815488_n.jpg";
