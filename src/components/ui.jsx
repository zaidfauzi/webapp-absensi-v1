import { cn } from '../lib/utils'

export function Button({ className, variant = 'primary', size = 'md', ...props }) {
  const variants = {
    primary: 'bg-[var(--color-primary)] text-white hover:opacity-90',
    accent: 'bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:opacity-90',
    outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-muted)]',
    ghost: 'bg-transparent hover:bg-[var(--color-muted)]',
    destructive: 'bg-[var(--color-destructive)] text-white hover:opacity-90',
  }
  const sizes = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' }
  return <button className={cn('inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:pointer-events-none', variants[variant], sizes[size], className)} {...props} />
}

export function Card({ className, children }) {
  return <div className={cn('rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-card-foreground)] shadow-sm', className)}>{children}</div>
}

export function Input({ className, ...props }) {
  return <input className={cn('h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]', className)} {...props} />
}

export function Select({ className, children, ...props }) {
  return <select className={cn('h-10 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]', className)} {...props}>{children}</select>
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn('w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-primary)]', className)} {...props} />
}

export function Badge({ className, variant = 'default', children }) {
  const v = {
    default: 'bg-[var(--color-muted)] text-[var(--color-foreground)]',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', v[variant], className)}>{children}</span>
}

export function Label({ className, children }) {
  return <label className={cn('mb-1 block text-sm font-medium', className)}>{children}</label>
}