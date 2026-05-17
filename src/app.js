import { renderToolRows } from "/render-tools.mjs";

const tbody = document.getElementById("ide-rows");
const sortSelect = document.getElementById("sort");
const dataScript = document.getElementById("tools-data");

let tools = [];
try {
  tools = JSON.parse(dataScript.textContent) || [];
} catch (error) {
  console.error("Failed to parse embedded tools data", error);
  tbody.innerHTML = `<tr><td colspan="7" class="px-6 py-12 text-center text-red-400">Failed to load data.</td></tr>`;
}

if (tools.length) {
  sortSelect.addEventListener("change", () => {
    tbody.innerHTML = renderToolRows(tools, sortSelect.value);
  });
}
