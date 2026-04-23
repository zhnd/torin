import { useState } from 'react';

export function useService() {
  const [open, setOpen] = useState<string | null>(null);

  function toggle(name: string) {
    setOpen((prev) => (prev === name ? null : name));
  }

  return { open, toggle };
}
