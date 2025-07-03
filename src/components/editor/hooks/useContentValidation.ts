// Content validation hook

import { useState, useCallback } from 'react';
import { ContentValidationRule } from '@/types/editor';

export function useContentValidation(rules: ContentValidationRule[]) {
  const [errors, setErrors] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);

  const validate = useCallback((content: string) => {
    const newErrors: string[] = [];

    rules.forEach(rule => {
      switch (rule.type) {
        case 'required':
          if (!content.trim()) {
            newErrors.push(rule.message);
          }
          break;
        case 'minLength':
          if (content.length < rule.value) {
            newErrors.push(rule.message);
          }
          break;
        case 'maxLength':
          if (content.length > rule.value) {
            newErrors.push(rule.message);
          }
          break;
        case 'pattern':
          if (!new RegExp(rule.value).test(content)) {
            newErrors.push(rule.message);
          }
          break;
        case 'custom':
          if (rule.validator && !rule.validator(content)) {
            newErrors.push(rule.message);
          }
          break;
      }
    });

    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
    
    return newErrors;
  }, [rules]);

  return {
    errors,
    isValid,
    validate
  };
}