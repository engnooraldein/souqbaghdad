// ===========================================
// مسؤولية هذا الملف:
// مكوّن UI من مكتبة shadcn/ui (skeleton).
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
// تم توليده تلقائياً ويُنصح بعدم تعديله مباشرة.
// استخدمه عبر الـ Props الموثقة في shadcn/ui.
// ===========================================
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }
