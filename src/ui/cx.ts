/** Join truthy class names. Tolerates the `string | undefined` from CSS-module access. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
