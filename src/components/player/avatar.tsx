import { avatarColor } from "@lib/utils";

interface AvatarProps {
  name:     string;
  size?:    number;
  className?: string;
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const bg       = avatarColor(name);
  return (
    <div style={{
      width:           size,
      height:          size,
      borderRadius:    "50%",
      background:      bg,
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      fontSize:        Math.round(size * 0.32),
      fontWeight:      500,
      color:           "#fff",
      flexShrink:      0,
    }}>
      {initials}
    </div>
  );
}
