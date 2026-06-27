import { FlowerKind, Stage, FLOWER_INFO } from "../types";

interface FlowerSVGProps {
  kind: FlowerKind;
  stage: Stage;
  size?: number;
}

export function FlowerSVG({ kind, stage, size = 64 }: FlowerSVGProps) {
  const info = FLOWER_INFO[kind];

  if (stage === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <ellipse cx="32" cy="56" rx="8" ry="3" fill="#000" opacity="0.15" />
        <path d="M30 54 Q32 48 34 54" stroke="#65a30d" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="52" r="3" fill="#78350f" />
      </svg>
    );
  }

  if (stage === 1) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <ellipse cx="32" cy="58" rx="10" ry="3" fill="#000" opacity="0.15" />
        <path d="M32 58 L32 38" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="26" cy="44" rx="6" ry="3" fill="#22c55e" transform="rotate(-30 26 44)" />
        <ellipse cx="38" cy="44" rx="6" ry="3" fill="#22c55e" transform="rotate(30 38 44)" />
      </svg>
    );
  }

  if (stage === 2) {
    return (
      <svg width={size} height={size} viewBox="0 0 64 64">
        <ellipse cx="32" cy="58" rx="10" ry="3" fill="#000" opacity="0.15" />
        <path d="M32 58 L32 30" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="26" cy="42" rx="6" ry="3" fill="#22c55e" transform="rotate(-30 26 42)" />
        <ellipse cx="38" cy="42" rx="6" ry="3" fill="#22c55e" transform="rotate(30 38 42)" />
        <circle cx="32" cy="26" r="6" fill={info.colors[1]} />
        <circle cx="32" cy="26" r="3" fill={info.colors[0]} />
      </svg>
    );
  }

  // Stage 3: Bloom
  const petals = Array.from({ length: info.petals });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="anim-sway">
      <ellipse cx="32" cy="60" rx="12" ry="3" fill="#000" opacity="0.18" />
      <path d="M32 60 L32 32" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="24" cy="44" rx="7" ry="3.5" fill="#22c55e" transform="rotate(-30 24 44)" />
      <ellipse cx="40" cy="44" rx="7" ry="3.5" fill="#22c55e" transform="rotate(30 40 44)" />
      {info.magical && (
        <circle cx="32" cy="22" r="14" fill={info.colors[1]} opacity="0.25">
          <animate attributeName="r" values="13;17;13" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      {petals.map((_, i) => {
        const angle = (i / info.petals) * 360;
        return (
          <ellipse
            key={i}
            cx="32"
            cy="14"
            rx="5"
            ry="8"
            fill={info.colors[0]}
            stroke={info.colors[1]}
            strokeWidth="1"
            transform={`rotate(${angle} 32 22)`}
          />
        );
      })}
      <circle cx="32" cy="22" r="4.5" fill={info.colors[1]} />
      <circle cx="31" cy="21" r="1.5" fill="white" opacity="0.7" />
    </svg>
  );
}
