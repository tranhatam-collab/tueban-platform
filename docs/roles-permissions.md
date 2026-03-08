# Roles and Permissions

## 1. Role Model

Tueban dùng mô hình role-based access control với 8 cấp:

- visitor
- free_member
- paid_member
- long_term_member
- assistant
- instructor
- admin
- owner

## 2. Role Definitions

### visitor
Người dùng công khai chưa đăng nhập.

Có thể:
- xem trang public
- xem bài viết public
- xem landing khóa học
- gửi form liên hệ

Không thể:
- học nội dung members
- tải file protected
- xem dashboard
- xem proof riêng tư

### free_member
Người dùng đã đăng ký nhưng chưa mua khóa.

Có thể:
- đăng nhập
- xem dashboard cơ bản
- học khóa free
- ghi chú trong khóa free
- xem lịch học free nếu có

Không thể:
- vào khóa paid
- tải media protected
- xem proof của người khác

### paid_member
Người dùng đã mua khóa hoặc được gán quyền.

Có thể:
- học khóa đã được enroll
- truy cập lesson theo rule
- nộp practice
- làm quiz
- xem lịch sử học của chính mình
- xem proof cá nhân

Không thể:
- bỏ qua unlock rules
- sửa nội dung
- xem dữ liệu học viên khác

### long_term_member
Member dài hạn có quyền lớn hơn paid_member.

Có thể:
- truy cập library members
- vào các khóa thành viên
- xem lịch live dài hạn
- tải thêm tài liệu theo policy

Không thể:
- chỉnh logic khóa học
- sửa dữ liệu người khác

### assistant
Trợ giảng hỗ trợ vận hành.

Có thể:
- xem danh sách học viên được phân công
- xem practice submissions được phân công
- phản hồi theo quyền
- xem progress theo phạm vi được giao

Không thể:
- thay đổi core settings
- thay đổi role cao hơn
- xóa audit logs

### instructor
Giảng viên phụ trách nội dung và học tập.

Có thể:
- tạo và sửa nội dung trong phạm vi được giao
- chấm bài
- duyệt topic
- xem progress của khóa mình dạy
- xem proof liên quan khóa của mình

Không thể:
- thay đổi owner settings
- sửa global security config
- xóa ledger history

### admin
Quản trị viên hệ thống.

Có thể:
- quản lý courses
- quản lý lessons
- quản lý assets
- quản lý members
- quản lý rules
- quản lý events
- xem ledger
- xem audit logs
- chạy verification

Không thể:
- xóa append-only records theo kiểu làm mất lịch sử
- tự ý phá root chain
- vượt owner policy nếu bị khóa

### owner
Chủ hệ thống.

Có toàn quyền:
- mọi vùng admin
- mọi cấu hình hệ thống
- role mapping
- security policy
- deployment policy
- proof publishing policy

## 3. Permission Areas

### Public permissions
- page.read_public
- article.read_public
- glossary.read_public
- contact.submit

### Learning permissions
- dashboard.read_self
- course.read_enrolled
- lesson.read_unlocked
- asset.read_allowed
- note.create_self
- note.read_self
- progress.read_self

### Assessment permissions
- practice.submit_self
- report.submit_self
- quiz.attempt_self
- review.read_self

### Teaching permissions
- submission.review_assigned
- topic.approve_assigned
- progress.read_assigned
- content.edit_assigned

### Admin permissions
- course.create
- course.update
- course.publish
- lesson.create
- lesson.update
- asset.upload
- member.manage
- role.assign
- rule.manage
- ledger.read
- audit.read
- verification.run

### Owner permissions
- settings.manage
- deploy.manage
- security.manage
- proof_policy.manage
- role_system.manage

## 4. Permission Rules

- Không có role nào được bypass unlock engine bằng frontend.
- Không có role nào được sửa event cũ trong ledger.
- Mọi thay đổi quyền phải tạo audit event.
- Mọi thay đổi content quan trọng phải tạo content version.

## 5. Access Principle

User chỉ thấy:
- cái họ có quyền thấy
- đúng thời điểm được phép thấy
- đúng theo policy của course, topic, lesson, asset