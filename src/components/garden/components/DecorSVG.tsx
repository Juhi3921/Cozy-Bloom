import { DecorKind, DECOR_INFO } from "../types";

interface DecorSVGProps {
  kind: DecorKind;
  size?: number;
}

export function DecorSVG({ kind, size = 64 }: DecorSVGProps) {
  return (
    <div style={{ fontSize: size * 0.85, lineHeight: 1 }} className="pixel-shadow select-none">
      {DECOR_INFO[kind].emoji}
    </div>
  );
}
