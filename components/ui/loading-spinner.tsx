import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div className="flex items-center justify-center">
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-current border-t-transparent text-gray-900',
          sizeClasses[size],
          className
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}

export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center">
      <LoadingSpinner size="lg" />
      {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
