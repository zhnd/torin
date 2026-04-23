export interface ToggleRowProps {
  label: string;
  description?: string;
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
  last?: boolean;
}
