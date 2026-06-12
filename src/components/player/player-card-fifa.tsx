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
      className="w-80 mx-auto rounded-3xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a1f35 0%, #0f1729 100%)",
        border: "2px solid",
        borderColor: "#22dd88",
        boxShadow: "0 0 15px rgba(34, 221, 136, 0.3), 0 0 30px rgba(34, 221, 136, 0.1)",
      }}
    >
      {/* Top Section: Global + Photo */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex-shrink-0">
          <div className="text-xs text-gray-400 font-semibold tracking-widest text-center">GLOBAL</div>
          <div
            className="text-5xl font-black leading-none"
            style={{
              color: "#22dd88",
            }}
          >
            {global}
          </div>
        </div>

        {/* Player Photo */}
        {avatarUrl && (
          <div
            className="flex-shrink-0 w-24 h-32 rounded-lg overflow-hidden"
            style={{
              border: "2px solid #22dd88",
            }}
          >
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Position */}
      {position && (
        <div className="mb-2 text-center">
          <div className="text-xs text-gray-400 font-semibold tracking-widest">POSICIÓN</div>
          <div className="text-sm font-bold text-white uppercase">{position}</div>
        </div>
      )}

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-700 to-transparent mb-2"></div>

      {/* Player Name */}
      <h2
        className="text-lg font-black mb-2 uppercase tracking-wide text-center"
        style={{
          color: "#ffffff",
        }}
      >
        {name}
      </h2>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-700 to-transparent mb-3"></div>

      {/* Technical Attributes */}
      <div className="mb-2">
        <div className="flex justify-between items-center gap-1">
          {technicalAttrs.map((attr) => (
            <div key={attr.label} className="flex-1 text-center">
              <div className="text-sm mb-0.5">
                <AttributeIcon label={attr.label} />
              </div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-tighter">{attr.label}</div>
              <div
                className="text-sm font-black"
                style={{
                  color: "#22dd88",
                }}
              >
                {attr.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-700 to-transparent mb-2 mt-2"></div>

      {/* General Attributes */}
      <div className="mb-2">
        <div className="flex justify-between items-center gap-1">
          {generalAttrs.map((attr) => (
            <div key={attr.label} className="flex-1 text-center">
              <div className="text-sm mb-0.5">
                <AttributeIcon label={attr.label} />
              </div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-tighter">{attr.label}</div>
              <div
                className="text-sm font-black"
                style={{
                  color: "#22dd88",
                }}
              >
                {attr.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-green-700 to-transparent mt-2 mb-2"></div>

      {/* Logo */}
      <div className="text-center">
        <span
          className="text-xs font-bold"
          style={{
            color: "#22dd88",
          }}
        >
          PadelXP
        </span>
      </div>
    </div>
  );
}
