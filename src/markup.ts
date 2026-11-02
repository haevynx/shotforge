// Minimal markup for headlines:
//   *keyword*   → emphasis, styled by the theme (color / italic)
//   **phrase**  → bold
//   newline     → <br>
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function inline(text: string | undefined): string {
  if (!text) return '';
  return escapeHtml(text)
    .replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([\s\S]+?)\*/g, '<em>$1</em>')
    .replace(/\r?\n/g, '<br>');
}
