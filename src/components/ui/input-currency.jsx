import React from 'react';
import { Input } from '@/components/ui/input';

export const formatCurrency = (value) => {
  if (!value && value !== 0) return '';
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\D/g, '')) / 100 : value;
  return numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const parseCurrency = (value) => {
  if (!value) return 0;
  const cleanValue = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanValue) || 0;
};

export const InputCurrency = ({ value, onChange, ...props }) => {
  const [displayValue, setDisplayValue] = React.useState('');

  React.useEffect(() => {
    if (value || value === 0) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value.replace(/\D/g, '');
    const numericValue = inputValue ? parseFloat(inputValue) / 100 : 0;
    
    setDisplayValue(formatCurrency(numericValue));
    
    onChange({
      ...e,
      target: {
        ...e.target,
        value: numericValue,
      },
    });
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      className={`text-right ${props.className || ''}`}
    />
  );
};