import {
  getPrimaryTools,
  renderOsFilterOptions,
  renderToolRows,
} from "/render-tools.mjs";

const tbody = document.getElementById("ide-rows");
const sortSelect = document.getElementById("sort");
const osSelect = document.getElementById("os-filter");
const dataScript = document.getElementById("tools-data");

let tools = [];
try {
  tools = JSON.parse(dataScript.textContent) || [];
} catch (error) {
  console.error("Failed to parse embedded tools data", error);
  tbody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-red-400">Failed to load data.</td></tr>`;
}

const primaryTools = getPrimaryTools(tools);

if (primaryTools.length) {
  osSelect.innerHTML = renderOsFilterOptions(primaryTools, osSelect.value);

  const renderRows = () => {
    tbody.innerHTML = renderToolRows(primaryTools, sortSelect.value, osSelect.value);
  };

  sortSelect.addEventListener("change", renderRows);
  osSelect.addEventListener("change", renderRows);
}
