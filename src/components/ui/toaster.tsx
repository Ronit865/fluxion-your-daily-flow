import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { Link, Check, AlertTriangle, X } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  const getIcon = (variant?: string) => {
    switch (variant) {
      case "info":
        return <Link className="h-5 w-5" />;
      case "success":
        return <Check className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "destructive":
        return <X className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getIconBgColor = (variant?: string) => {
    switch (variant) {
      case "info":
        return "bg-blue-500 text-white";
      case "success":
        return "bg-emerald-500 text-white";
      case "warning":
        return "bg-amber-500 text-white";
      case "destructive":
        return "bg-rose-500 text-white";
      default:
        return "bg-slate-600 text-white";
    }
  };

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getIcon(variant);
        const iconBgColor = getIconBgColor(variant);
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-4 flex-1">
              {icon && (
                <div className={`flex-shrink-0 rounded-lg p-2.5 text-white ${iconBgColor}`}>
                  {icon}
                </div>
              )}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
