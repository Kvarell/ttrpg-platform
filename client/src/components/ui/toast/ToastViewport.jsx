import useToastStore from '@/stores/useToastStore';
import ToastItem from './ToastItem';

export default function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);

  if (!toasts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
