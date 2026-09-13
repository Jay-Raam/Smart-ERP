import { useState, useCallback } from 'react';
import { GST_STATE_CODE_MAP } from './indiaStates';

export interface ValidationRule<T = any> {
  validate: (value: any, allValues?: T) => boolean | string;
  message: string;
}

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T>[];
};

export type FormErrors<T> = Partial<Record<keyof T, string>>;
export type FormTouched<T> = Partial<Record<keyof T, boolean>>;

// Strict Indian GSTIN regular expression
// Format: 2 digits (State Code) + 5 letters (PAN) + 4 digits (PAN) + 1 letter (PAN) + 1 alphanumeric (entity) + 'Z' + 1 checksum
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

/**
 * Validate Indian GSTIN format and optional state code consistency
 */
export function isValidGSTIN(gstin?: string | null, stateName?: string | null): { valid: boolean; error?: string } {
  if (!gstin || !gstin.trim()) {
    return { valid: true }; // optional if empty, or handled by required rule
  }
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) {
    return { valid: false, error: 'GSTIN must be exactly 15 alphanumeric characters' };
  }
  if (!GSTIN_REGEX.test(clean)) {
    return { valid: false, error: 'Invalid GSTIN format (e.g. 33AAACB1234P1Z1)' };
  }

  // Cross check state code if state provided
  if (stateName && GST_STATE_CODE_MAP[stateName]) {
    const expectedCode = GST_STATE_CODE_MAP[stateName].code;
    const actualCode = clean.slice(0, 2);
    if (actualCode !== expectedCode) {
      return {
        valid: false,
        error: `GSTIN state code prefix (${actualCode}) does not match selected state ${stateName} (${expectedCode})`,
      };
    }
  }

  return { valid: true };
}

/**
 * Validate positive quantity (> 0)
 */
export function isValidQuantity(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num > 0;
}

/**
 * Validate credit limit (> 10000)
 */
export function isValidCreditLimit(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num > 10000;
}

/**
 * Universal React Hook for 3-tier form validation:
 * 1. onChange: validate current field, clear error immediately when valid
 * 2. onBlur: trigger comprehensive validation on the blurred field
 * 3. finalSubmit: validate ALL fields + business logic before API submission
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  schema: ValidationSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouched] = useState<FormTouched<T>>({});

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, val: any, currentValues: T): string => {
      const rules = schema[field];
      if (!rules || rules.length === 0) return '';

      for (const rule of rules) {
        const result = rule.validate(val, currentValues);
        if (typeof result === 'string') {
          return result;
        }
        if (!result) {
          return rule.message;
        }
      }
      return '';
    },
    [schema]
  );

  // Handle onChange
  const handleChange = useCallback(
    (field: keyof T, val: any) => {
      const newValues = { ...values, [field]: val };
      setValues(newValues);

      // If field already has an error, re-validate onChange to clear it immediately when fixed
      if (errors[field]) {
        const err = validateField(field, val, newValues);
        setErrors((prev) => ({ ...prev, [field]: err }));
      }
    },
    [values, errors, validateField]
  );

  // Handle onBlur
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const err = validateField(field, values[field], values);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [values, validateField]
  );

  // Set single field error manually (e.g. from backend response)
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  // Validate all fields before submit
  const validateAll = useCallback((): { isValid: boolean; errors: FormErrors<T> } => {
    const newErrors: FormErrors<T> = {};
    let valid = true;

    for (const key of Object.keys(schema) as (keyof T)[]) {
      const err = validateField(key, values[key], values);
      if (err) {
        newErrors[key] = err;
        valid = false;
      }
    }

    setErrors(newErrors);
    // Mark all fields touched
    const allTouched: FormTouched<T> = {};
    for (const key of Object.keys(schema) as (keyof T)[]) {
      allTouched[key] = true;
    }
    setTouched(allTouched);

    return { isValid: valid, errors: newErrors };
  }, [schema, values, validateField]);

  // Reset form
  const resetForm = useCallback(
    (newValues?: T) => {
      setValues(newValues || initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues]
  );

  return {
    values,
    setValues,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    setFieldError,
    resetForm,
  };
}
