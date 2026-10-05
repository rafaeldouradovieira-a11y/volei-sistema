const SYNE = { fontFamily: "var(--font-syne)" } as const;

export function Avatar({
  name,
  url,
  size = 40,
  ring = false,
}: {
  name: string | null;
  url: string | null;
  size?: number;
  ring?: boolean;
}) {
  const ringStyle = ring ? { boxShadow: "0 0 0 2px var(--color-brand)" } : {};
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name ?? ""}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size, ...ringStyle }}
    />
  ) : (
    <span
      className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{
        width: size,
        height: size,
        background: "rgba(255,255,255,0.08)",
        fontSize: size * 0.4,
        ...SYNE,
        ...ringStyle,
      }}
    >
      {(name ?? "?").charAt(0).toUpperCase()}
    </span>
  );
}

export function AvatarStack({
  people,
  max = 4,
  size = 24,
}: {
  people: { name: string | null; avatar_url: string | null }[];
  max?: number;
  size?: number;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((p, i) => (
        <span
          key={i}
          className="rounded-full"
          style={{ marginLeft: i === 0 ? 0 : -size * 0.3, boxShadow: "0 0 0 2px var(--card)" }}
        >
          <Avatar name={p.name} url={p.avatar_url} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="rounded-full flex items-center justify-center font-bold"
          style={{
            width: size,
            height: size,
            marginLeft: -size * 0.3,
            fontSize: size * 0.38,
            background: "#2c2c2e",
            boxShadow: "0 0 0 2px var(--card)",
            ...SYNE,
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
