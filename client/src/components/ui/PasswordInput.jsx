import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ 
  id, 
  label, 
  value, 
  onChange, 
  autoComplete, 
  placeholder = '••••••••',
  required = true,
  minLength,
  inputClassName = "input",
  labelClassName = "label"
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <label htmlFor={id} className={labelClassName}>{label}</label>}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className={`${inputClassName} pr-12`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-ethereal-tertiary/40 hover:text-ethereal-tertiary transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
