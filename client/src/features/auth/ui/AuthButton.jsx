export default function AuthButton({ 
    children, 
    isLoading, 
    loadingText = "Зачекайте...", 
    type = "submit", 
    disabled,
    onClick
  }) {
    return (
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className="w-full bg-[#F1B24A] hover:bg-[#4D774E] text-[#164A41] hover:text-[#FFFFFF] font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? loadingText : children}
      </button>
    );
  }