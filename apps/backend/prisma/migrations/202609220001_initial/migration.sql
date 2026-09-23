CREATE TABLE "Lesson" ("id" TEXT PRIMARY KEY, "word" TEXT NOT NULL, "language" TEXT NOT NULL);
CREATE TABLE "LessonStep" (
  "id" TEXT PRIMARY KEY, "lessonId" TEXT NOT NULL REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "position" INTEGER NOT NULL CHECK ("position" >= 0),
  "kind" TEXT NOT NULL CHECK ("kind" IN ('sound','combination','word')),
  "highlightedLetters" INTEGER[] NOT NULL,
  "instruction" TEXT NOT NULL, "referenceAudioUrl" TEXT
);
CREATE UNIQUE INDEX "LessonStep_lessonId_position_key" ON "LessonStep"("lessonId", "position");
