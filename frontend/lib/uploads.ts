/**
 * Utility to construct the correct URL for uploaded images (profile photos, etc.).
 * Strips the /api/v1 suffix from the API base URL and appends /uploads/.
 */
export function getUploadUrl(relativePath: string): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
  const base = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${base}/uploads/${relativePath}`;
}
