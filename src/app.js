import {
  SORTS,
  getPrimaryTools,
  renderOsFilterOptions,
  renderToolRows,
} from "/render-tools.mjs";

const tbody = document.getElementById("ide-rows");
const sortHeaders = [...document.querySelectorAll("th[data-sort]")];
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

  let sortKey = "name";
  let direction = "asc";

  const renderRows = () => {
    tbody.innerHTML = renderToolRows(primaryTools, sortKey, direction, osSelect.value);
  };

  const renderSortHeaders = () => {
    sortHeaders.forEach(header => {
      const active = header.dataset.sort === sortKey;
      const indicator = header.querySelector(".sort-indicator");
      if (active)
        header.setAttribute("aria-sort", direction === "asc" ? "ascending" : "descending");
      else
        header.removeAttribute("aria-sort");
      header.classList.toggle("text-neutral-200", active);
      indicator.textContent = active ? (direction === "asc" ? "↑" : "↓") : "";
    });
  };

  sortHeaders.forEach(header => {
    header.querySelector("button").addEventListener("click", () => {
      const key = header.dataset.sort;
      if (key === sortKey)
        direction = direction === "asc" ? "desc" : "asc";
      else {
        sortKey = key;
        direction = SORTS[key].defaultDirection;
      }
      renderSortHeaders();
      renderRows();
    });
  });

  osSelect.addEventListener("change", renderRows);
  renderSortHeaders();
}
