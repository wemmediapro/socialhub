import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  position?: "top" | "bottom";
};

export default function EmojiPicker({ onSelect, position = "bottom" }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const emojiCategories = {
    "😊 Smileys": [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊",
      "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪",
      "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏",
      "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕"
    ],
    "❤️ Hearts": [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕",
      "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️", "✝️", "☪️", "🕉️", "☸️"
    ],
    "🎉 Celebration": [
      "🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁", "🥳", "🎆", "🎇", "✨",
      "🎃", "🎄", "🎋", "🎍", "🎎", "🎏", "🎐", "🎑", "🧧", "🎗️", "🎫", "🏆"
    ],
    "👍 Gestures": [
      "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙",
      "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜",
      "👏", "🙌", "👐", "🤲", "🤝", "🙏", "💪", "🦾", "🦿", "🦵", "🦶", "👂"
    ],
    "🔥 Trending": [
      "🔥", "💯", "⭐", "✨", "🌟", "💫", "⚡", "💥", "💢", "💦", "💨", "🌈",
      "☀️", "⛅", "☁️", "🌤️", "⛈️", "🌩️", "🌧️", "💧", "💦", "☔", "⚡", "❄️"
    ],
    "💼 Business": [
      "💼", "📊", "📈", "📉", "💰", "💵", "💴", "💶", "💷", "💸", "💳", "🪙",
      "🏦", "🏢", "🏭", "🏗️", "🎯", "📱", "💻", "🖥️", "⌨️", "🖨️", "📞", "☎️"
    ],
    "🛍️ Shopping": [
      "🛍️", "🛒", "💳", "💰", "💎", "👗", "👔", "👕", "👖", "🧥", "👞", "👟",
      "👠", "👡", "👢", "👜", "👝", "🎒", "👓", "🕶️", "💄", "💍", "💅", "🔑"
    ],
    "🍕 Food": [
      "🍕", "🍔", "🍟", "🌭", "🍿", "🧂", "🥓", "🥚", "🍳", "🧇", "🥞", "🧈",
      "🍞", "🥐", "🥖", "🥨", "🥯", "🧀", "🥗", "🥙", "🥪", "🌮", "🌯", "🫔"
    ],
    "⚽ Sports": [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎱", "🪀", "🏓",
      "🏸", "🏒", "🏑", "🥍", "🏏", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿", "🥊"
    ],
    "✈️ Travel": [
      "✈️", "🛫", "🛬", "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "⛴️", "🚢", "🗼",
      "🗽", "🗾", "🏰", "🏯", "🏟️", "🗺️", "🧳", "🎒", "🏖️", "🏝️", "🏔️"
    ],
    "📱 Tech": [
      "📱", "💻", "🖥️", "⌨️", "🖱️", "🖲️", "💾", "💿", "📀", "🎮", "🕹️", "📷",
      "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️", "📟", "📠", "📺", "📻", "🎙️"
    ]
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleEmojiClick = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div style={{ position: "relative" }} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "36px",
          height: "36px",
          border: "2px solid #e5e5e5",
          borderRadius: "8px",
          background: "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#6366f1";
          e.currentTarget.style.background = "#6366f108";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#e5e5e5";
          e.currentTarget.style.background = "white";
        }}
        title="Insérer un emoji"
      >
        <Smile size={18} style={{ color: "#6366f1" }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            [position === "top" ? "bottom" : "top"]: "calc(100% + 8px)",
            right: 0,
            width: "380px",
            maxHeight: "420px",
            background: "white",
            border: "2px solid #e5e5e5",
            borderRadius: "12px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            zIndex: 1000,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Header */}
          <div style={{
            padding: "1rem",
            borderBottom: "2px solid #e5e5e5",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "white"
          }}>
            <div style={{ fontSize: "0.875rem", fontWeight: "700", marginBottom: "0.25rem" }}>
              😊 Sélectionnez un emoji
            </div>
            <div style={{ fontSize: "0.6875rem", opacity: 0.9 }}>
              Cliquez pour insérer dans votre texte
            </div>
          </div>

          {/* Categories */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "1rem"
          }}>
            {Object.entries(emojiCategories).map(([category, emojis]) => (
              <div key={category} style={{ marginBottom: "1.5rem" }}>
                <h4 style={{
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#999",
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em"
                }}>
                  {category}
                </h4>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(8, 1fr)",
                  gap: "0.5rem"
                }}>
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "1.5rem",
                        borderRadius: "6px",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f8f9fa";
                        e.currentTarget.style.transform = "scale(1.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "2px solid #e5e5e5",
            background: "#f8f9fa",
            fontSize: "0.6875rem",
            color: "#999",
            textAlign: "center",
            fontWeight: "600"
          }}>
            {Object.values(emojiCategories).flat().length} emojis disponibles
          </div>
        </div>
      )}
    </div>
  );
}

