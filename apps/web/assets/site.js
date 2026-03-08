const output = document.getElementById("output");
const healthBtn = document.getElementById("healthBtn");

// Thay domain này sau khi deploy worker xong
const API_BASE = "https://tueban-api.<your-subdomain>.workers.dev";

async function callHealth() {
  output.textContent = "Đang kiểm tra kết nối API...";

  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: "GET"
    });

    const data = await res.json();
    output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    output.textContent = `Lỗi kết nối API: ${String(error)}`;
  }
}

if (healthBtn) {
  healthBtn.addEventListener("click", callHealth);
}
