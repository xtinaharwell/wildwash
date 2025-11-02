type SpinnerProps = {
  className?: string;
};

export default function Spinner({ className = "" }: SpinnerProps) {
  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`} 
      role="status" 
      aria-label="Loading"
    >
      <svg 
        className="animate-spin text-red-600"
        style={{ width: '100%', height: '100%' }} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}