# Product Spec

## 1. Product Name

Tueban Platform

## 2. Core Definition

Tueban.com là một Learning Operating System, không phải một website bán khóa học thông thường.

Nó là hệ học tập có cấu trúc gồm các lớp:

- Public Knowledge
- Course Library
- Student Learning System
- Sequential Unlock Engine
- Practice & Assessment Engine
- Immutable Ledger Engine
- Admin Audit System
- Media Library
- EDU Proof Channel

## 3. Product Goal

Mục tiêu của Tueban là tạo ra một nền tảng học tập có thể:

- Học online theo lộ trình rõ ràng
- Học offline với tài liệu và media tải về
- Theo dõi tiến độ học thật
- Kiểm soát học tuần tự
- Gắn bài thực hành, báo cáo, kiểm tra sau từng chủ đề
- Lưu lại toàn bộ lịch sử học tập và chỉnh sửa dưới dạng audit bất biến
- Công khai phần proof được phép qua một kênh EDU riêng

## 4. Product Positioning

Tueban không là:

- LMS công nghiệp nặng nề
- Marketplace khóa học đại trà
- Mạng xã hội học tập

Tueban là:

- Hệ học tập chiều sâu
- Hệ vận hành tri thức và thực hành
- Hệ thống có proof, audit, và trình tự học nghiêm ngặt

## 5. Primary User Types

- Visitor
- Free Member
- Paid Member
- Long Term Member
- Assistant
- Instructor
- Admin
- Owner

## 6. Product Modules

### 6.1 Public Knowledge
Trang chủ, giới thiệu, triết lý, bài viết, từ điển, thư viện công khai, landing khóa học, FAQ, liên hệ.

### 6.2 Course Library
Khóa học căn bản, chuyên sâu, chuyên đề ngắn, chương trình theo lộ trình, bundle, media learning.

### 6.3 Student Learning System
Dashboard học viên, tiến độ, bài học, ghi chú, lịch học, tài liệu, lịch sử học, proof cá nhân.

### 6.4 Sequential Unlock Engine
Quản lý điều kiện mở khóa theo lesson, topic, course, practice, report, quiz, approval.

### 6.5 Practice & Assessment Engine
Bài thực hành, báo cáo, reflection, quiz, review, pass/fail, approval.

### 6.6 Immutable Ledger Engine
Ghi nhận append-only các hành vi học tập và hành vi quản trị thành chuỗi sự kiện có hash.

### 6.7 Admin Audit System
Theo dõi toàn bộ chỉnh sửa nội dung, thay đổi quyền, thay file, chấm bài, mở khóa, cấu hình.

### 6.8 Media Library
Ảnh, PDF, audio, video, workbook, replay, submissions, attachments.

### 6.9 EDU Proof Channel
Xuất dữ liệu proof được phép công khai để nhúng sang kênh EDU riêng.

## 7. Phase Plan

### Phase 1: Foundation and Lock
- Product documents
- Information architecture
- Roles and permissions
- Learning logic
- Ledger logic
- Technical architecture
- Media policy
- Deployment SOP

### Phase 2: Core Data and APIs
- D1 schema
- Auth
- Sessions
- RBAC
- Courses
- Modules
- Topics
- Lessons
- Assets

### Phase 3: Learning Flow
- Progress tracking
- Sequential unlock
- Practice submission
- Quiz attempts
- Topic completion
- Course completion

### Phase 4: Proof and Audit
- Ledger blocks
- Ledger events
- Root hashes
- Verification runs
- Audit explorer
- Public proof records

### Phase 5: Media and Events
- Signed asset access
- Video and audio library
- Live events
- Replay archive
- Offline events
- Check-in

## 8. Non Goals In Phase 1

Trong phase 1 chưa làm:

- AI recommendation engine
- Native mobile app
- Social feed
- Large scale livestream infra
- Commerce phức tạp
- Public blockchain anchoring

## 9. Technical Stack

- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Cloudflare Queues
- GitHub

## 10. Product Rule

Không có logic quan trọng nào được đặt chỉ ở frontend.

Mọi thứ liên quan tới:
- quyền
- mở khóa
- hoàn thành
- kiểm tra
- proof
- audit

đều phải xác nhận ở backend.