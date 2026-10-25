// client/src/components/Card.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { FaRegFileAlt } from "react-icons/fa";
import { FiDownload, FiCopy, FiCheck } from "react-icons/fi";
import { IoClose } from "react-icons/io5";

function Card({ data, reference, scrollContainerRef, onUpdate, onDelete }) {
  const [text, setText] = useState(
    data.desc === "Type your notes here..." ? "" : data.desc || "",
  );
  const [saveStatus, setSaveStatus] = useState("saved");
  const [copied, setCopied] = useState(false);
  const isInitialMount = useRef(true);

  // Framer Motion values for drag coordinates
  const x = useMotionValue(data.position?.x ?? 40);
  const y = useMotionValue(data.position?.y ?? 96);

  useEffect(() => {
    if (data.position?.x !== undefined) x.set(data.position.x);
    if (data.position?.y !== undefined) y.set(data.position.y);
  }, [data.position?.x, data.position?.y, x, y]);

  // Live byte size calculation
  const calculateSize = (str = "") => {
    const bytes = new Blob([str]).size;
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy note text:", err);
    }
  };

  // Debounced auto-save for text edits
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      await onUpdate(data._id, { desc: text });
      setSaveStatus("saved");
    }, 800);

    return () => clearTimeout(timer);
  }, [text, data._id, onUpdate]);

  const handleBlur = async () => {
    if (saveStatus === "saving") {
      await onUpdate(data._id, { desc: text });
      setSaveStatus("saved");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `doc-${data._id ? data._id.slice(-4) : "note"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDrag = (_, info) => {
    if (!scrollContainerRef?.current) return;
    const threshold = 90;
    const clientY = info.point.y;
    const windowHeight = window.innerHeight;

    if (clientY > windowHeight - threshold) {
      scrollContainerRef.current.scrollTop += 12;
    } else if (clientY < threshold) {
      scrollContainerRef.current.scrollTop -= 12;
    }
  };

  // Persist position to MongoDB after momentum settles
  const handleDragEnd = () => {
    setTimeout(() => {
      const finalX = Math.round(x.get());
      const finalY = Math.round(y.get());
      onUpdate(data._id, { position: { x: finalX, y: finalY } });
    }, 350);
  };

  return (
    <motion.div
      drag
      dragConstraints={reference}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.08, zIndex: 60 }}
      dragElastic={0.2}
      dragTransition={{ bounceStiffness: 500, bounceDamping: 50 }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        x,
        y,
      }}
      className="shrink-0 w-60 h-72 rounded-[40px] bg-zinc-900/95 text-white px-5 py-6 overflow-hidden shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing select-none z-20"
    >
      {/* Subtle White Glow on Creation */}
      {data.isNew && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{
            duration: 1.8,
            times: [0, 0.2, 0.7, 1],
            ease: "easeInOut",
          }}
          className="absolute inset-0 rounded-[40px] pointer-events-none ring-1 ring-white/60 shadow-[0_0_25px_rgba(255,255,255,0.4),inset_0_0_12px_rgba(255,255,255,0.2)]"
        />
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between text-zinc-400">
        <FaRegFileAlt />
        <button
          onClick={() => onDelete(data._id)}
          className="w-6 h-6 hover:bg-zinc-800 rounded-full flex items-center justify-center transition cursor-pointer text-zinc-400 hover:text-white"
          title="Delete note"
        >
          <IoClose size="1em" />
        </button>
      </div>

      {/* Editable Note Area with disappearing placeholder */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        onPointerDownCapture={(e) => e.stopPropagation()}
        placeholder="Type your notes here..."
        className="w-full bg-transparent resize-none outline-none text-sm leading-snug mt-3 font-normal text-zinc-200 h-32 scrollbar-none placeholder:text-zinc-400 focus:placeholder-transparent cursor-text select-text transition-colors"
      />

      {/* Footer */}
      <div className="footer absolute bottom-0 w-full left-0">
        <div className="flex items-center justify-between px-6 py-2 mb-1">
          <div className="flex items-center gap-2">
            <h5 className="text-xs text-zinc-400 font-mono">
              {calculateSize(text)}
            </h5>
            <span
              className={`text-[10px] tracking-wide transition-colors duration-300 ${
                saveStatus === "saving" ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              • {saveStatus === "saving" ? "saving..." : "saved"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="w-7 h-7 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full flex items-center justify-center transition cursor-pointer shadow-md"
            title="Copy note text"
          >
            {copied ? (
              <FiCheck size=".85em" className="text-emerald-400" />
            ) : (
              <FiCopy size=".85em" />
            )}
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 transition text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
        >
          <FiDownload size="1.1em" /> Download .txt
        </button>
      </div>
    </motion.div>
  );
}

export default Card;
