import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "animate-pulse rounded-md bg-muted/80 dark:bg-muted/40",
        // Enhanced visibility in light mode with subtle gradient shimmer
        "relative overflow-hidden",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-foreground/5 after:to-transparent",
        className
      )} 
      {...props} 
    />
  );
}

export { Skeleton };
