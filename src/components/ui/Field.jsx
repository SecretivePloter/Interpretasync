// Komponen form ringkas: label + input/select/textarea bergaya konsisten.
import { ChevronDown } from 'lucide-react'

const baseInput =
  'w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-md py-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary font-body text-body'

function Label({ children, required }) {
  return (
    <label className="font-label-tag text-label-tag text-on-surface-variant uppercase tracking-wider">
      {children} {required && <span className="text-error">*</span>}
    </label>
  )
}

export function TextInput({ label, required, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && <Label required={required}>{label}</Label>}
      <input className={baseInput} {...props} />
    </div>
  )
}

export function TextArea({ label, required, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && <Label required={required}>{label}</Label>}
      <textarea className={`${baseInput} resize-none`} rows={3} {...props} />
    </div>
  )
}

export function Select({ label, required, children, className = '', ...props }) {
  return (
    <div className={`flex flex-col gap-xs ${className}`}>
      {label && <Label required={required}>{label}</Label>}
      <div className="relative">
        <select className={`${baseInput} appearance-none pr-8`} {...props}>
          {children}
        </select>
        <ChevronDown
          size={18}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant"
        />
      </div>
    </div>
  )
}
