const API_BASE = "https://tueban-api.tranhatam.workers.dev";

function qs(s) { return document.querySelector(s); }
function qsa(s) { return Array.from(document.querySelectorAll(s)); }
function escapeHtml(v) { return String(v ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { credentials: "include", ...opts });
  let data;
  try { data = await res.json(); } catch { data = { ok: false, error: "Invalid JSON", status: res.status }; }
  return { res, data };
}

function adminMsg(text, ok = true) {
  const el = qs("#admin-message");
  if (!el) return;
  el.style.display = "block";
  el.textContent = text;
  el.style.borderColor = ok ? "" : "red";
  el.style.color = ok ? "" : "red";
  setTimeout(() => { el.style.display = "none"; }, 5000);
}

function showTab(name) {
  qsa(".admin-section").forEach(s => s.classList.remove("active"));
  qsa(".admin-sidebar nav a").forEach(a => a.classList.remove("active"));
  const tab = qs("#tab-" + name);
  if (tab) tab.classList.add("active");
  const link = qs(`.admin-sidebar nav a[data-tab="${name}"]`);
  if (link) link.classList.add("active");
}

qsa(".admin-sidebar nav a").forEach(a => {
  a.addEventListener("click", e => {
    e.preventDefault();
    showTab(a.dataset.tab);
    loadTab(a.dataset.tab);
  });
});

async function checkAuth() {
  const { data } = await fetchJson(`${API_BASE}/api/me`);
  if (!data?.ok || !data?.user) {
    window.location.href = "/auth/";
    return;
  }
  const roles = data.user.roles || [];
  if (!roles.some(r => ["owner", "admin"].includes(r))) {
    qs("#admin-user-info").textContent = "Bạn không có quyền admin.";
    return;
  }
  qs("#admin-user-info").textContent = `${data.user.email} (${roles.join(", ")})`;
}

function loadTab(name) {
  switch (name) {
    case "courses": loadAdminCourses(); break;
    case "modules": loadAdminModules(); break;
    case "topics": loadAdminTopics(); break;
    case "lessons": loadAdminLessons(); break;
    case "assets": loadAdminAssets(); break;
    case "users": loadAdminUsers(); break;
    case "progress": loadAdminProgress(); break;
    case "audit": loadAdminAudit(); break;
    case "ledger": loadAdminLedger(); break;
    case "events": loadAdminEvents(); break;
  }
}

async function loadAdminCourses() {
  const el = qs("#courses-list-admin");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/courses`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>ID</th><th>Slug</th><th>Title</th><th>Status</th></tr>${
    (data.courses || []).map(c => `<tr><td>${escapeHtml(c.id)}</td><td>${escapeHtml(c.slug)}</td><td>${escapeHtml(c.title)}</td><td>${escapeHtml(c.status)}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminModules() {
  const el = qs("#modules-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/modules`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>ID</th><th>Course ID</th><th>Title</th><th>Position</th></tr>${
    (data.modules || []).map(m => `<tr><td>${escapeHtml(m.id)}</td><td>${escapeHtml(m.course_id)}</td><td>${escapeHtml(m.title)}</td><td>${m.position}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminTopics() {
  const el = qs("#topics-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/topics`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>ID</th><th>Module ID</th><th>Slug</th><th>Title</th></tr>${
    (data.topics || []).map(t => `<tr><td>${escapeHtml(t.id)}</td><td>${escapeHtml(t.module_id)}</td><td>${escapeHtml(t.slug)}</td><td>${escapeHtml(t.title)}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminLessons() {
  const el = qs("#lessons-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/lessons`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>ID</th><th>Topic ID</th><th>Slug</th><th>Title</th><th>Status</th></tr>${
    (data.lessons || []).map(l => `<tr><td>${escapeHtml(l.id)}</td><td>${escapeHtml(l.topic_id)}</td><td>${escapeHtml(l.slug)}</td><td>${escapeHtml(l.title)}</td><td>${escapeHtml(l.status)}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminAssets() {
  const el = qs("#assets-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/assets`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>ID</th><th>Type</th><th>Title</th><th>Path</th></tr>${
    (data.assets || []).map(a => `<tr><td>${escapeHtml(a.id)}</td><td>${escapeHtml(a.asset_type)}</td><td>${escapeHtml(a.title)}</td><td>${escapeHtml(a.storage_path)}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminUsers() {
  const el = qs("#users-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/users`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>Email</th><th>Name</th><th>Status</th><th>Roles</th></tr>${
    (data.users || []).map(u => `<tr><td>${escapeHtml(u.email)}</td><td>${escapeHtml(u.full_name)}</td><td>${escapeHtml(u.status)}</td><td>${escapeHtml(u.roles_json)}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminProgress() {
  const el = qs("#progress-list");
  if (!el) return;
  const courseId = qs("#progress-course-filter")?.value || "";
  const userId = qs("#progress-user-filter")?.value || "";
  let url = `${API_BASE}/api/admin/progress`;
  const params = [];
  if (courseId) params.push("course_id=" + encodeURIComponent(courseId));
  if (userId) params.push("user_id=" + encodeURIComponent(userId));
  if (params.length) url += "?" + params.join("&");
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(url);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>User</th><th>Course</th><th>Status</th><th>%</th></tr>${
    (data.progress || []).map(p => `<tr><td>${escapeHtml(p.email)}</td><td>${escapeHtml(p.course_id)}</td><td>${escapeHtml(p.status)}</td><td>${p.progress_percent}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminAudit() {
  const el = qs("#audit-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/audit`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr>${
    (data.audit_logs || []).map(a => `<tr><td>${a.created_at}</td><td>${escapeHtml(a.actor_email || a.actor_user_id)}</td><td>${escapeHtml(a.action_type)}</td><td>${escapeHtml(a.target_type)}:${escapeHtml(a.target_id)}</td><td>${escapeHtml(a.details_json)}</td></tr>`).join("")
  }</table>`;
}

async function loadAdminLedger() {
  const el = qs("#ledger-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/ledger`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>Type</th><th>Actor</th><th>Target</th><th>Prev Hash</th><th>Current Hash</th></tr>${
    (data.ledger_events || []).map(e => `<tr><td>${escapeHtml(e.event_type)}</td><td>${escapeHtml(e.actor_user_id || "")}</td><td>${escapeHtml(e.target_type)}:${escapeHtml(e.target_id)}</td><td style="font-size:11px">${escapeHtml((e.previous_hash || "").slice(0, 20))}...</td><td style="font-size:11px">${escapeHtml((e.current_hash || "").slice(0, 20))}...</td></tr>`).join("")
  }</table>`;
}

async function verifyLedger() {
  const el = qs("#ledger-verify-result");
  if (!el) return;
  el.textContent = "Đang xác minh...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/ledger/verify`, { method: "POST" });
  el.textContent = JSON.stringify(data, null, 2);
}

function showCourseForm() {
  const area = qs("#course-form-area");
  if (!area) return;
  area.innerHTML = `
    <div class="card">
      <h3>New Course</h3>
      <div class="admin-form">
        <div class="field-row"><label class="field-label">Slug</label><input id="cf-slug" class="field-input" value="khoa-hoc-moi" /></div>
        <div class="field-row"><label class="field-label">Title</label><input id="cf-title" class="field-input" value="Khóa học mới" /></div>
        <div class="field-row"><label class="field-label">Description</label><textarea id="cf-desc" class="field-input" rows="2"></textarea></div>
        <div class="field-row"><label class="field-label">Level</label>
          <select id="cf-level" class="field-input"><option value="basic">Basic</option><option value="advanced">Advanced</option></select>
        </div>
        <div class="field-row"><label class="field-label">Visibility</label>
          <select id="cf-vis" class="field-input"><option value="members">Members</option><option value="public">Public</option></select>
        </div>
        <button class="btn" onclick="createCourse()">Create</button>
      </div>
    </div>
  `;
}

async function createCourse() {
  const slug = qs("#cf-slug")?.value;
  const title = qs("#cf-title")?.value;
  const desc = qs("#cf-desc")?.value;
  const level = qs("#cf-level")?.value;
  const vis = qs("#cf-vis")?.value;
  const { data } = await fetchJson(`${API_BASE}/api/admin/courses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, title, short_description: desc, level, visibility: vis })
  });
  adminMsg(data?.ok ? "Course created!" : "Error: " + (data?.error || "Unknown"), data?.ok);
  loadAdminCourses();
}

function showModuleForm() {
  const area = qs("#module-form-area");
  if (!area) return;
  area.innerHTML = `
    <div class="card">
      <h3>New Module</h3>
      <div class="admin-form">
        <div class="field-row"><label class="field-label">Course ID</label><input id="mf-course" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Title</label><input id="mf-title" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Position</label><input id="mf-pos" class="field-input" type="number" value="1" /></div>
        <button class="btn" onclick="createModule()">Create</button>
      </div>
    </div>
  `;
}

async function createModule() {
  const course_id = qs("#mf-course")?.value;
  const title = qs("#mf-title")?.value;
  const position = parseInt(qs("#mf-pos")?.value || "1");
  const { data } = await fetchJson(`${API_BASE}/api/admin/modules`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ course_id, title, position })
  });
  adminMsg(data?.ok ? "Module created!" : "Error: " + (data?.error || "Unknown"), data?.ok);
  loadAdminModules();
}

function showTopicForm() {
  const area = qs("#topic-form-area");
  if (!area) return;
  area.innerHTML = `
    <div class="card">
      <h3>New Topic</h3>
      <div class="admin-form">
        <div class="field-row"><label class="field-label">Module ID</label><input id="tf-module" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Slug</label><input id="tf-slug" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Title</label><input id="tf-title" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Position</label><input id="tf-pos" class="field-input" type="number" value="1" /></div>
        <button class="btn" onclick="createTopic()">Create</button>
      </div>
    </div>
  `;
}

async function createTopic() {
  const module_id = qs("#tf-module")?.value;
  const slug = qs("#tf-slug")?.value;
  const title = qs("#tf-title")?.value;
  const position = parseInt(qs("#tf-pos")?.value || "1");
  const { data } = await fetchJson(`${API_BASE}/api/admin/topics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ module_id, slug, title, position })
  });
  adminMsg(data?.ok ? "Topic created!" : "Error: " + (data?.error || "Unknown"), data?.ok);
  loadAdminTopics();
}

function showLessonForm() {
  const area = qs("#lesson-form-area");
  if (!area) return;
  area.innerHTML = `
    <div class="card">
      <h3>New Lesson</h3>
      <div class="admin-form">
        <div class="field-row"><label class="field-label">Topic ID</label><input id="lf-topic" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Slug</label><input id="lf-slug" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Title</label><input id="lf-title" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Position</label><input id="lf-pos" class="field-input" type="number" value="1" /></div>
        <div class="field-row"><label class="field-label">Content (MD)</label><textarea id="lf-content" class="field-input" rows="4"></textarea></div>
        <button class="btn" onclick="createLesson()">Create</button>
      </div>
    </div>
  `;
}

async function createLesson() {
  const topic_id = qs("#lf-topic")?.value;
  const slug = qs("#lf-slug")?.value;
  const title = qs("#lf-title")?.value;
  const position = parseInt(qs("#lf-pos")?.value || "1");
  const content_md = qs("#lf-content")?.value || "";
  const { data } = await fetchJson(`${API_BASE}/api/admin/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic_id, slug, title, position, content_md, status: "published" })
  });
  adminMsg(data?.ok ? "Lesson created!" : "Error: " + (data?.error || "Unknown"), data?.ok);
  loadAdminLessons();
}

function showAssetForm() {
  const area = qs("#asset-form-area");
  if (!area) return;
  area.innerHTML = `
    <div class="card">
      <h3>Register Asset</h3>
      <div class="admin-form">
        <div class="field-row"><label class="field-label">Title</label><input id="af-title" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Storage Path</label><input id="af-path" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Type</label>
          <select id="af-type" class="field-input"><option value="document">Document</option><option value="video">Video</option><option value="audio">Audio</option><option value="image">Image</option></select>
        </div>
        <div class="field-row"><label class="field-label">MIME</label><input id="af-mime" class="field-input" value="application/pdf" /></div>
        <button class="btn" onclick="createAsset()">Register</button>
      </div>
      <hr style="margin:16px 0;border-color:var(--line)">
      <h3>Upload to R2</h3>
      <p class="muted">First get upload URL, then PUT file, then register above.</p>
      <div class="admin-form" style="flex-direction:row;gap:8px">
        <input id="af-filename" class="field-input" placeholder="filename.pdf" />
        <button class="btn" onclick="getUploadUrl()">Get Upload URL</button>
      </div>
      <pre id="af-upload-result" class="output" style="margin-top:8px"></pre>
    </div>
  `;
}

async function createAsset() {
  const title = qs("#af-title")?.value;
  const storage_path = qs("#af-path")?.value;
  const asset_type = qs("#af-type")?.value;
  const mime_type = qs("#af-mime")?.value;
  const { data } = await fetchJson(`${API_BASE}/api/admin/assets/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, storage_path, asset_type, mime_type })
  });
  adminMsg(data?.ok ? "Asset registered!" : "Error: " + (data?.error || "Unknown"), data?.ok);
  loadAdminAssets();
}

async function getUploadUrl() {
  const el = qs("#af-upload-result");
  if (!el) return;
  const filename = qs("#af-filename")?.value || "file.pdf";
  el.textContent = "Đang xin URL...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/assets/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename })
  });
  el.textContent = JSON.stringify(data, null, 2);
}

async function loadAdminEvents() {
  const el = qs("#events-list");
  if (!el) return;
  el.innerHTML = "Đang tải...";
  const { data } = await fetchJson(`${API_BASE}/api/admin/events`);
  if (!data?.ok) { el.innerHTML = "Lỗi tải."; return; }
  el.innerHTML = `<table class="admin-table"><tr><th>Slug</th><th>Title</th><th>Type</th><th>Starts</th><th>Status</th></tr>${
    (data.events || []).map(e => `<tr><td>${escapeHtml(e.slug)}</td><td>${escapeHtml(e.title)}</td><td>${escapeHtml(e.event_type)}</td><td>${e.starts_at}</td><td>${escapeHtml(e.status)}</td></tr>`).join("")
  }</table>`;
}

function showEventForm() {
  const area = qs("#event-form-area");
  if (!area) return;
  area.innerHTML = `
    <div class="card">
      <h3>New Event</h3>
      <div class="admin-form">
        <div class="field-row"><label class="field-label">Slug</label><input id="ef-slug" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Title</label><input id="ef-title" class="field-input" /></div>
        <div class="field-row"><label class="field-label">Type</label>
          <select id="ef-type" class="field-input"><option value="live">Live</option><option value="online">Online</option></select>
        </div>
        <div class="field-row"><label class="field-label">Start (unix ts)</label><input id="ef-start" class="field-input" type="number" /></div>
        <div class="field-row"><label class="field-label">Location</label><input id="ef-loc" class="field-input" /></div>
        <button class="btn" onclick="createEvent()">Create</button>
      </div>
    </div>
  `;
}

async function createEvent() {
  const slug = qs("#ef-slug")?.value;
  const title = qs("#ef-title")?.value;
  const event_type = qs("#ef-type")?.value;
  const starts_at = parseInt(qs("#ef-start")?.value || "0");
  const location_text = qs("#ef-loc")?.value;
  const { data } = await fetchJson(`${API_BASE}/api/admin/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug, title, event_type, starts_at, location_text, status: "published" })
  });
  adminMsg(data?.ok ? "Event created!" : "Error: " + (data?.error || "Unknown"), data?.ok);
  loadAdminEvents();
}

document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  loadAdminCourses();
});
