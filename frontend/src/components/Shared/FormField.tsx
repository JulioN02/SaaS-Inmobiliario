/* =============================================================================
   SaaS Inmobiliario — FormField
   Campo de formulario genérico que envuelve react-hook-form
   Soporta: input, select, textarea, date
   ============================================================================= */

import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import styles from './FormField.module.css';

interface BaseFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

interface InputFieldProps extends BaseFieldProps, Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: string;
  as?: 'input';
}

interface SelectFieldProps extends BaseFieldProps, SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select';
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

interface TextareaFieldProps extends BaseFieldProps, TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

export type FormFieldProps = InputFieldProps | SelectFieldProps | TextareaFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, error, hint, required, as = 'input', ...rest } = props;
  const id = (props as { id?: string }).id ?? (props as { name?: string }).name;

  return (
    <div className={`${styles.field} ${error ? styles.hasError : ''}`}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      {as === 'select' ? (
        <>
          <select
            id={id}
            className={styles.select}
            {...(rest as SelectFieldProps)}
          >
            {(props as SelectFieldProps).placeholder && (
              <option value="">
                {(props as SelectFieldProps).placeholder}
              </option>
            )}
            {(props as SelectFieldProps).options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </>
      ) : as === 'textarea' ? (
        <textarea
          id={id}
          className={styles.textarea}
          {...(rest as TextareaFieldProps)}
        />
      ) : (
        <input
          id={id}
          className={styles.input}
          type={(props as InputFieldProps).type ?? 'text'}
          {...(rest as InputFieldProps)}
        />
      )}

      {error && <p className={styles.error}>{error}</p>}
      {!error && hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}