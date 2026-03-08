# Information Architecture

## 1. Architecture Principle

Tueban được chia thành 5 vùng rõ ràng:

- Public
- Student
- Live and Offline
- Admin
- EDU Embed

Không trộn route, không trộn quyền, không trộn vai trò giữa các vùng.

## 2. Public Site

### Core pages
- /
- /gioi-thieu
- /nen-tang-tri-tue
- /lo-trinh-hoc
- /khoa-hoc
- /thu-vien
- /bai-viet
- /tu-dien
- /su-kien
- /cau-hoi-thuong-gap
- /lien-he

### Public content types
- page
- article
- glossary_entry
- course_landing
- event_landing
- library_item_public

## 3. Student Area

### Entry
- /hoc-vien
- /hoc-vien/dang-nhap
- /hoc-vien/dashboard

### Learning
- /hoc-vien/khoa-hoc
- /hoc-vien/khoa-hoc/:courseSlug
- /hoc-vien/topic/:topicSlug
- /hoc-vien/bai-hoc/:lessonSlug

### Learning support
- /hoc-vien/tai-lieu
- /hoc-vien/video
- /hoc-vien/audio
- /hoc-vien/ghi-chu
- /hoc-vien/lich-hoc
- /hoc-vien/tien-trinh
- /hoc-vien/lich-su-hoc
- /hoc-vien/proof
- /hoc-vien/tai-khoan

### Assessment
- /hoc-vien/thuc-hanh
- /hoc-vien/bao-cao
- /hoc-vien/kiem-tra

## 4. Live and Offline

### Live
- /live
- /live/lich
- /live/phong-hoc/:slug
- /live/replay/:slug

### Offline
- /offline
- /offline/su-kien/:slug
- /offline/checkin

## 5. Admin Area

### Entry
- /admin
- /admin/dashboard

### Content
- /admin/courses
- /admin/modules
- /admin/topics
- /admin/lessons
- /admin/assets

### Users and access
- /admin/members
- /admin/roles
- /admin/permissions

### Learning control
- /admin/unlock-rules
- /admin/completion-rules
- /admin/assessments

### Proof and audit
- /admin/ledger
- /admin/audit
- /admin/verifications

### Operations
- /admin/events
- /admin/settings
- /admin/deploy

## 6. EDU Embed and Public Proof

- /edu/embed/proof/:publicId
- /edu/embed/timeline/:publicId
- /edu/verified/:publicId

## 7. Navigation Model

### Public nav
- Giới thiệu
- Nền tảng
- Khóa học
- Thư viện
- Bài viết
- Sự kiện
- Liên hệ

### Student nav
- Dashboard
- Khóa học
- Tiến trình
- Thực hành
- Kiểm tra
- Ghi chú
- Lịch học
- Proof

### Admin nav
- Dashboard
- Courses
- Lessons
- Assets
- Members
- Rules
- Assessments
- Ledger
- Audit
- Settings

## 8. Content Hierarchy

Course
-> Module
-> Topic
-> Lesson
-> Asset
-> Practice or Report or Quiz
-> Topic Approval
-> Unlock Next Topic
-> Course Completion

## 9. IA Rule

Không route nào được tồn tại nếu chưa rõ:
- ai truy cập
- quyền gì
- dữ liệu nào
- trạng thái mở khóa ra sao
- có cần proof hay không