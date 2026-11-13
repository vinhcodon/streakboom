-- The only table of the counter (ADR-0092): one row per day, sticker and language, with a number. Nothing about a visitor.
CREATE TABLE IF NOT EXISTS uses (
  day  TEXT NOT NULL,
  slug TEXT NOT NULL,
  lang TEXT NOT NULL,
  n    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, slug, lang)
);
