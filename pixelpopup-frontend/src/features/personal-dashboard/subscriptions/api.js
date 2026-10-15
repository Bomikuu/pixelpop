export const servicePath = (id, suffix = "") => `subscriptions/${id ? `${id}/` : ""}${suffix}`;
export async function downloadExport(dashboard, path) {
  const { blob, filename } = await dashboard.request(path, { download: true });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "subscriptions.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
