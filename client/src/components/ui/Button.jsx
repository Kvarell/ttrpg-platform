export default function Button({ 
  children, 
  isLoading, 
  loadingText = "Зачекайте...", 
  type = "button", 
  disabled,
  onClick,
  variant = "primary",
  fullWidth = true,
  className = ""
}) {
  const baseStyles = "font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-white",
    secondary: "bg-[#164A41] hover:bg-[#1f5c52] text-white",
    outline: "bg-transparent border-2 border-[#164A41] text-[#164A41] hover:bg-[#164A41] hover:text-white",
    danger: "bg-transparent border-2 border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${widthClass} ${className}`}
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
