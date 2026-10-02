// Tombol serbaguna dengan beberapa varian gaya.
const VARIANTS = {
  primary:
    'bg-primary-container text-on-primary-container hover:opacity-90 shadow-lg',
  secondary:
    'bg-secondary-container text-on-secondary-container hover:opacity-90',
  outline:
    'border border-outline-variant/30 text-on-surface hover:bg-on-surface/5',
  ghost: 'text-on-surface-variant hover:bg-on-surface/5',
  danger: 'bg-error text-on-error hover:opacity-90',
}

export default function Button({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-sm rounded-lg px-lg py-sm font-h3 text-h3 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
