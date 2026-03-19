# Tueban Master Build Spec

## 1. Mục đích của file này

Đây là file chỉ đạo tổng thể cao nhất cho toàn bộ nền tảng Tueban.com.

File này là nguồn sự thật duy nhất để giao việc cho:
- dev
- AI code assistant
- product owner
- designer
- operator
- content builder
- admin hệ thống

Mọi phần của hệ thống phải bám theo file này để tránh:
- làm lệch hướng
- thiếu module
- thiếu liên kết giữa frontend và backend
- vá nhiều lần
- tạo giao diện đẹp nhưng hệ thống rỗng
- tạo backend mạnh nhưng frontend yếu
- tạo admin nhưng thiếu logic học thật

Tueban phải được xây như một Learning Operating System hoàn chỉnh, không phải chỉ là web bán khóa học.

---

## 2. Định nghĩa sản phẩm

Tueban.com là một nền tảng học tập và vận hành tri thức có đầy đủ:
- web public
- khu học viên
- khu lesson
- progress tracking
- sequential learning
- practice
- quiz
- complete lesson
- course outline
- asset library
- progress history
- ledger history
- admin CMS
- mobile-first app-like experience
- khả năng mở rộng dài hạn

Tueban không chỉ là nơi đặt video hay PDF.

Tueban là:
- hệ điều hành học tập
- hệ điều hành tiến trình
- hệ điều hành nội dung
- hệ điều hành kiểm chứng việc học
- hệ điều hành quản trị khóa học và dữ liệu học viên

---

## 3. Mục tiêu tổng thể của hệ thống

### 3.1 Mục tiêu ngắn hạn
- Có web public sạch, sang, rõ
- Có frontend học viên chạy thật
- Có API thật
- Có database thật
- Có seed data thật
- Có thể xem course, lesson, progress
- Có thể complete lesson
- Có mobile menu như app tạm thời
- Có admin nền tảng để tạo course, module, topic, lesson

### 3.2 Mục tiêu trung hạn
- Có CMS hoàn chỉnh
- Có upload media
- Có signed asset access
- Có role và auth
- Có learning rules
- Có progress engine
- Có quiz engine
- Có practice engine
- Có audit logs
- Có ledger event logs

### 3.3 Mục tiêu dài hạn
- Tueban trở thành learning operating system hoàn chỉnh
- Có thể tạo hàng trăm khóa học
- Có thể scale user và content lâu dài
- Có admin mạnh, nhưng UX nhẹ
- Có mobile-like experience tốt trên web
- Có khả năng làm app thật sau này
- Có thể tích hợp commerce, membership, live class, certificates, recommendation engine, AI learning assistant

---

## 4. Kiến trúc công nghệ bắt buộc

### 4.1 Frontend
- Cloudflare Pages
- HTML, CSS, JS thuần hoặc nâng cấp dần nếu cần
- mobile-first
- PWA-friendly
- không phụ thuộc framework nặng ở giai đoạn đầu nếu chưa thật cần

### 4.2 Backend
- Cloudflare Workers
- route-based API
- auth, progress, lesson complete, course queries, admin actions

### 4.3 Database
- Cloudflare D1
- schema chuẩn hóa
- migration rõ ràng
- seed data rõ ràng

### 4.4 Media
- Cloudflare R2
- PDF
- audio
- image
- video file giai đoạn đầu
- signed URL cho protected asset nếu cần

### 4.5 Queue
- Cloudflare Queues
- ledger event handling
- background jobs
- notification/event expansion sau này

### 4.6 Source of truth
- GitHub repo
- versioned docs
- versioned migrations
- versioned seeds
- versioned frontend and backend

---

## 5. Các vùng chính của hệ thống

Tueban phải có đủ các vùng sau.

### 5.1 Public website
- Trang chủ
- Danh sách khóa học
- Trang chi tiết khóa học public nếu cần
- Trang bài viết / thư viện / triết lý sau này
- Giới thiệu nền tảng
- Điều hướng rõ
- UI sang, tối giản, system-level

### 5.2 Student learning area
- Course list
- Course detail
- Course outline
- Lesson detail
- Asset list
- Complete lesson
- Progress panel
- Khu học viên sau này
- Ghi chú, tài liệu, lịch sử học, dashboard sau này

### 5.3 Admin CMS
- Admin dashboard
- Course management
- Module management
- Topic management
- Lesson management
- Asset management
- Progress viewer
- User viewer
- Ledger viewer
- Audit viewer
- Form tạo/sửa/xóa nội dung
- Trạng thái publish / draft / archived

### 5.4 Data and logic engine
- progress engine
- lesson complete engine
- course outline engine
- role engine
- practice engine
- quiz engine
- ledger engine
- audit engine

### 5.5 Operations
- deployment
- migration
- seed
- logs
- rollback
- build verification
- Pages + Worker integration

---

## 6. Các module chức năng bắt buộc

### 6.1 Public homepage
Trang chủ phải:
- truyền đúng tầm nhìn Tueban
- không còn là landing page thô
- có hero mạnh
- có menu đẹp
- có mobile drawer
- có lối vào course list, course mẫu, lesson mẫu
- có khối giải thích hệ thống đang chạy thật
- có khối “bắt đầu từ đâu”
- có footer / quick links / system status
- đồng bộ desktop và mobile

### 6.2 Public course list
- đọc từ `/api/courses`
- hiển thị card khóa học
- có CTA vào course detail
- fallback tốt khi không có dữ liệu
- có panel debug ở giai đoạn dev

### 6.3 Public course detail
- đọc từ `/api/course/:slug`
- đọc outline từ `/api/courses/:slug/outline`
- hiển thị title
- description
- meta
- modules
- topics
- lessons
- điều hướng sang lesson

### 6.4 Public lesson detail
- đọc từ `/api/lessons/:slug`
- hiển thị lesson content
- hiển thị asset
- có complete lesson button
- có progress panel mẫu
- hiển thị API output ở giai đoạn dev

### 6.5 Complete lesson flow
- gọi `POST /api/lesson/complete`
- truyền `user_id` và `lesson_slug`
- backend cập nhật progress tables
- backend ghi ledger event
- backend ghi audit log
- frontend refresh progress panel

### 6.6 Progress system
- course progress
- topic progress
- lesson progress
- hiển thị qua `/api/progress`
- đủ dữ liệu để build dashboard sau này

### 6.7 Quiz system
- quiz
- question
- option
- attempt
- answer
- scoring
- pass/fail
- tích hợp với unlock rules sau này

### 6.8 Practice system
- practice task
- submission
- review state
- feedback
- liên kết topic/lesson

### 6.9 Asset system
- media_assets
- lesson_assets
- purpose
- downloadable
- required
- visibility

### 6.10 Ledger system
- lesson events
- progress events
- admin content actions
- verification records
- append-only logic

### 6.11 Audit system
- actor
- action type
- target type
- target id
- details
- created_at

### 6.12 Admin CMS
Admin phải có thể:
- xem course list
- tạo course
- sửa course
- tạo module
- sửa module
- tạo topic
- sửa topic
- tạo lesson
- sửa lesson
- quản lý asset
- xem progress
- xem users
- xem ledger
- xem audit

---

## 7. Giao diện tổng thể bắt buộc

### 7.1 Tinh thần giao diện
- tối giản nhưng sang
- system-grade
- không màu mè rẻ tiền
- desktop rộng, rõ
- mobile như app tạm thời
- khoảng trắng đủ
- card rõ
- typography chắc
- button rõ
- state loading rõ
- route chuyển rõ

### 7.2 Desktop
- sticky header
- hero lớn
- section rõ
- card grid
- two-column cho lesson/course khi hợp lý
- debug panel tách riêng giai đoạn dev

### 7.3 Mobile
- app bar
- nút menu tròn
- drawer menu
- card full width
- bấm dễ
- spacing chuẩn
- CTA rõ
- không bị chật
- không bị desktop thu nhỏ

### 7.4 Menu
Menu phải:
- đẹp
- sticky
- có desktop nav
- có mobile drawer
- đóng/mở mượt
- không lòe loẹt
- đồng bộ brand Tueban

### 7.5 Trạng thái giao diện
Phải có trạng thái:
- loading
- empty
- success
- error
- disabled
- not found

---

## 8. Route frontend bắt buộc

### 8.1 Public
- `/`
- `/courses.html`
- `/course.html?slug=...`
- `/lesson.html?slug=...`

### 8.2 Admin
- `/admin.html`
- `/admin-courses.html` nếu tách
- `/admin-lessons.html` nếu tách
- hoặc admin single page có tab

### 8.3 Tương lai
- `/dashboard.html`
- `/progress.html`
- `/library.html`
- `/profile.html`

---

## 9. Route backend bắt buộc

### 9.1 Đã có
- `GET /api/health`
- `GET /api/db-test`
- `GET /api/queue-test`
- `GET /api/r2-test`
- `GET /api/courses`
- `GET /api/course/:slug`
- `GET /api/courses/:slug/outline`
- `GET /api/lessons/:slug`
- `GET /api/progress`
- `POST /api/lesson/complete`

### 9.2 Phải làm tiếp
- `GET /api/admin/courses`
- `POST /api/admin/courses`
- `PATCH /api/admin/courses/:id`
- `GET /api/admin/modules`
- `POST /api/admin/modules`
- `PATCH /api/admin/modules/:id`
- `GET /api/admin/topics`
- `POST /api/admin/topics`
- `PATCH /api/admin/topics/:id`
- `GET /api/admin/lessons`
- `POST /api/admin/lessons`
- `PATCH /api/admin/lessons/:id`
- `GET /api/admin/assets`
- `POST /api/admin/assets`
- `GET /api/admin/progress`
- `GET /api/admin/users`
- `GET /api/admin/audit`
- `GET /api/admin/ledger`

### 9.3 Nâng cao sau này
- auth endpoints
- session endpoints
- signed asset URLs
- quiz submit endpoint
- practice submit endpoint
- certificate endpoints
- event/live endpoints

---

## 10. Database bắt buộc phải duy trì và mở rộng

Hệ thống phải tiếp tục bám vào schema D1 đã tạo, bao gồm các bảng cốt lõi:

- roles
- users
- user_roles
- sessions
- courses
- course_modules
- course_topics
- lessons
- media_assets
- lesson_assets
- enrollments
- lesson_unlock_rules
- user_course_progress
- user_topic_progress
- user_lesson_progress
- user_file_access
- user_learning_sessions
- notes
- practice_tasks
- practice_submissions
- quizzes
- quiz_questions
- quiz_options
- quiz_attempts
- quiz_attempt_answers
- events
- ledger_events
- ledger_verifications
- audit_logs

Không được làm lệch khỏi schema này nếu chưa có migration mới chính thức.

---

## 11. Seed data bắt buộc phải giữ để test

Repo phải có seed mẫu để dev/test thật, tối thiểu gồm:
- 1 owner/admin
- 1 member
- 1 course mẫu
- 2 module
- 3 topic
- 4 lesson
- 2 asset
- 1 enrollment
- progress mẫu
- practice task
- quiz
- ledger event
- audit log

File seed chuẩn:
- `database/seeds/0001_sample_data.sql`

Nếu chỉnh sửa seed, phải chỉnh đồng bộ với schema hiện tại.

---

## 12. Yêu cầu cho admin CMS

### 12.1 Mục tiêu
Admin CMS phải đủ mạnh để từ giờ về sau:
- không cần seed SQL để tạo content mới
- tạo nội dung trực tiếp từ giao diện admin
- quản trị course và lesson trên web

### 12.2 Chức năng bắt buộc
- đăng nhập admin sau này
- dashboard tổng quan
- form tạo course
- form sửa course
- form tạo module
- form tạo topic
- form tạo lesson
- form gắn asset vào lesson
- xem progress học viên
- xem ledger event
- xem audit log

### 12.3 UX của admin
- rõ
- tối giản
- mạnh
- form dễ dùng
- bảng dữ liệu dễ đọc
- mobile không phải ưu tiên số 1 nhưng vẫn usable
- desktop là ưu tiên chính

### 12.4 Admin pages nên có
- `/admin.html`
- tab Courses
- tab Modules
- tab Topics
- tab Lessons
- tab Assets
- tab Users
- tab Progress
- tab Ledger
- tab Audit

---

## 13. Các lỗi không được lặp lại

### 13.1 Không dùng TextEdit cho code
Tất cả file code phải chỉnh bằng VS Code.
Không dùng TextEdit cho:
- html
- css
- js
- ts
- sql
- json
- md

### 13.2 Không để file bẩn
Không được để file chứa:
- `Apple-converted-space`
- `Cocoa HTML Writer`
- `&lt;html&gt;`
- conflict markers Git

### 13.3 Không vá nhỏ nếu file đã hỏng
Nếu file đã bị bẩn hoặc lệch nhiều:
- xóa toàn bộ
- dán lại nguyên file sạch

### 13.4 Không để frontend và backend lệch tên file
Frontend phải đồng bộ:
- `/assets/app.css`
- `/assets/app.js`

Không dùng lẫn:
- `site.css`
- `site.js`

---

## 14. Quy trình dev chuẩn từ giờ

### 14.1 Mỗi lần làm một cụm
Ví dụ:
- homepage
- course page
- lesson page
- admin
- auth
- assets

### 14.2 Mỗi cụm phải hoàn thiện dứt điểm
Mỗi cụm phải đi theo:
- spec
- file
- test
- commit
- push
- deploy
- verify

### 14.3 Không nhảy bước
Phải làm theo thứ tự:
1. tạo hoặc mở file
2. viết full file
3. kiểm tra file
4. git add
5. git commit
6. git pull --rebase nếu cần
7. git push
8. verify live

---

## 15. Checklist hoàn thiện Tueban web

### 15.1 Public web
- [ ] Trang chủ đạt chuẩn tổng thể
- [ ] Menu desktop đẹp
- [ ] Mobile drawer đẹp
- [ ] Hero đúng tầm nhìn
- [ ] CTA rõ
- [ ] Link nội bộ đúng
- [ ] courses page đẹp
- [ ] course page đẹp
- [ ] lesson page đẹp
- [ ] progress panel ổn

### 15.2 Backend
- [ ] tất cả route hiện có hoạt động
- [ ] lesson complete hoạt động thật
- [ ] progress update hoạt động thật
- [ ] ledger insert hoạt động thật
- [ ] audit insert hoạt động thật

### 15.3 Admin
- [ ] admin dashboard
- [ ] create course
- [ ] create module
- [ ] create topic
- [ ] create lesson
- [ ] asset management
- [ ] progress view
- [ ] audit view
- [ ] ledger view

### 15.4 Data
- [ ] schema ổn
- [ ] seed ổn
- [ ] migrations versioned
- [ ] no schema drift

### 15.5 Operations
- [ ] worker deploy ổn
- [ ] pages deploy ổn
- [ ] D1 execute ổn
- [ ] rebase/git workflow ổn

---

## 16. Các file quan trọng hiện tại trong repo

### 16.1 Frontend
- `apps/web/public/index.html`
- `apps/web/public/courses.html`
- `apps/web/public/course.html`
- `apps/web/public/lesson.html`
- `apps/web/public/assets/app.css`
- `apps/web/public/assets/app.js`

### 16.2 Backend
- `apps/api/src/index.ts`
- `apps/api/src/routes/health.ts`
- `apps/api/src/routes/system.ts`
- `apps/api/src/routes/courses.ts`
- `apps/api/src/routes/course.ts`
- `apps/api/src/routes/lessons.ts`
- `apps/api/src/routes/progress.ts`
- `apps/api/src/routes/lesson-actions.ts`

### 16.3 Data
- `database/migrations/0001_schema.sql`
- `database/seeds/0001_sample_data.sql`

### 16.4 Docs
- `docs/tueban-master-build-spec.md`
- các docs khác nếu cần

---

## 17. Roadmap thực thi bắt buộc

### Giai đoạn A — Foundation
- docs
- schema
- seed
- health routes
- system routes

### Giai đoạn B — Learning Core
- course list
- course detail
- outline
- lesson detail
- progress
- complete lesson

### Giai đoạn C — Homepage and mobile shell
- homepage
- menu
- drawer
- mobile-first polish

### Giai đoạn D — Admin CMS
- admin.html
- create course
- create module
- create topic
- create lesson
- list content
- view users/progress

### Giai đoạn E — Assets and auth
- login
- session
- signed assets
- protected content

### Giai đoạn F — Practice and quiz polish
- submit practice
- submit quiz
- pass/fail
- unlock rules

### Giai đoạn G — Scale and expansion
- dashboard học viên
- membership
- commerce
- live/offline
- certificate
- recommendation
- AI support

---

## 18. Nhiệm vụ giao cho dev và AI

Bất kỳ dev hoặc AI nào làm Tueban đều phải:

1. đọc file này trước
2. không tự ý đổi kiến trúc cốt lõi
3. không tự ý đổi schema mà không tạo migration
4. không dùng TextEdit cho code
5. không để frontend lệch backend
6. không chỉ làm giao diện giả
7. không chỉ làm backend mà không test UI
8. không viết file nửa chừng
9. không sửa vá rời rạc nếu file đã lệch nặng
10. luôn hoàn thiện từng cụm dứt điểm

---

## 19. Mở rộng bắt buộc nên tính trước

Dù chưa làm ngay, hệ thống phải chừa đường cho:
- login và member sessions
- multiple roles
- multiple courses per member
- content draft/publish
- asset signed url
- video/audio/pdf viewer
- lesson unlock rules nâng cao
- admin analytics
- notifications
- event/live sessions
- certificate / completion proof
- public proof / ledger explorer
- mobile app tương lai
- AI learning assistant

---

## 20. Kết luận cuối cùng

Tueban.com phải được xây như:
- một web hệ thống thật
- một learning OS thật
- một nền tảng có quản trị thật
- một nền tảng mobile-first thật
- một nền tảng có tiến trình và chứng cứ thật

Không được dừng ở mức:
- landing page
- demo page
- route rời rạc
- admin giả
- UI đẹp nhưng rỗng

Đích đến là:
- học được
- quản trị được
- mở rộng được
- vận hành thật được
- phát triển thành hệ thống lớn lâu dài được
