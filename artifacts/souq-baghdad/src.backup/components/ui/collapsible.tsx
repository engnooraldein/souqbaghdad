// ===========================================
// مسؤولية هذا الملف:
// مكوّن UI من مكتبة shadcn/ui (collapsible).
//
// لا يتصل بـ Supabase. مكوّن UI بحت.
// تم توليده تلقائياً ويُنصح بعدم تعديله مباشرة.
// استخدمه عبر الـ Props الموثقة في shadcn/ui.
// ===========================================
"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
