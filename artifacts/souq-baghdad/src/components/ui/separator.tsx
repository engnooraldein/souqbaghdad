// ===========================================
// مسؤولية هذا الملف:
// مكوّن UI من مكتبة shadcn/ui (separator).
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
// تم توليده تلقائياً ويُنصح بعدم تعديله مباشرة.
// استخدمه عبر الـ Props الموثقة في shadcn/ui.
// ===========================================
import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
