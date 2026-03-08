# Technical Architecture

## 1. Platform Overview

Tueban sử dụng kiến trúc serverless.

Các thành phần chính:

- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Cloudflare Queues
- GitHub

## 2. Frontend

Frontend chạy trên:

Cloudflare Pages

Các file chính:

- HTML
- CSS
- JavaScript

## 3. Backend

Backend chạy trên:

Cloudflare Workers

Worker xử lý:

- API
- auth
- lesson logic
- progress
- ledger events

## 4. Database

Database sử dụng:

Cloudflare D1

D1 là SQLite distributed.

## 5. File Storage

File storage sử dụng:

Cloudflare R2

Dùng cho:

- video
- audio
- pdf
- images
- submissions

## 6. Queue System

Cloudflare Queues dùng để:

- xử lý ledger
- xử lý background tasks
- email
- verification jobs

## 7. GitHub

GitHub dùng để:

- quản lý source code
- version control
- deployment trigger

## 8. Deployment Flow

Developer push code lên GitHub.

Cloudflare tự deploy:

- Pages
- Workers

## 9. Security Layers

Các lớp bảo mật gồm:

- authentication
- role based access
- signed URLs
- audit logs
- ledger verification

## 10. Future Architecture

Sau này có thể mở rộng:

- microservices
- AI modules
- mobile apps
- public proof explorer