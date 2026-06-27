export function Hills() {
  const c1 = "#15803d";
  const c2 = "#166534";

  return (
    <svg
      className="absolute bottom-[55%] left-0 right-0 w-full h-32"
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
    >
      <path d="M0 30 Q 20 5, 40 15 T 80 12 T 100 18 L 100 30 Z" fill={c1} opacity="0.7" />
      <path d="M0 30 Q 15 18, 35 22 T 70 20 T 100 25 L 100 30 Z" fill={c2} opacity="0.8" />
    </svg>
  );
}
