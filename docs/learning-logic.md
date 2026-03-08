# Learning Logic

## 1. Core Model

Một khóa học trong Tueban vận hành theo chuỗi:

Course
-> Module
-> Topic
-> Lesson
-> Asset
-> Practice or Report or Quiz
-> Topic Approval
-> Unlock Next
-> Course Completion

## 2. Core Rule

Không lesson nào được mở chỉ vì user bấm vào.

Lesson chỉ mở khi backend xác nhận:
- user có quyền vào course
- lesson đã được publish
- lesson không bị khóa theo schedule
- lesson trước đó đã đủ điều kiện hoàn thành
- topic trước đó đã được approve nếu policy yêu cầu

## 3. Course Structure

### Course
Là đơn vị học lớn nhất.

Thuộc tính bắt buộc:
- title
- slug
- level
- format
- visibility
- status

### Module
Dùng để nhóm các topic.

### Topic
Là đơn vị học có chủ đề trọn vẹn, có thể có:
- practice
- report
- quiz
- manual approval

### Lesson
Là đơn vị học nhỏ nhất theo trình tự.

Lesson có thể là:
- text
- video
- audio
- pdf
- workbook
- live
- replay

## 4. Lesson States

Một lesson có 4 trạng thái logic:

- locked
- unlocked
- in_progress
- completed

## 5. Completion Modes

Mỗi lesson có một completion mode.

Các mode chuẩn:

- text_only
- video_required
- audio_required
- file_required
- reflection_required
- quiz_required
- practice_required
- instructor_approval_required
- hybrid

## 6. Unlock Logic

Lesson tiếp theo chỉ được mở khi lesson hiện tại đạt đủ điều kiện.

Ví dụ:
- lesson_2 mở khi lesson_1 completed
- lesson_3 mở khi lesson_2 completed và reflection submitted
- topic_2 mở khi topic_1 approved

## 7. Valid Learning Events

Các event học tập hợp lệ gồm:

- auth.login
- course.view
- topic.view
- lesson.open
- lesson.read
- lesson.video_progress
- lesson.audio_progress
- lesson.file_open
- lesson.file_download
- lesson.complete_requested
- lesson.completed
- practice.submitted
- report.submitted
- quiz.started
- quiz.submitted
- quiz.passed
- topic.complete_requested
- topic.completed
- course.completed

## 8. Time Tracking Principle

Không tính thời gian học chỉ bằng cách lấy thời gian mở trang.

Cần ghi nhận:
- session_started
- focus_ping
- scroll_depth
- video_progress
- interaction_confirmed
- session_ended

Từ đó mới tính:
- active_learning_time
- video_watch_time
- reading_estimate_time
- valid_session_time

## 9. Topic Completion

Một topic chỉ hoàn tất khi:
- toàn bộ lesson bắt buộc đã complete
- practice bắt buộc đã nộp nếu có
- report bắt buộc đã nộp nếu có
- quiz bắt buộc đã pass nếu có
- manual approval đã được xác nhận nếu có

## 10. Course Completion

Một course chỉ hoàn tất khi:
- toàn bộ topic bắt buộc đã hoàn thành
- các topic cần approval đã được duyệt
- không còn lesson khóa bắt buộc chưa xong
- proof chain có đủ event hoàn tất

## 11. Proof Rule

Mọi thay đổi trạng thái học tập quan trọng phải sinh event để ghi vào ledger.

Tối thiểu phải ghi:
- open
- progress
- submit
- pass
- approve
- complete
- unlock_next

## 12. Anti-Cheat Rule

Không cho phép:
- mở lesson sau bằng tay qua URL nếu chưa unlock
- complete lesson chỉ bằng request từ frontend
- submit quiz giả mà không có lesson access hợp lệ
- thay đổi trạng thái progress mà không có event log

## 13. Learning Principle

Thuật toán học của Tueban phải luôn đảm bảo:

- học đúng thứ tự
- học có điều kiện
- học có thực hành
- học có kiểm tra
- học có chứng cứ
- học có lịch sử