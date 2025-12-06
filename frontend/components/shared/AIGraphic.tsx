"use client";

export default function AIGraphic() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-black overflow-hidden">
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 blur-xl"></div>
      
      {/* Circuit board pattern background */}
      <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1.5" fill="#3b82f6" opacity="0.6" />
            <path d="M20 0 L20 20 M0 20 L20 20" stroke="#3b82f6" strokeWidth="0.5" opacity="0.4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>

      {/* Scattered blue dots */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-blue-400 animate-pulse"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${Math.random() * 2 + 1}s`,
            }}
          />
        ))}
      </div>

      {/* Neon laser lines */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <line
          x1="10%"
          y1="50%"
          x2="90%"
          y2="50%"
          stroke="#00f0ff"
          strokeWidth="2"
          opacity="0.8"
          className="animate-pulse"
        />
        <line
          x1="45%"
          y1="20%"
          x2="55%"
          y2="80%"
          stroke="#00f0ff"
          strokeWidth="2"
          opacity="0.8"
          className="animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </svg>

      {/* AI Letters - 3D effect */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="text-8xl md:text-9xl font-black tracking-tighter">
            <span
              className="inline-block text-transparent bg-clip-text bg-gradient-to-br from-gray-300 via-gray-100 to-white"
              style={{
                textShadow: `
                  0 0 10px rgba(147, 51, 234, 0.5),
                  0 0 20px rgba(147, 51, 234, 0.3),
                  0 0 30px rgba(147, 51, 234, 0.2),
                  2px 2px 4px rgba(0, 0, 0, 0.8),
                  4px 4px 8px rgba(0, 0, 0, 0.6)
                `,
                filter: "drop-shadow(0 0 8px rgba(147, 51, 234, 0.6))",
                transform: "perspective(500px) rotateY(-5deg)",
              }}
            >
              AI
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
}

