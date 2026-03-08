# Deployment SOP

## 1. Source Control

Source code được quản lý bằng GitHub.

Repo chính:

tueban-platform

## 2. Branch Model

Branch chính:

main

Feature branch:

feature/*

## 3. Deployment Trigger

Khi push lên GitHub:

Cloudflare sẽ tự deploy.

## 4. Worker Deployment

Worker deploy bằng:

wrangler deploy

## 5. Pages Deployment

Pages deploy từ GitHub repo.

Build output:

apps/web/public

## 6. Environment

Các môi trường gồm:

- local
- staging
- production

## 7. Release Steps

Quy trình release:

1. commit code
2. push GitHub
3. deploy worker
4. verify API
5. verify pages

## 8. Rollback

Nếu deploy lỗi:

- revert commit
- redeploy worker

## 9. Monitoring

Theo dõi bằng:

- worker logs
- queue logs
- system alerts

## 10. Documentation

Mọi deploy phải ghi lại:

- version
- date
- change summary