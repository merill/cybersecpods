import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface InactiveBadgeProps {
  className?: string
}

export function InactiveBadge({ className }: InactiveBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-amber-600/50 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        className
      )}
    >
      Inactive
    </Badge>
  )
}
