import { motion } from "framer-motion";

interface CelestialProps {
  timeOfDay: number;
}

export function Celestial({ timeOfDay }: CelestialProps) {
  const x = timeOfDay * 100;
  const y = 30 + Math.sin(timeOfDay * Math.PI) * -25;
  const isNight = timeOfDay < 0.2 || timeOfDay > 0.85;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }}
    >
      <div
        className={`w-20 h-20 rounded-full ${
          isNight
            ? "bg-linear-to-br from-slate-100 to-slate-300"
            : "bg-linear-to-br from-yellow-200 to-orange-400"
        }`}
        style={{
          boxShadow: isNight
            ? "0 0 60px rgba(200,220,255,0.6)"
            : "0 0 80px rgba(255,200,100,0.7)",
        }}
      />
    </motion.div>
  );
}
