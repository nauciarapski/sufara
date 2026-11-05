/**
 * Formatting and small data helpers. Import these instead of writing your own:
 * a formatter that exists cannot be "not a function" at runtime.
 */

export function formatCurrency(value, currency = "EUR", locale = "hr-HR") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(number);
}

export function formatNumber(value, locale = "hr-HR", maximumFractionDigits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(number);
}

export function formatPercent(value, locale = "hr-HR", maximumFractionDigits = 1) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits }).format(number);
}

export function formatDate(value, locale = "hr-HR") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(value, locale = "hr-HR") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatRelative(value, now = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat("hr-HR", { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(seconds, "second");
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

export function groupBy(rows, key) {
  return (rows || []).reduce((groups, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    const bucket = groups[value] || (groups[value] = []);
    bucket.push(row);
    return groups;
  }, {});
}

export function sumBy(rows, key) {
  return (rows || []).reduce((total, row) => {
    const value = Number(typeof key === "function" ? key(row) : row[key]);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function sortBy(rows, key, direction = "asc") {
  const factor = direction === "desc" ? -1 : 1;
  return [...(rows || [])].sort((a, b) => {
    const left = typeof key === "function" ? key(a) : a[key];
    const right = typeof key === "function" ? key(b) : b[key];
    if (left === right) return 0;
    if (left === null || left === undefined) return 1;
    if (right === null || right === undefined) return -1;
    if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
    return String(left).localeCompare(String(right)) * factor;
  });
}

export function uid(prefix = "id") {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function toCsv(rows, columns) {
  if (!rows || rows.length === 0) return "";
  const keys = columns && columns.length > 0 ? columns : Object.keys(rows[0]);
  const escape = (value) => '"' + String(value === null || value === undefined ? "" : value).replace(/"/g, '""') + '"';
  return [keys.join(","), ...rows.map((row) => keys.map((key) => escape(row[key])).join(","))].join("\n");
}

export function downloadCsv(fileName, rows, columns) {
  const csv = toCsv(rows, columns);
  if (!csv) return false;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : fileName + ".csv";
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
