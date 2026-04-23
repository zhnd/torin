import { useState } from 'react';

interface UseServiceInput {
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
}

export function useService({ defaultChecked, onChange }: UseServiceInput) {
  const [on, setOn] = useState(!!defaultChecked);

  function toggle() {
    const next = !on;
    setOn(next);
    onChange?.(next);
  }

  return { on, toggle };
}
