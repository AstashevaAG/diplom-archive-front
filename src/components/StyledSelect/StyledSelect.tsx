import * as Select from '@radix-ui/react-select';
import type { CSSProperties, ReactNode } from 'react';
import styles from './StyledSelect.module.css';

export interface StyledSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface StyledSelectProps {
  options: StyledSelectOption[];
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function StyledSelect({
  options,
  value,
  onChange,
  id,
  className,
  style,
  placeholder = 'Выберите значение',
  disabled,
  ariaLabel,
}: StyledSelectProps): ReactNode {
  const selectedValue = value || undefined;

  return (
    <Select.Root value={selectedValue} onValueChange={onChange} disabled={disabled}>
      <Select.Trigger
        id={id}
        className={[styles.trigger, className].filter(Boolean).join(' ')}
        style={style}
        aria-label={ariaLabel}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className={styles.icon}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className={styles.content} position="popper" sideOffset={6}>
          <Select.Viewport className={styles.viewport}>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                className={styles.item}
                value={option.value}
                disabled={option.disabled}
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator className={styles.indicator}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
