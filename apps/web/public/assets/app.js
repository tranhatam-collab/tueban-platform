const API_BASE = "https://tueban-api.tranhatam.workers.dev";

let currentUser = null;

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  let data;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, error: "Response is not valid JSON", status: res.status };
  }
  return { res, data };
}

function setText(selector, value) {
  const el = qs(selector);
  if (el) el.textContent = value;
}

function setHtml(selector, value) {
  const el = qs(selector);
  if (el) el.innerHTML = value;
}

function pretty(data) {
  return JSON.stringify(data, null, 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function renderMarkdownLite(md) {
  if (!md) return "<p>Chưa có nội dung bài học.</p>";
  const lines = md.split("\n");
  const html = [];
  let inList = false;
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (inList) { html.push("</ul>"); inList = false; }
      continue;
    }
    if (line.startsWith("# ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith("## ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("### ")) {
      if (inList) { html.push("</ul>"); inList = false; }
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("- ")) {
      if (!inList) { html.push("<ul>"); inList = true; }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }
    if (inList) { html.push("</ul>"); inList = false; }
    html.push(`<p>${nl2br(line)}</p>`);
  }
  if (inList) html.push("</ul>");
  return html.join("");
}

function courseLink(slug) {
  return `/course.html?slug=${encodeURIComponent(slug)}`;
}

function lessonLink(slug) {
  return `/lesson.html?slug=${encodeURIComponent(slug)}`;
}

function setLoadingCard(selector, text) {
  setHtml(selector, `<div class="card">${escapeHtml(text)}</div>`);
}

async function fetchCurrentUser() {
  const { data } = await fetchJson(`${API_BASE}/api/me`);
  if (data?.ok && data?.user) {
    currentUser = data.user;
  }
  return currentUser;
}

async function renderCoursesPage() {
  const mount = qs("#courses-list");
  if (!mount) return;
  setLoadingCard("#courses-list", "Đang tải danh sách khóa học...");
  try {
    const { res, data } = await fetchJson(`${API_BASE}/api/courses`);
    if (!res.ok || !data?.ok) {
      mount.innerHTML = `<div class="card">Lỗi tải khóa học: ${escapeHtml(data?.error || `HTTP ${res.status}`)}</div>`;
      return;
    }
    const courses = data.courses || [];
    if (!courses.length) {
      mount.innerHTML = `<div class="card">Chưa có khóa học nào.</div>`;
      return;
    }
    mount.innerHTML = courses.map((course) => `
      <article class="card course-card">
        <div class="status">${escapeHtml(course.level)} • ${escapeHtml(course.status)}</div>
        <h3>${escapeHtml(course.title)}</h3>
        <p class="muted">${escapeHtml(course.short_description || "Chưa có mô tả ngắn.")}</p>
        <div class="actions">
          <a class="btn" href="${courseLink(course.slug)}">Xem khóa học</a>
        </div>
      </article>
    `).join("");
  } catch (error) {
    mount.innerHTML = `<div class="card">Lỗi tải khóa học: ${escapeHtml(String(error))}</div>`;
  }
}

async function renderCoursePage() {
  const slug = getParam("slug");
  const modulesEl = qs("#course-modules");
  if (!slug || !modulesEl) return;
  setText("#course-slug", slug);
  setLoadingCard("#course-modules", "Đang tải khóa học...");
  try {
    const [{ res: detailRes, data: detailData }, { res: outlineRes, data: outlineData }] =
      await Promise.all([
        fetchJson(`${API_BASE}/api/course/${encodeURIComponent(slug)}`),
        fetchJson(`${API_BASE}/api/courses/${encodeURIComponent(slug)}/outline`)
      ]);
    if (!detailRes.ok || !detailData?.ok || !detailData?.course) {
      modulesEl.innerHTML = `<div class="card">Không tìm thấy khóa học.</div>`;
      return;
    }
    const course = detailData.course;
    const modules = outlineRes.ok && outlineData?.ok ? outlineData.modules || [] : [];
    setText("#course-title", course.title);
    setText("#course-desc", course.long_description || course.short_description || "Chưa có mô tả.");
    setText("#course-meta", `${course.level} • ${course.visibility} • ${course.status}`);
    if (!modules.length) {
      modulesEl.innerHTML = `<div class="card">Khóa học chưa có module nào.</div>`;
      return;
    }
    modulesEl.innerHTML = modules.map((module) => `
      <section class="card module-card">
        <h3>${escapeHtml(module.title)}</h3>
        <p class="muted">${escapeHtml(module.description || "Chưa có mô tả module.")}</p>
        <div class="topic-list">
          ${(module.topics || []).map((topic) => `
            <article class="card topic-card">
              <div class="status">Topic ${escapeHtml(String(topic.position))}</div>
              <h4>${escapeHtml(topic.title)}</h4>
              <p class="muted">${escapeHtml(topic.description || "Chưa có mô tả topic.")}</p>
              <div class="lesson-list">
                ${(topic.lessons || []).map((lesson) => `
                  <a class="lesson-link" href="${lessonLink(lesson.slug)}">
                    <strong>${escapeHtml(lesson.title)}</strong>
                    <small>${escapeHtml(lesson.lesson_type)} • ${escapeHtml(lesson.completion_mode)} • ${escapeHtml(lesson.status)}</small>
                  </a>
                `).join("")}
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("");
  } catch (error) {
    modulesEl.innerHTML = `<div class="card">Lỗi tải khóa học: ${escapeHtml(String(error))}</div>`;
  }
}

async function renderLessonPage() {
  const slug = getParam("slug");
  const bodyEl = qs("#lesson-body");
  const assetsEl = qs("#lesson-assets");
  const completeBtn = qs("#complete-lesson-btn");
  if (!slug || !bodyEl) return;
  setText("#lesson-slug", slug);
  bodyEl.innerHTML = `<div class="card">Đang tải bài học...</div>`;
  try {
    const { res, data } = await fetchJson(`${API_BASE}/api/lessons/${encodeURIComponent(slug)}`);
    if (!res.ok || !data?.ok || !data?.lesson) {
      bodyEl.innerHTML = `<div class="card">Không tìm thấy bài học.</div>`;
      return;
    }
    const lesson = data.lesson;
    const assets = data.assets || [];
    setText("#lesson-title", lesson.title);
    setText("#lesson-course", `${lesson.course_title} / ${lesson.topic_title}`);
    setText("#lesson-meta", `${lesson.lesson_type} • ${lesson.completion_mode} • ${lesson.status}`);
    bodyEl.innerHTML = renderMarkdownLite(lesson.content_md);
    if (assetsEl) {
      if (!assets.length) {
        assetsEl.innerHTML = `<div class="card">Bài học này chưa có tài liệu đính kèm.</div>`;
      } else {
        assetsEl.innerHTML = assets.map((asset) => `
          <article class="card asset-card">
            <div class="status">${escapeHtml(asset.asset_type)} • ${escapeHtml(asset.visibility)}</div>
            <h4>${escapeHtml(asset.title)}</h4>
            <p class="muted">${escapeHtml(asset.storage_path)}</p>
            <p class="muted">Purpose: ${escapeHtml(asset.purpose)} • Required: ${asset.is_required ? "Có" : "Không"} • Download: ${asset.downloadable ? "Có" : "Không"}</p>
          </article>
        `).join("");
      }
    }
    if (completeBtn) {
      completeBtn.dataset.lessonSlug = lesson.slug;
      completeBtn.disabled = false;
    }
  } catch (error) {
    bodyEl.innerHTML = `<div class="card">Lỗi tải bài học: ${escapeHtml(String(error))}</div>`;
  }
}

async function completeLesson() {
  const btn = qs("#complete-lesson-btn");
  const resultEl = qs("#lesson-complete-result");
  const slug = btn?.dataset.lessonSlug;
  if (!slug) {
    if (resultEl) resultEl.textContent = "Không tìm thấy lesson_slug.";
    return;
  }
  if (btn) btn.disabled = true;
  if (resultEl) resultEl.textContent = "Đang gửi yêu cầu hoàn thành bài học...";
  try {
    const { data } = await fetchJson(`${API_BASE}/api/lesson/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_slug: slug })
    });
    if (resultEl) resultEl.textContent = pretty(data);
    await renderProgressPanel();
  } catch (error) {
    if (resultEl) resultEl.textContent = `Lỗi complete lesson: ${String(error)}`;
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function renderProgressPanel() {
  const summary = qs("#progress-summary");
  if (!summary) return;
  const { data } = await fetchJson(
    `${API_BASE}/api/progress?course_id=course_001`
  );
  const cp = data?.course_progress;
  const topics = data?.topic_progresses || [];
  const lessons = data?.lesson_progresses || [];
  summary.innerHTML = `
    <div class="card">
      <h3>Tiến độ học tập</h3>
      <p class="muted">Trạng thái khóa học: ${escapeHtml(cp?.status || "chưa có")} • Tiến độ: ${escapeHtml(String(cp?.progress_percent ?? 0))}%</p>
      <p class="muted">Topics: ${topics.length} • Lessons: ${lessons.length}</p>
    </div>
  `;
}

function bindEvents() {
  const completeBtn = qs("#complete-lesson-btn");
  if (completeBtn) completeBtn.addEventListener("click", completeLesson);
  const magicLinkForm = qs("#magic-link-form");
  if (magicLinkForm) magicLinkForm.addEventListener("submit", requestMagicLink);
}

async function requestMagicLink(event) {
  event.preventDefault();
  const email = qs("#magic-email")?.value;
  const output = qs("#auth-output");
  if (output) output.textContent = "Đang gửi yêu cầu magic link...";
  try {
    const { data } = await fetchJson(`${API_BASE}/api/auth/magic-link/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    if (output) output.textContent = pretty(data);
  } catch (error) {
    if (output) output.textContent = `Lỗi gửi magic link: ${String(error)}`;
  }
}

function bindMobileDrawer() {
  const toggle = qs("#menu-toggle");
  const drawer = qs("#mobile-drawer");
  const closeBtn = qs("#drawer-close");
  const backdrop = qs("#drawer-backdrop");
  if (!toggle || !drawer || !backdrop) return;
  const openDrawer = () => {
    drawer.classList.add("is-open");
    backdrop.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  };
  const closeDrawer = () => {
    drawer.classList.remove("is-open");
    backdrop.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  };
  toggle.addEventListener("click", openDrawer);
  backdrop.addEventListener("click", closeDrawer);
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  qsa(".drawer-nav a").forEach((link) => link.addEventListener("click", closeDrawer));
}

let learningSessionId = null;
let lastActivity = 0;
let pingInterval = null;

function setupActivityTracker() {
  const track = () => { lastActivity = Date.now(); };
  document.addEventListener("scroll", track, { passive: true });
  document.addEventListener("keydown", track, { passive: true });
  document.addEventListener("click", track, { passive: true });
}

async function startLearningSession(slug) {
  if (!currentUser) return;
  try {
    const { data } = await fetchJson(`${API_BASE}/api/learning/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_slug: slug })
    });
    if (data?.ok) {
      learningSessionId = data.session.id;
      pingInterval = setInterval(async () => {
        if (!learningSessionId || !currentUser) return;
        if (document.visibilityState !== "visible") return;
        const elapsed = Math.floor((Date.now() - lastActivity) / 1000);
        if (elapsed > 60) return;
        await fetchJson(`${API_BASE}/api/learning/session/ping`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: learningSessionId, active_seconds: 30 })
        });
      }, 30000);
    }
  } catch (e) {
    console.warn("Session start failed:", e);
  }
}

async function endLearningSession() {
  if (!learningSessionId) return;
  try {
    await fetchJson(`${API_BASE}/api/learning/session/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: learningSessionId })
    });
  } catch (e) {
    console.warn("Session end failed:", e);
  }
  learningSessionId = null;
  if (pingInterval) clearInterval(pingInterval);
}

async function initPage() {
  await fetchCurrentUser();
  bindEvents();
  bindMobileDrawer();
  if (qs("#courses-list")) renderCoursesPage();
  if (qs("#course-modules")) renderCoursePage();
  if (qs("#lesson-body")) {
    renderLessonPage();
    setupActivityTracker();
    const slug = getParam("slug");
    if (slug) startLearningSession(slug);
  }
  if (qs("#progress-summary")) renderProgressPanel();
}

document.addEventListener("DOMContentLoaded", initPage);
window.addEventListener("beforeunload", endLearningSession);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") endLearningSession();
});
