import { createFileRoute } from "@tanstack/react-router";
import { GardenGame } from "@/components/garden/GardenGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OneKey Garden — A cozy one-key gardening game" },
      { name: "description", content: "Grow a magical garden using only the Spacebar." },
    ],
  }),
  component: () => <GardenGame />,
});
