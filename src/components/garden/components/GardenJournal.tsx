import { motion } from "framer-motion";
import { Save, FLOWERS, FLOWER_INFO, CRITTER_INFO, CritterKind } from "../types";

interface GardenJournalProps {
  save: Save;
  onClose: () => void;
}

export function GardenJournal({ save, onClose }: GardenJournalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.96 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-panel rounded-3xl p-6 max-w-2xl w-[92%] max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-(--font-display) text-2xl">🌷 Garden Journal</h2>
          <button
            onClick={onClose}
            className="text-xs opacity-70 hover:opacity-100 transition-opacity px-2 py-1 rounded bg-white/20 cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Flowers */}
        <div className="mb-5">
          <h3 className="font-(--font-display) text-sm uppercase tracking-wider opacity-70 mb-2">
            Flowers Discovered
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {FLOWERS.map((k) => {
              const seen = save.discovered[k];
              const info = FLOWER_INFO[k];
              return (
                <div key={k} className="rounded-xl bg-white/40 p-3 text-center">
                  <div className="text-3xl">{seen ? info.emoji : "❓"}</div>
                  <div className="text-xs font-semibold mt-1">{seen ? info.name : "???"}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wildlife */}
        <div className="mb-2">
          <h3 className="font-semibold text-sm uppercase tracking-wider opacity-70 mb-2">
            Wildlife Spotted
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(Object.keys(CRITTER_INFO) as CritterKind[]).map((k) => {
              const seen = save.discovered[k];
              const info = CRITTER_INFO[k];
              return (
                <div key={k} className="rounded-xl bg-white/40 p-3 text-center">
                  <div className="text-2xl">{seen ? info.emoji : "❓"}</div>
                  <div className="text-[10px] mt-1">{seen ? info.name : "???"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
