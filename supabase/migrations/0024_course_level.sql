-- Optional CEFR level for course catalog filtering
CREATE TYPE course_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

ALTER TABLE courses ADD COLUMN level course_level;
