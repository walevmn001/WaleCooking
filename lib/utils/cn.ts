/**
 * cn — ghép class có điều kiện (thay thế clsx nhẹ, không phụ thuộc thư viện ngoài).
 * Lưu ý: KHÔNG resolve xung đột Tailwind (không có tailwind-merge).
 * Component có trách nhiệm truyền class đúng thứ tự khi cần override.
 */
export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const walk = (value: ClassValue): void => {
    if (!value && value !== 0) return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    out.push(String(value));
  };

  for (const input of inputs) walk(input);
  return out.join(" ");
}
