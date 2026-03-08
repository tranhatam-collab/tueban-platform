DELETE FROM audit_logs;
DELETE FROM ledger_verifications;
DELETE FROM ledger_events;
DELETE FROM quiz_attempt_answers;
DELETE FROM quiz_attempts;
DELETE FROM quiz_options;
DELETE FROM quiz_questions;
DELETE FROM quizzes;
DELETE FROM practice_submissions;
DELETE FROM practice_tasks;
DELETE FROM notes;
DELETE FROM user_learning_sessions;
DELETE FROM user_file_access;
DELETE FROM user_lesson_progress;
DELETE FROM user_topic_progress;
DELETE FROM user_course_progress;
DELETE FROM lesson_unlock_rules;
DELETE FROM enrollments;
DELETE FROM lesson_assets;
DELETE FROM media_assets;
DELETE FROM lessons;
DELETE FROM course_topics;
DELETE FROM course_modules;
DELETE FROM courses;
DELETE FROM sessions;
DELETE FROM user_roles;
DELETE FROM users;
DELETE FROM roles;
DELETE FROM events;

INSERT INTO roles (id, code, name, description, created_at) VALUES
('role_owner', 'owner', 'Owner', 'Chủ hệ thống', 1741478400),
('role_admin', 'admin', 'Admin', 'Quản trị viên', 1741478400),
('role_member', 'paid_member', 'Paid Member', 'Học viên trả phí', 1741478400);

INSERT INTO users (id, email, password_hash, full_name, status, created_at, updated_at) VALUES
('user_admin_001', 'admin@tueban.local', 'not-used-yet', 'Tueban Admin', 'active', 1741478400, 1741478400),
('user_member_001', 'member@tueban.local', 'not-used-yet', 'Hoc Vien Mau', 'active', 1741478400, 1741478400);

INSERT INTO user_roles (id, user_id, role_id, assigned_at, assigned_by) VALUES
('ur_001', 'user_admin_001', 'role_owner', 1741478400, 'system'),
('ur_002', 'user_member_001', 'role_member', 1741478400, 'user_admin_001');

INSERT INTO courses (
  id,
  slug,
  title,
  short_description,
  long_description,
  level,
  visibility,
  status,
  cover_image_asset_id,
  created_by,
  created_at,
  updated_at
) VALUES (
  'course_001',
  'nhap-mon-tri-tue-van-hanh',
  'Nhập Môn Trí Tuệ Vận Hành',
  'Khóa học mẫu đầu tiên của Tueban',
  'Đây là khóa học mẫu để test toàn bộ luồng học tập, lesson, outline và progress.',
  'basic',
  'members',
  'published',
  NULL,
  'user_admin_001',
  1741478400,
  1741478400
);

INSERT INTO course_modules (
  id,
  course_id,
  title,
  description,
  position,
  created_at,
  updated_at
) VALUES
('module_001', 'course_001', 'Phần 1: Nền Tảng', 'Module nền tảng đầu tiên', 1, 1741478400, 1741478400),
('module_002', 'course_001', 'Phần 2: Quan Sát', 'Module quan sát và thực hành', 2, 1741478400, 1741478400);

INSERT INTO course_topics (
  id,
  module_id,
  slug,
  title,
  description,
  position,
  requires_approval,
  created_at,
  updated_at
) VALUES
('topic_001', 'module_001', 'ban-chat-cua-hoc-tap', 'Bản Chất Của Học Tập', 'Topic đầu tiên của khóa học mẫu', 1, 0, 1741478400, 1741478400),
('topic_002', 'module_001', 'quan-sat-chinh-minh', 'Quan Sát Chính Mình', 'Topic thứ hai của khóa học mẫu', 2, 0, 1741478400, 1741478400),
('topic_003', 'module_002', 'thuc-hanh-hang-ngay', 'Thực Hành Hằng Ngày', 'Topic thực hành của khóa học mẫu', 1, 0, 1741478400, 1741478400);

INSERT INTO lessons (
  id,
  topic_id,
  slug,
  title,
  lesson_type,
  content_md,
  estimated_minutes,
  completion_mode,
  is_preview,
  position,
  status,
  created_at,
  updated_at
) VALUES
(
  'lesson_001',
  'topic_001',
  'bai-1-mo-dau',
  'Bài 1: Mở Đầu',
  'text',
  '# Bài 1: Mở Đầu

Đây là bài học mẫu đầu tiên của hệ thống Tueban.

Mục tiêu là kiểm tra route lesson detail, outline khóa học và progress học viên.',
  10,
  'text_only',
  1,
  1,
  'published',
  1741478400,
  1741478400
),
(
  'lesson_002',
  'topic_001',
  'bai-2-nhan-dien-ban-than',
  'Bài 2: Nhận Diện Bản Thân',
  'text',
  '# Bài 2: Nhận Diện Bản Thân

Bài học mẫu thứ hai để test trình tự lesson trong outline.',
  12,
  'reflection_required',
  0,
  2,
  'published',
  1741478400,
  1741478400
),
(
  'lesson_003',
  'topic_002',
  'bai-3-quan-sat-noi-tam',
  'Bài 3: Quan Sát Nội Tâm',
  'text',
  '# Bài 3: Quan Sát Nội Tâm

Bài học mẫu thứ ba để test chuyển topic.',
  15,
  'text_only',
  0,
  1,
  'published',
  1741478400,
  1741478400
),
(
  'lesson_004',
  'topic_003',
  'bai-4-thuc-hanh-moi-ngay',
  'Bài 4: Thực Hành Mỗi Ngày',
  'text',
  '# Bài 4: Thực Hành Mỗi Ngày

Bài học mẫu thứ tư để gắn practice và quiz.',
  20,
  'practice_required',
  0,
  1,
  'published',
  1741478400,
  1741478400
);

INSERT INTO media_assets (
  id,
  asset_type,
  title,
  storage_path,
  mime_type,
  visibility,
  size_bytes,
  owner_user_id,
  created_at
) VALUES
('asset_001', 'pdf', 'Workbook Mẫu', 'samples/workbook-001.pdf', 'application/pdf', 'protected', 102400, 'user_admin_001', 1741478400),
('asset_002', 'audio', 'Audio Mẫu', 'samples/audio-001.mp3', 'audio/mpeg', 'protected', 204800, 'user_admin_001', 1741478400);

INSERT INTO lesson_assets (
  id,
  lesson_id,
  asset_id,
  purpose,
  position,
  is_required,
  downloadable,
  created_at
) VALUES
('la_001', 'lesson_001', 'asset_001', 'workbook', 1, 1, 1, 1741478400),
('la_002', 'lesson_004', 'asset_002', 'audio_support', 1, 0, 1, 1741478400);

INSERT INTO enrollments (
  id,
  user_id,
  course_id,
  enrollment_type,
  status,
  enrolled_at,
  expires_at
) VALUES
('enroll_001', 'user_member_001', 'course_001', 'manual', 'active', 1741478400, NULL);

INSERT INTO lesson_unlock_rules (
  id,
  lesson_id,
  requires_previous_lesson_complete,
  requires_required_assets_opened,
  requires_practice_submitted,
  requires_quiz_passed,
  requires_instructor_approval,
  created_at,
  updated_at
) VALUES
('lur_001', 'lesson_001', 0, 0, 0, 0, 0, 1741478400, 1741478400),
('lur_002', 'lesson_002', 1, 1, 0, 0, 0, 1741478400, 1741478400),
('lur_003', 'lesson_003', 1, 0, 0, 0, 0, 1741478400, 1741478400),
('lur_004', 'lesson_004', 1, 0, 1, 0, 0, 1741478400, 1741478400);

INSERT INTO user_course_progress (
  id,
  user_id,
  course_id,
  status,
  progress_percent,
  started_at,
  completed_at,
  updated_at
) VALUES
('ucp_001', 'user_member_001', 'course_001', 'in_progress', 35, 1741478400, NULL, 1741478400);

INSERT INTO user_topic_progress (
  id,
  user_id,
  topic_id,
  status,
  started_at,
  completed_at,
  approved_at,
  approved_by,
  updated_at
) VALUES
('utp_001', 'user_member_001', 'topic_001', 'completed', 1741478400, 1741479000, NULL, NULL, 1741479000),
('utp_002', 'user_member_001', 'topic_002', 'in_progress', 1741479600, NULL, NULL, NULL, 1741479600),
('utp_003', 'user_member_001', 'topic_003', 'locked', NULL, NULL, NULL, NULL, 1741479600);

INSERT INTO user_lesson_progress (
  id,
  user_id,
  lesson_id,
  status,
  active_learning_seconds,
  video_watch_seconds,
  reading_estimate_seconds,
  opened_at,
  completed_at,
  updated_at
) VALUES
('ulp_001', 'user_member_001', 'lesson_001', 'completed', 480, 0, 420, 1741478400, 1741478880, 1741478880),
('ulp_002', 'user_member_001', 'lesson_002', 'completed', 600, 0, 500, 1741478880, 1741479300, 1741479300),
('ulp_003', 'user_member_001', 'lesson_003', 'in_progress', 300, 0, 240, 1741479600, NULL, 1741479900),
('ulp_004', 'user_member_001', 'lesson_004', 'locked', 0, 0, 0, NULL, NULL, 1741479900);

INSERT INTO user_file_access (
  id,
  user_id,
  asset_id,
  access_type,
  accessed_at
) VALUES
('ufa_001', 'user_member_001', 'asset_001', 'open', 1741478700);

INSERT INTO user_learning_sessions (
  id,
  user_id,
  lesson_id,
  started_at,
  ended_at,
  active_seconds,
  source
) VALUES
('uls_001', 'user_member_001', 'lesson_001', 1741478400, 1741478880, 480, 'web'),
('uls_002', 'user_member_001', 'lesson_003', 1741479600, 1741479900, 300, 'web');

INSERT INTO notes (
  id,
  user_id,
  lesson_id,
  content_md,
  created_at,
  updated_at
) VALUES
('note_001', 'user_member_001', 'lesson_001', 'Ghi chú mẫu cho bài 1', 1741478500, 1741478500),
('note_002', 'user_member_001', 'lesson_003', 'Ghi chú mẫu cho bài 3', 1741479700, 1741479700);

INSERT INTO practice_tasks (
  id,
  topic_id,
  title,
  instructions_md,
  required,
  created_at,
  updated_at
) VALUES
('pt_001', 'topic_003', 'Bài Thực Hành 7 Ngày', 'Viết lại những gì bạn quan sát được trong 7 ngày liên tục.', 1, 1741478400, 1741478400);

INSERT INTO practice_submissions (
  id,
  task_id,
  user_id,
  submission_text_md,
  submission_asset_id,
  status,
  submitted_at,
  reviewed_at,
  reviewed_by,
  feedback_md
) VALUES
('ps_001', 'pt_001', 'user_member_001', 'Đây là bài nộp mẫu của học viên.', NULL, 'submitted', 1741480200, NULL, NULL, NULL);

INSERT INTO quizzes (
  id,
  topic_id,
  title,
  min_pass_score,
  created_at,
  updated_at
) VALUES
('quiz_001', 'topic_002', 'Kiểm Tra Topic 2', 70, 1741478400, 1741478400);

INSERT INTO quiz_questions (
  id,
  quiz_id,
  question_text,
  position,
  question_type,
  created_at
) VALUES
('qq_001', 'quiz_001', 'Mục tiêu của việc quan sát bản thân là gì?', 1, 'single_choice', 1741478400),
('qq_002', 'quiz_001', 'Điều gì quan trọng nhất trong việc học tập có chứng cứ?', 2, 'single_choice', 1741478400);

INSERT INTO quiz_options (
  id,
  question_id,
  option_text,
  position,
  is_correct
) VALUES
('qo_001', 'qq_001', 'Để phán xét bản thân', 1, 0),
('qo_002', 'qq_001', 'Để nhìn rõ trạng thái thật', 2, 1),
('qo_003', 'qq_001', 'Để hơn người khác', 3, 0),
('qo_004', 'qq_002', 'Tiến độ phải có lịch sử', 1, 1),
('qo_005', 'qq_002', 'Chỉ cần xem video là đủ', 2, 0),
('qo_006', 'qq_002', 'Không cần thực hành', 3, 0);

INSERT INTO quiz_attempts (
  id,
  quiz_id,
  user_id,
  score,
  passed,
  started_at,
  submitted_at
) VALUES
('qa_001', 'quiz_001', 'user_member_001', 100, 1, 1741480500, 1741480600);

INSERT INTO quiz_attempt_answers (
  id,
  attempt_id,
  question_id,
  selected_option_id,
  answer_text,
  is_correct
) VALUES
('qaa_001', 'qa_001', 'qq_001', 'qo_002', NULL, 1),
('qaa_002', 'qa_001', 'qq_002', 'qo_004', NULL, 1);

INSERT INTO events (
  id,
  slug,
  title,
  event_type,
  description_md,
  starts_at,
  ends_at,
  location_text,
  status,
  created_at,
  updated_at
) VALUES
('event_001', 'live-hoi-dap-thang-3', 'Live Hỏi Đáp Tháng 3', 'live', 'Buổi live mẫu để test events.', 1742000000, 1742003600, 'Online', 'published', 1741478400, 1741478400);

INSERT INTO ledger_events (
  id,
  event_type,
  actor_user_id,
  target_type,
  target_id,
  payload_json,
  previous_hash,
  current_hash,
  created_at
) VALUES
('le_001', 'lesson_open', 'user_member_001', 'lesson', 'lesson_001', '{"lesson_slug":"bai-1-mo-dau"}', NULL, 'hash_001', 1741478400),
('le_002', 'lesson_complete', 'user_member_001', 'lesson', 'lesson_001', '{"status":"completed"}', 'hash_001', 'hash_002', 1741478880),
('le_003', 'topic_complete', 'user_member_001', 'topic', 'topic_001', '{"status":"completed"}', 'hash_002', 'hash_003', 1741479000);

INSERT INTO ledger_verifications (
  id,
  verification_type,
  status,
  details_json,
  verified_at
) VALUES
('lv_001', 'daily_chain_check', 'ok', '{"checked_events":3}', 1741481000);

INSERT INTO audit_logs (
  id,
  actor_user_id,
  action_type,
  target_type,
  target_id,
  details_json,
  created_at
) VALUES
('al_001', 'user_admin_001', 'course_create', 'course', 'course_001', '{"slug":"nhap-mon-tri-tue-van-hanh"}', 1741478400),
('al_002', 'user_admin_001', 'lesson_publish', 'lesson', 'lesson_001', '{"status":"published"}', 1741478400);