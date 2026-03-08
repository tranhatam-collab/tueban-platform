const API_BASE = "https://tueban-api.tranhatam.workers.dev";

function qs(selector) {
  return document.querySelector(selector);
}

function getParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { res, data };
}

function setText(selector, value) {
  const el = qs(selector);
  if (el) {
    el.textContent = value;
  }
}

function pretty(data) {
  return JSON.stringify(data, null, 2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nl2br(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function renderMarkdownLite(md) {
  if (!md) {
    return "<p>Chưa có nội dung bài học.</p>";
  }

  const lines = md.split("\n");
  const html = [];
  let inList = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (line.startsWith("# ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1>${escapeHtml(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2>${escapeHtml(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3>${escapeHtml(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(line.slice(2))}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    html.push(`<p>${nl2br(line)}</p>`);
  }

  if (inList) {
    html.push("</ul>");
  }

  return html.join("");
}

function renderApiOutput(selector, data) {
  const el = qs(selector);
  if (el) {
    el.textContent = pretty(data);
  }
}

function courseLink(slug) {
  return `/course.html?slug=${encodeURIComponent(slug)}`;
}

function lessonLink(slug) {
  return `/lesson.html?slug=${encodeURIComponent(slug)}`;
}

async function renderCoursesPage() {
  const mount = qs("#courses-list");
  const output = qs("#courses-output");

  if (!mount) return;

  mount.innerHTML = `<div class="card">Đang tải danh sách khóa học...</div>`;

  try {
    const { data } = await fetchJson(`${API_BASE}/api/courses`);
    renderApiOutput("#courses-output", data);

    const courses = data?.courses || [];

    if (!courses.length) {
      mount.innerHTML = `<div class="card">Chưa có khóa học nào.</div>`;
      return;
    }

    mount.innerHTML = courses
      .map(
        (course) => `
          <article class="card course-card">
            <div class="status">${escapeHtml(course.level)} • ${escapeHtml(course.status)}</div>
            <h3>${escapeHtml(course.title)}</h3>
            <p class="muted">${escapeHtml(course.short_description || "Chưa có mô tả ngắn.")}</p>
            <div class="actions">
              <a class="btn" href="${courseLink(course.slug)}">Xem khóa học</a>
            </div>
          </article>
        `
      )
      .join("");
  } catch (error) {
    mount.innerHTML = `<div class="card">Lỗi tải khóa học: ${escapeHtml(String(error))}</div>`;
    if (output) {
      output.textContent = String(error);
    }
  }
}

async function renderCoursePage() {
  const slug = getParam("slug");
  const modulesEl = qs("#course-modules");

  if (!slug || !modulesEl) return;

  setText("#course-slug", slug);
  modulesEl.innerHTML = `<div class="card">Đang tải khóa học...</div>`;

  try {
    const [{ data: detailData }, { data: outlineData }] = await Promise.all([
      fetchJson(`${API_BASE}/api/course/${encodeURIComponent(slug)}`),
      fetchJson(`${API_BASE}/api/courses/${encodeURIComponent(slug)}/outline`)
    ]);

    renderApiOutput("#course-output", {
      detail: detailData,
      outline: outlineData
    });

    if (!detailData?.ok || !detailData?.course) {
      modulesEl.innerHTML = `<div class="card">Không tìm thấy khóa học.</div>`;
      return;
    }

    const course = detailData.course;
    const modules = outlineData?.modules || [];

    setText("#course-title", course.title);
    setText(
      "#course-desc",
      course.long_description || course.short_description || "Chưa có mô tả."
    );
    setText(
      "#course-meta",
      `${course.level} • ${course.visibility} • ${course.status}`
    );

    if (!modules.length) {
      modulesEl.innerHTML = `<div class="card">Khóa học chưa có module nào.</div>`;
      return;
    }

    modulesEl.innerHTML = modules
      .map(
        (module) => `
          <section class="card module-card">
            <h3>${escapeHtml(module.title)}</h3>
            <p class="muted">${escapeHtml(module.description || "Chưa có mô tả module.")}</p>

            <div class="topic-list">
              ${(module.topics || [])
                .map(
                  (topic) => `
                    <article class="card topic-card">
                      <div class="status">Topic ${escapeHtml(String(topic.position))}</div>
                      <h4>${escapeHtml(topic.title)}</h4>
                      <p class="muted">${escapeHtml(topic.description || "Chưa có mô tả topic.")}</p>

                      <div class="lesson-list">
                        ${(topic.lessons || [])
                          .map(
                            (lesson) => `
                              <a class="lesson-link" href="${lessonLink(lesson.slug)}">
                                <strong>${escapeHtml(lesson.title)}</strong>
                                <small>${escapeHtml(lesson.lesson_type)} • ${escapeHtml(lesson.completion_mode)} • ${escapeHtml(lesson.status)}</small>
                              </a>
                            `
                          )
                          .join("")}
                      </div>
                    </article>
                  `
                )
                .join("")}
            </div>
          </section>
        `
      )
      .join("");
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
    const { data } = await fetchJson(`${API_BASE}/api/lessons/${encodeURIComponent(slug)}`);
    renderApiOutput("#lesson-output", data);

    if (!data?.ok || !data?.lesson) {
      bodyEl.innerHTML = `<div class="card">Không tìm thấy bài học.</div>`;
      return;
    }

    const lesson = data.lesson;
    const assets = data.assets || [];

    setText("#lesson-title", lesson.title);
    setText("#lesson-course", `${lesson.course_title} / ${lesson.topic_title}`);
    setText(
      "#lesson-meta",
      `${lesson.lesson_type} • ${lesson.completion_mode} • ${lesson.status}`
    );

    bodyEl.innerHTML = renderMarkdownLite(lesson.content_md);

    if (assetsEl) {
      if (!assets.length) {
        assetsEl.innerHTML = `<div class="card">Bài học này chưa có tài liệu đính kèm.</div>`;
      } else {
        assetsEl.innerHTML = assets
          .map(
            (asset) => `
              <article class="card asset-card">
                <div class="status">${escapeHtml(asset.asset_type)} • ${escapeHtml(asset.visibility)}</div>
                <h4>${escapeHtml(asset.title)}</h4>
                <p class="muted">${escapeHtml(asset.storage_path)}</p>
                <p class="muted">
                  Purpose: ${escapeHtml(asset.purpose)} •
                  Required: ${asset.is_required ? "Có" : "Không"} •
                  Download: ${asset.downloadable ? "Có" : "Không"}
                </p>
              </article>
            `
          )
          .join("");
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
    if (resultEl) {
      resultEl.textContent = "Không tìm thấy lesson_slug để hoàn thành bài học.";
    }
    return;
  }

  if (btn) btn.disabled = true;
  if (resultEl) resultEl.textContent = "Đang gửi yêu cầu hoàn thành bài học...";

  try {
    const { data } = await fetchJson(`${API_BASE}/api/lesson/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        user_id: "user_member_001",
        lesson_slug: slug
      })
    });

    if (resultEl) {
      resultEl.textContent = pretty(data);
    }

    await renderProgressPanel();
  } catch (error) {
    if (resultEl) {
      resultEl.textContent = `Lỗi complete lesson: ${String(error)}`;
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function renderProgressPanel() {
  const summary = qs("#progress-summary");
  const output = qs("#progress-output");

  if (!summary && !output) return;

  try {
    const { data } = await fetchJson(
      `${API_BASE}/api/progress?user_id=user_member_001&course_id=course_001`
    );

    renderApiOutput("#progress-output", data);

    const cp = data?.course_progress;
    const topics = data?.topic_progresses || [];
    const lessons = data?.lesson_progresses || [];

    if (summary) {
      summary.innerHTML = `
        <div class="card">
          <h3>Tiến độ học viên mẫu</h3>
          <p class="muted">
            Trạng thái khóa học: ${escapeHtml(cp?.status || "chưa có")} •
            Tiến độ: ${escapeHtml(String(cp?.progress_percent ?? 0))}%
          </p>
          <p class="muted">
            Topics: ${topics.length} • Lessons: ${lessons.length}
          </p>
        </div>
      `;
    }
  } catch (error) {
    if (summary) {
      summary.innerHTML = `<div class="card">Lỗi tải progress: ${escapeHtml(String(error))}</div>`;
    }
  }
}

function bindEvents() {
  const completeBtn = qs("#complete-lesson-btn");
  if (completeBtn) {
    completeBtn.addEventListener("click", completeLesson);
  }
}

function initPage() {
  bindEvents();

  if (qs("#courses-list")) {
    renderCoursesPage();
  }

  if (qs("#course-modules")) {
    renderCoursePage();
  }

  if (qs("#lesson-body")) {
    renderLessonPage();
  }

  if (qs("#progress-summary") || qs("#progress-output")) {
    renderProgressPanel();
  }
}

document.addEventListener("DOMContentLoaded", initPage);