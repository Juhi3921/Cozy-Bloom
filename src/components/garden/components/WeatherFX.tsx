import { motion } from "framer-motion";
import { Weather } from "../types";

interface WeatherFXProps {
  weather: Weather;
}

export function WeatherFX({ weather }: WeatherFXProps) {
  if (weather === "rain") {
    const drops = Array.from({ length: 50 });
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {drops.map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-linear-to-b from-blue-200/70 to-blue-400/40 rounded-full"
            style={{ left: `${Math.random() * 100}%`, top: -10, width: 1.5, height: 14 }}
            animate={{ y: ["0vh", "110vh"] }}
            transition={{
              duration: 0.6 + Math.random() * 0.4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear",
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}
