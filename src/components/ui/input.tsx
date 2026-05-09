import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-input/50 bg-background/50 px-3.5 py-2 text-base transition-all duration-300 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:ring-3 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-white/[0.02] dark:border-white/[0.06] dark:focus-visible:bg-white/[0.04]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
