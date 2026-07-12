// ===========================================
// مسؤولية هذا الملف:
// مكوّن UI من مكتبة shadcn/ui (spinner).
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
// تم توليده تلقائياً ويُنصح بعدم تعديله مباشرة.
// استخدمه عبر الـ Props الموثقة في shadcn/ui.
// ===========================================
import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
