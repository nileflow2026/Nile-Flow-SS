const UploadProgressBar = ({ label = "Uploading..." }) => {
  return (
    <div className="flex flex-col items-center py-4 space-y-3">
      {/* Animated progress bar */}
      <div className="w-full max-w-xs bg-amber-100 rounded-full h-3 overflow-hidden border border-amber-300">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse"
          style={{
            width: "70%",
            animation: "progressPulse 1.5s ease-in-out infinite",
          }}
        />
      </div>
      {/* Label */}
      <div className="flex items-center space-x-2">
        <svg
          className="animate-spin h-4 w-4 text-amber-600"
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
        <span className="text-sm font-medium text-amber-700">{label}</span>
      </div>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes progressPulse {
          0%, 100% {
            width: 30%;
            margin-left: 0;
          }
          50% {
            width: 80%;
            margin-left: 10%;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadProgressBar;
