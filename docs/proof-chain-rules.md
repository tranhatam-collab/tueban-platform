# Proof Chain Rules

## 1. Purpose

Proof Chain đảm bảo:

- lịch sử học tập không thể sửa
- có thể kiểm chứng
- có thể audit

## 2. Event Recording

Các event sau được ghi:

- lesson_open
- lesson_complete
- quiz_pass
- topic_complete
- course_complete

## 3. Hash Linking

Mỗi event có:

- previous_hash
- current_hash

Tạo thành chuỗi.

## 4. Immutability

Không cho phép:

- xóa event
- sửa event
- rewrite history

## 5. Verification

Hệ thống có thể:

- verify chain integrity
- phát hiện missing event
- phát hiện tampering

## 6. Public Proof

Một phần proof có thể công khai qua:

- proof page
- embed link