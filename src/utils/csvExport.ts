/**
 * Reusable utility to escape cell values, generate CSV content,
 * and download files securely in the browser.
 */

/**
 * Escapes a single cell value for a CSV row.
 * Wraps values in double quotes if they contain commas, quotes, or newlines,
 * and doubles any internal double quotes.
 */
export function escapeCSVCell(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Combines headers and rows into a formatted CSV string.
 */
export function generateCSV(headers: string[], dataRows: any[][]): string {
  const headerRow = headers.map(escapeCSVCell).join(",");
  const bodyRows = dataRows.map(row => row.map(escapeCSVCell).join(","));
  return [headerRow, ...bodyRows].join("\n");
}

/**
 * Triggers a browser download of CSV content using a Blob and temporary URL.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
