import { OFFSHORE_SPORTSBOOKS, US_SPORTSBOOKS } from '../../constants/sportsbooks';
import { ChevronDown } from 'lucide-react';

interface SportsbookSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
}

export function SportsbookSelect({ value, onChange, label, id }: SportsbookSelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="select-field pr-10"
        >
          <option value="">Select Sportsbook</option>
          <optgroup label="Offshore">
            {OFFSHORE_SPORTSBOOKS.map((book) => (
              <option key={book} value={book}>
                {book}
              </option>
            ))}
          </optgroup>
          <optgroup label="US-Based / Social">
            {US_SPORTSBOOKS.map((book) => (
              <option key={book} value={book}>
                {book}
              </option>
            ))}
          </optgroup>
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
