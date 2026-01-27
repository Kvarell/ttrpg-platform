// Re-export Button for backward compatibility
import Button from '@/components/ui/Button';

export default function AuthButton({ 
  children, 
  isLoading, 
  loadingText = "Зачекайте...", 
  type = "submit", 
  disabled,
  onClick
}) {
  return (
    <Button
      type={type}
      isLoading={isLoading}
      loadingText={loadingText}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}