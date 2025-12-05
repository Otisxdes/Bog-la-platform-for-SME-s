import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ className, size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)}
      aria-label="Loading"
    />
  )
}

export function LoadingPage({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="inline-flex items-center gap-2 rounded-md bg-muted px-4 py-2">
        <LoadingSpinner size="md" />
        <span className="text-sm text-muted-foreground">
          {message || 'Loading...'}
        </span>
      </div>
    </div>
  )
}
