const Arrow = ({ className = "w-6 h-6", direction = "down-right" }) => {
  const rotations = {
    "down-right": "rotate-0",
    "down-left": "rotate-90",
    "top-left": "rotate-180",
    "top-right": "-rotate-90",
    "right": "-rotate-45",
    "down": "rotate-45",
    "left": "rotate-[135deg]",
    "up": "-rotate-[135deg]",
  };

  const combinedClassName = `${className} ${rotations[direction] || ""} transition-transform duration-200`;

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
      className={combinedClassName}
      aria-hidden="true"
    >
      <path d="M3 3L21 21M21 11v10H11" />
    </svg>
  );
};

export default Arrow;