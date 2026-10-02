CREATE DATABASE IF NOT EXISTS complexity_universe
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE complexity_universe;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activity_log;
DROP TABLE IF EXISTS user_saved_topics;
DROP TABLE IF EXISTS topic_examples;
DROP TABLE IF EXISTS complexity_topics;
DROP TABLE IF EXISTS code_analyses;
DROP TABLE IF EXISTS analysis_prompts;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS app_settings;
DROP VIEW IF EXISTS v_user_overview;
DROP VIEW IF EXISTS v_analysis_feed;
DROP VIEW IF EXISTS v_topic_overview;
DROP VIEW IF EXISTS v_user_saved_topics;
DROP VIEW IF EXISTS v_complexity_distribution;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id              INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name            VARCHAR(80)      NOT NULL,
  email           VARCHAR(190)     NOT NULL,
  password_hash   VARCHAR(255)     NOT NULL,
  role            ENUM('user','admin') NOT NULL DEFAULT 'user',
  analysis_count  INT UNSIGNED     NOT NULL DEFAULT 0,
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

-- ALTER demo: the table evolves (new column + index) exactly like a live project
ALTER TABLE users
  ADD COLUMN last_login_at DATETIME NULL DEFAULT NULL AFTER password_hash,
  ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active' AFTER role,
  MODIFY COLUMN name VARCHAR(100) NOT NULL;

-- ---------------------------------------------------------------------
-- 2. user_profiles (1 : 1 with users, CASCADE delete)
-- ---------------------------------------------------------------------
CREATE TABLE user_profiles (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  headline     VARCHAR(140)  NOT NULL DEFAULT 'Curious about the cost of code',
  bio          VARCHAR(500)  NOT NULL DEFAULT '',
  location     VARCHAR(100)  NOT NULL DEFAULT '',
  avatar_seed  VARCHAR(60)   NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_profile_user (user_id),
  CONSTRAINT fk_profile_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. analysis_prompts — admin-editable AI prompt (versioned by trigger)
-- ---------------------------------------------------------------------
CREATE TABLE analysis_prompts (
  id              TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name            VARCHAR(80)      NOT NULL,
  prompt_template MEDIUMTEXT       NOT NULL,
  is_active       TINYINT(1)       NOT NULL DEFAULT 1,
  version         INT UNSIGNED     NOT NULL DEFAULT 1,
  updated_by      INT UNSIGNED     NULL,
  created_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_prompt_active (is_active),
  CONSTRAINT fk_prompt_admin
    FOREIGN KEY (updated_by) REFERENCES users (id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. code_analyses — every saved analysis record
-- ---------------------------------------------------------------------
CREATE TABLE code_analyses (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id           INT UNSIGNED    NOT NULL,
  title             VARCHAR(140)    NOT NULL DEFAULT 'Untitled analysis',
  language          VARCHAR(30)     NOT NULL DEFAULT 'javascript',
  code_text         MEDIUMTEXT      NOT NULL,
  code_lines        INT UNSIGNED    GENERATED ALWAYS AS
                      (CHAR_LENGTH(code_text) - CHAR_LENGTH(REPLACE(code_text, '\n', '')) + 1) STORED,
  time_complexity   VARCHAR(40)     NOT NULL,
  space_complexity  VARCHAR(40)     NOT NULL,
  summary           TEXT            NOT NULL,
  detailed_analysis MEDIUMTEXT      NOT NULL,
  detail_mode       ENUM('short','detailed') NOT NULL DEFAULT 'detailed',
  engine            VARCHAR(20)     NOT NULL DEFAULT 'gemini',
  prompt_version    INT UNSIGNED    NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_analyses_user_created (user_id, created_at),
  KEY idx_analyses_complexity (time_complexity),
  CONSTRAINT fk_analyses_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- prompt_version is a soft reference (audit trail): the prompt version is bumped
-- in place by trigger, so a formal FK is kept out on purpose. Indexed instead.
ALTER TABLE code_analyses
  ADD KEY idx_analyses_prompt_version (prompt_version);

-- ---------------------------------------------------------------------
-- 5. complexity_topics — Learn page content (admin managed)
-- ---------------------------------------------------------------------
CREATE TABLE complexity_topics (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  topic_name       VARCHAR(120)     NOT NULL,
  slug             VARCHAR(140)     NOT NULL,
  category         VARCHAR(60)      NOT NULL DEFAULT 'Fundamentals',
  difficulty       ENUM('Beginner','Intermediate','Advanced') NOT NULL DEFAULT 'Beginner',
  time_complexity  VARCHAR(40)      NULL DEFAULT NULL,
  space_complexity VARCHAR(40)      NULL DEFAULT NULL,
  summary          VARCHAR(255)     NOT NULL DEFAULT '',
  notes_html       MEDIUMTEXT       NOT NULL,
  sort_order       SMALLINT         NOT NULL DEFAULT 0,
  is_published     TINYINT(1)       NOT NULL DEFAULT 1,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_topics_slug (slug),
  KEY idx_topics_category (category),
  FULLTEXT KEY ft_topics_search (topic_name, summary, notes_html)
) ENGINE=InnoDB;

-- ALTER demo: widen summary after first release
ALTER TABLE complexity_topics
  MODIFY COLUMN summary VARCHAR(300) NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------
-- 6. topic_examples — runnable codes + their analysis (CASCADE on topic)
-- ---------------------------------------------------------------------
CREATE TABLE topic_examples (
  id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  topic_id         INT UNSIGNED     NOT NULL,
  title            VARCHAR(140)     NOT NULL,
  language         VARCHAR(30)      NOT NULL DEFAULT 'javascript',
  code_text        MEDIUMTEXT       NOT NULL,
  analysis_html    MEDIUMTEXT       NOT NULL,
  time_complexity  VARCHAR(40)      NULL DEFAULT NULL,
  space_complexity VARCHAR(40)      NULL DEFAULT NULL,
  sort_order       SMALLINT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_examples_topic (topic_id),
  CONSTRAINT fk_examples_topic
    FOREIGN KEY (topic_id) REFERENCES complexity_topics (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. user_saved_topics — bookmarks from the Learn page
-- ---------------------------------------------------------------------
CREATE TABLE user_saved_topics (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id   INT UNSIGNED    NOT NULL,
  topic_id  INT UNSIGNED    NOT NULL,
  note      VARCHAR(255)    NOT NULL DEFAULT '',
  saved_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_saved_user_topic (user_id, topic_id),
  KEY idx_saved_topic (topic_id),
  CONSTRAINT fk_saved_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_saved_topic
    FOREIGN KEY (topic_id) REFERENCES complexity_topics (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. activity_log — written by triggers
-- ---------------------------------------------------------------------
CREATE TABLE activity_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED    NULL,
  action     VARCHAR(40)     NOT NULL,
  entity     VARCHAR(40)     NOT NULL,
  entity_id  BIGINT UNSIGNED NULL,
  detail     VARCHAR(255)    NOT NULL DEFAULT '',
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_log_user_created (user_id, created_at),
  CONSTRAINT fk_log_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. app_settings — site settings editable from the admin console
--    (Gemini API key + model live here)
-- ---------------------------------------------------------------------
CREATE TABLE app_settings (
  setting_key   VARCHAR(60)  NOT NULL,
  setting_value TEXT         NOT NULL,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB;

-- =====================================================================
--  VIEWS
-- =====================================================================

-- Dashboard identity card + counters
CREATE OR REPLACE VIEW v_user_overview AS
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  u.status,
  u.analysis_count,
  u.created_at,
  u.last_login_at,
  p.headline,
  p.bio,
  p.location,
  p.avatar_seed,
  (SELECT COUNT(*) FROM user_saved_topics s WHERE s.user_id = u.id) AS saved_topic_count,
  CASE
    WHEN u.role = 'admin'          THEN 'Administrator'
    WHEN u.analysis_count >= 25    THEN 'Power analyst'
    WHEN u.analysis_count >= 10    THEN 'Regular analyst'
    WHEN u.analysis_count >= 1     THEN 'Getting started'
    ELSE 'Newcomer'
  END AS rank_label
FROM users u
LEFT JOIN user_profiles p ON p.user_id = u.id;

-- Public feed of saved analyses
CREATE OR REPLACE VIEW v_analysis_feed AS
SELECT
  a.id,
  a.user_id,
  u.name AS user_name,
  a.title,
  a.language,
  a.time_complexity,
  a.space_complexity,
  a.summary,
  a.code_lines,
  a.detail_mode,
  a.engine,
  a.created_at,
  CASE
    WHEN a.time_complexity IN ('O(1)', 'O(log n)')              THEN 'excellent'
    WHEN a.time_complexity IN ('O(n)', 'O(n log n)')            THEN 'good'
    WHEN a.time_complexity IN ('O(n^2)', 'O(n^3)', 'O(n^2 log n)') THEN 'heavy'
    ELSE 'severe'
  END AS cost_grade
FROM code_analyses a
JOIN users u ON u.id = a.user_id;

-- Learn page: topics + counters
CREATE OR REPLACE VIEW v_topic_overview AS
SELECT
  t.id,
  t.topic_name,
  t.slug,
  t.category,
  t.difficulty,
  t.time_complexity,
  t.space_complexity,
  t.summary,
  t.sort_order,
  t.is_published,
  t.updated_at,
  (SELECT COUNT(*) FROM topic_examples e WHERE e.topic_id = t.id)  AS example_count,
  (SELECT COUNT(*) FROM user_saved_topics s WHERE s.topic_id = t.id) AS saved_count
FROM complexity_topics t;

-- Saved-topic detail used by the dashboard
CREATE OR REPLACE VIEW v_user_saved_topics AS
SELECT
  s.id            AS bookmark_id,
  s.user_id,
  s.note,
  s.saved_at,
  t.id            AS topic_id,
  t.topic_name,
  t.slug,
  t.category,
  t.difficulty,
  t.time_complexity,
  t.space_complexity,
  t.summary
FROM user_saved_topics s
JOIN complexity_topics t ON t.id = s.topic_id;

-- Distribution of complexity classes (drives dashboard stats)
CREATE OR REPLACE VIEW v_complexity_distribution AS
SELECT
  time_complexity,
  COUNT(*) AS total,
  CASE
    WHEN time_complexity IN ('O(1)', 'O(log n)')   THEN 'fast'
    WHEN time_complexity IN ('O(n)', 'O(n log n)') THEN 'moderate'
    ELSE 'slow'
  END AS bucket
FROM code_analyses
GROUP BY time_complexity
ORDER BY total DESC;

-- =====================================================================
--  TRIGGERS
-- =====================================================================

-- Drop existing triggers for idempotent re-runs
DROP TRIGGER IF EXISTS trg_users_before_insert;
DROP TRIGGER IF EXISTS trg_users_after_insert;
DROP TRIGGER IF EXISTS trg_users_before_update;
DROP TRIGGER IF EXISTS trg_analyses_after_insert;
DROP TRIGGER IF EXISTS trg_analyses_after_delete;
DROP TRIGGER IF EXISTS trg_topics_before_insert;
DROP TRIGGER IF EXISTS trg_topics_before_update;
DROP TRIGGER IF EXISTS trg_saved_after_insert;
DROP TRIGGER IF EXISTS trg_saved_after_delete;
DROP TRIGGER IF EXISTS trg_prompt_before_update;

DELIMITER $$

-- Normalise email before every insert
CREATE TRIGGER trg_users_before_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  SET NEW.email = LOWER(TRIM(NEW.email));
  SET NEW.name  = TRIM(NEW.name);
END$$

-- Every new user gets a profile row + a log entry
CREATE TRIGGER trg_users_after_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO user_profiles (user_id, avatar_seed)
  VALUES (NEW.id, SUBSTRING(MD5(NEW.email), 1, 12));
  INSERT INTO activity_log (user_id, action, entity, entity_id, detail)
  VALUES (NEW.id, 'register', 'users', NEW.id, NEW.email);
END$$

CREATE TRIGGER trg_users_before_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  SET NEW.email = LOWER(TRIM(NEW.email));
  SET NEW.name  = TRIM(NEW.name);
END$$

-- Keep users.analysis_count in sync, log the analysis
CREATE TRIGGER trg_analyses_after_insert
AFTER INSERT ON code_analyses
FOR EACH ROW
BEGIN
  UPDATE users
     SET analysis_count = analysis_count + 1
   WHERE id = NEW.user_id;
  INSERT INTO activity_log (user_id, action, entity, entity_id, detail)
  VALUES (NEW.user_id, 'analysis_saved', 'code_analyses', NEW.id, NEW.time_complexity);
END$$

CREATE TRIGGER trg_analyses_after_delete
AFTER DELETE ON code_analyses
FOR EACH ROW
BEGIN
  UPDATE users
     SET analysis_count = CASE
                            WHEN analysis_count > 0 THEN analysis_count - 1
                            ELSE 0
                          END
   WHERE id = OLD.user_id;
  INSERT INTO activity_log (user_id, action, entity, entity_id, detail)
  VALUES (OLD.user_id, 'analysis_deleted', 'code_analyses', OLD.id, OLD.title);
END$$

-- Slug normalisation + timestamp on topic edits
CREATE TRIGGER trg_topics_before_insert
BEFORE INSERT ON complexity_topics
FOR EACH ROW
BEGIN
  SET NEW.slug = LOWER(REPLACE(REPLACE(TRIM(NEW.topic_name), ' ', '-'), '/', '-'));
  SET NEW.topic_name = TRIM(NEW.topic_name);
END$$

CREATE TRIGGER trg_topics_before_update
BEFORE UPDATE ON complexity_topics
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
  IF NEW.slug IS NULL OR TRIM(NEW.slug) = '' THEN
    SET NEW.slug = LOWER(REPLACE(REPLACE(TRIM(NEW.topic_name), ' ', '-'), '/', '-'));
  END IF;
END$$

-- Bookmarks logged
CREATE TRIGGER trg_saved_after_insert
AFTER INSERT ON user_saved_topics
FOR EACH ROW
BEGIN
  INSERT INTO activity_log (user_id, action, entity, entity_id, detail)
  VALUES (NEW.user_id, 'topic_saved', 'complexity_topics', NEW.topic_id, '');
END$$

CREATE TRIGGER trg_saved_after_delete
AFTER DELETE ON user_saved_topics
FOR EACH ROW
BEGIN
  INSERT INTO activity_log (user_id, action, entity, entity_id, detail)
  VALUES (OLD.user_id, 'topic_unsaved', 'complexity_topics', OLD.topic_id, '');
END$$

-- Prompt edits bump the version automatically (audit trail for "who changed the AI")
CREATE TRIGGER trg_prompt_before_update
BEFORE UPDATE ON analysis_prompts
FOR EACH ROW
BEGIN
  SET NEW.version    = OLD.version + 1;
  SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;
