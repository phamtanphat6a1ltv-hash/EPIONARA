import { useToastContext } from "../context/ToastContext.jsx";

export function useToast() {
  const context = useToastContext();
  return {
    toasts: context.toasts,
    toast: context.addToast,
    success: context.success,
    error: context.error,
    info: context.info,
    warning: context.warning,
    dismiss: context.dismiss,
  };
}
