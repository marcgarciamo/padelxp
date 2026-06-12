"use client";

interface Attributes {
  der: number;
  rev: number;
  vol: number;
  ban: number;
  rem: number;
  glo: number;
  atq: number;
  def: number;
  mnt: number;
  fis: number;
}

interface PlayerCardProps {
  name: string;
  position?: string;
  global: number;
  avatarUrl?: string;
  attributes: Attributes;
}

const AttributeIcon = ({ label }: { label: string }) => {
  const icons: Record<string, string> = {
    der: "🎾",
    rev: "🎾",
    vol: "🏐",
    ban: "🔄",
    rem: "⚡",
    glo: "🌍",
    atq: "🎯",
    def: "🛡️",
    mnt: "🧠",
    fis: "💪",
  };
  return icons[label] || "•";
};

export function PlayerCardFIFA({ name, position, global, avatarUrl, attributes }: PlayerCardProps) {
  const technicalAttrs = [
    { label: "der", value: attributes.der },
    { label: "rev", value: attributes.rev },
    { label: "vol", value: attributes.vol },
    { label: "ban", value: attributes.ban },
    { label: "rem", value: attributes.rem },
  ];

  const generalAttrs = [
    { label: "glo", value: attributes.glo },
    { label: "atq", value: attributes.atq },
    { label: "def", value: attributes.def },
    { label: "mnt", value: attributes.mnt },
    { label: "fis", value: attributes.fis },
  ];

  return (
    <div
      className="w-full max-w-sm mx-auto rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%)",
        border: "3px solid transparent",
        backgroundClip: "padding-box",
        backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1a1f3a 100%), linear-gradient(90deg, #00ff00, #00ffff, #00ff00)",
        backgroundOrigin: "padding-box, border-box",
        boxShadow: "0 0 30px rgba(0, 255, 0, 0.4), 0 0 60px rgba(0, 255, 255, 0.2) inset",
      }}
    >
      {/* Top Section: Global + Photo */}
      <div className="flex justify-between items-start mb-6 gap-4">
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-400 font-semibold tracking-widest">GLOBAL</div>
          <div
            className="text-6xl font-black"
            style={{
              color: "#00ff00",
              textShadow: "0 0 10px #00ff00, 0 0 20px #00ff00",
            }}
          >
            {global}
          </div>
        </div>

        {/* Player Photo */}
        {avatarUrl && (
          <div
            className="flex-shrink-0 w-32 h-40 rounded-lg overflow-hidden border-2"
            style={{
              borderColor: "#00ff00",
              boxShadow: "0 0 20px rgba(0, 255, 0, 0.3)",
            }}
          >
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Position */}
      {position && (
        <div className="mb-3">
          <div className="text-xs text-gray-400 font-semibold tracking-widest">POSICIÓN</div>
          <div className="text-lg font-bold text-white uppercase">{position}</div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent mb-3"></div>

      {/* Player Name */}
      <h2
        className="text-2xl font-black mb-3 uppercase tracking-wide"
        style={{
          color: "#ffffff",
          textShadow: "0 0 10px rgba(0, 255, 0, 0.3)",
        }}
      >
        {name}
      </h2>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent mb-4"></div>

      {/* Technical Attributes */}
      <div className="mb-4">
        <div className="flex justify-between items-center gap-2 mb-2">
          {technicalAttrs.map((attr) => (
            <div key={attr.label} className="flex-1 text-center">
              <div className="text-lg mb-1">
                <AttributeIcon label={attr.label} />
              </div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{attr.label}</div>
              <div
                className="text-xl font-black"
                style={{
                  color: "#00ff00",
                  textShadow: "0 0 10px #00ff00",
                }}
              >
                {attr.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-4"></div>

      {/* General Attributes */}
      <div className="mb-4">
        <div className="flex justify-between items-center gap-2">
          {generalAttrs.map((attr) => (
            <div key={attr.label} className="flex-1 text-center">
              <div className="text-lg mb-1">
                <AttributeIcon label={attr.label} />
              </div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide">{attr.label}</div>
              <div
                className="text-xl font-black"
                style={{
                  color: "#00ff00",
                  textShadow: "0 0 10px #00ff00",
                }}
              >
                {attr.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-500 to-transparent mt-4 mb-3"></div>

      {/* Logo */}
      <div className="text-center">
        <span
          className="text-sm font-bold"
          style={{
            color: "#00ffff",
          }}
        >
          Padel<span style={{ color: "#00ff00" }}>XP</span>
        </span>
      </div>
    </div>
  );
}
