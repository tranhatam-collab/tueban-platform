# Media Policy

## 1. Purpose

Media Policy định nghĩa cách hệ thống Tueban quản lý:

- video
- audio
- pdf
- hình ảnh
- workbook
- replay live

## 2. Storage System

Tất cả media được lưu trong:

Cloudflare R2

Không lưu file lớn trong database.

Database chỉ lưu metadata.

## 3. Media Types

Các loại media gồm:

- video
- audio
- pdf
- image
- workbook
- replay

## 4. Access Levels

Media có 3 mức truy cập.

### Public

Ai cũng xem được.

Ví dụ:

- video giới thiệu
- tài liệu public

### Member

Chỉ học viên có quyền mới xem được.

Ví dụ:

- video bài học
- tài liệu khóa học

### Admin

Chỉ admin hoặc instructor mới xem được.

Ví dụ:

- bài nộp
- file chấm bài
- báo cáo nội bộ

## 5. Signed Access

Media protected phải dùng:

signed URL

Thời gian hiệu lực:

- 5 phút
- 15 phút
- 60 phút

Tùy policy.

## 6. Media Metadata

Database lưu các thông tin:

- id
- type
- title
- path
- size
- visibility
- owner
- created_at

## 7. Upload Rules

Upload chỉ cho phép:

- admin
- instructor
- assistant

Member không upload media hệ thống.

## 8. Security

Không cho phép:

- direct public URL
- directory listing
- anonymous upload

## 9. Long Term Plan

Sau này media có thể tích hợp:

- streaming video
- adaptive bitrate
- DRM