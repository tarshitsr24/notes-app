// client/src/components/Foreground.jsx
import React, { useRef, useState, useEffect } from "react";
import Card from "./Card";
import AuthModal from "./AuthModal";
import { API_BASE_URL } from "../config";
import { FiPlus, FiLogOut } from "react-icons/fi";

const CARD_WIDTH = 240;
const CARD_HEIGHT = 288;
const GAP = 24;
const PADDING_LEFT = 40;
const PADDING_TOP = 96;

function Foreground() {
  const scrollRef = useRef(null);
  const constraintsRef = useRef(null);

  const [docs, setDocs] = useState([]);
  const [token, setToken] = useState(localStorage.getItem("docs_token"));
  const [noteToDelete, setNoteToDelete] = useState(null);

  // Fetch documents and preserve saved MongoDB coordinates
  const fetchDocs = async () => {
    const currentToken = localStorage.getItem("docs_token");
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/docs`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setDocs(() => {
          const clientWidth =
            scrollRef.current?.clientWidth || window.innerWidth;
          const cols = Math.max(
            1,
            Math.floor((clientWidth - PADDING_LEFT * 2) / (CARD_WIDTH + GAP)),
          );

          let slotIndex = 0;
          return data.map((doc) => {
            // Keep saved positions if they exist in MongoDB
            if (
              doc.position &&
              typeof doc.position.x === "number" &&
              typeof doc.position.y === "number"
            ) {
              return doc;
            }

            // Fallback grid assignment ONLY for old legacy notes without positions
            const col = slotIndex % cols;
            const row = Math.floor(slotIndex / cols);
            slotIndex++;

            return {
              ...doc,
              position: {
                x: PADDING_LEFT + col * (CARD_WIDTH + GAP),
                y: PADDING_TOP + row * (CARD_HEIGHT + GAP),
              },
            };
          });
        });
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDocs();
    }
  }, [token]);

  // Create note at current scroll center and save position to database
  const handleCreateDoc = async () => {
    try {
      const scrollEl = scrollRef.current;
      const scrollTop = scrollEl ? scrollEl.scrollTop : 0;
      const clientHeight = scrollEl
        ? scrollEl.clientHeight
        : window.innerHeight;
      const clientWidth = scrollEl ? scrollEl.clientWidth : window.innerWidth;

      const centerX = Math.max(20, Math.round((clientWidth - CARD_WIDTH) / 2));
      const centerY = Math.max(
        20,
        Math.round(scrollTop + (clientHeight - CARD_HEIGHT) / 2),
      );

      const res = await fetch(`${API_BASE_URL}/api/docs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          desc: "",
          position: { x: centerX, y: centerY },
        }),
      });

      if (!res.ok) throw new Error("Could not create note");

      const newDoc = await res.json();
      const docWithCoords = {
        ...newDoc,
        position: newDoc.position || { x: centerX, y: centerY },
        isNew: true,
      };

      setDocs((prev) => [...prev, docWithCoords]);
    } catch (err) {
      console.error("Error creating doc:", err);
    }
  };

  // Update note text or position in MongoDB
  const handleUpdateDoc = async (id, updateData) => {
    const payload =
      typeof updateData === "string" ? { desc: updateData } : updateData;

    // Keep docs state aligned so canvas height expands if a card moves down
    if (payload.position) {
      setDocs((prev) =>
        prev.map((d) =>
          d._id === id ? { ...d, position: payload.position } : d,
        ),
      );
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/docs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save note");
    } catch (err) {
      console.error("Error updating doc:", err);
    }
  };

  const confirmDeleteDoc = async () => {
    if (!noteToDelete) return;
    const id = noteToDelete;

    try {
      const res = await fetch(`${API_BASE_URL}/api/docs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete note");

      setDocs((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      console.error("Error deleting doc:", err);
    } finally {
      setNoteToDelete(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("docs_token");
    setToken(null);
    setDocs([]);
  };

  const canvasHeight = Math.max(
    window.innerHeight,
    ...docs.map((d) => (d.position?.y || 0) + CARD_HEIGHT + 120),
  );

  return (
    <>
      {!token && (
        <AuthModal
          onLoginSuccess={() => {
            const freshToken = localStorage.getItem("docs_token");
            setToken(freshToken);
          }}
        />
      )}

      {/* Confirmation Warning Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-800 p-6 rounded-3xl text-white shadow-2xl flex flex-col items-center text-center gap-3 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-semibold">Delete Note?</h3>
            <p className="text-xs text-zinc-400">
              Are you sure you want to delete this note? This action cannot be
              undone.
            </p>
            <div className="flex items-center gap-3 w-full mt-3">
              <button
                onClick={() => setNoteToDelete(null)}
                className="w-1/2 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                No, Keep
              </button>
              <button
                onClick={confirmDeleteDoc}
                className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned Top Controls - only visible when authenticated */}
      {token && (
        <div className="fixed top-6 right-8 flex items-center gap-3 z-50">
          <button
            onClick={handleCreateDoc}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/90 hover:bg-zinc-700 text-white text-xs font-semibold rounded-full border border-zinc-700 shadow-xl transition cursor-pointer backdrop-blur-md"
          >
            <FiPlus size="1.2em" /> Add Note
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-rose-400 rounded-full border border-zinc-700 shadow-xl transition cursor-pointer backdrop-blur-md"
            title="Logout"
          >
            <FiLogOut size="1.1em" />
          </button>
        </div>
      )}

      {/* Scroll Viewport */}
      <div
        ref={scrollRef}
        className="fixed top-0 left-0 z-10 w-full h-full overflow-y-auto overflow-x-hidden scroll-smooth"
      >
        <div
          ref={constraintsRef}
          style={{ minHeight: `${canvasHeight}px` }}
          className="relative w-full"
        >
          {token && docs.length === 0 && (
            <div className="w-full h-screen flex items-center justify-center pointer-events-none">
              <p className="text-zinc-600 text-sm tracking-wide">
                No documents yet. Click{" "}
                <span className="text-zinc-400">"+ Add Note"</span> to create
                one.
              </p>
            </div>
          )}

          {docs.map((item) => (
            <Card
              key={item._id}
              data={item}
              reference={constraintsRef}
              scrollContainerRef={scrollRef}
              onUpdate={handleUpdateDoc}
              onDelete={(id) => setNoteToDelete(id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default Foreground;
