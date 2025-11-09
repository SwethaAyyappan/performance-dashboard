"use client";

type Range = "1m" | "5m" | "1h";

export default function TimeRangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (v: Range) => void;
}) {
  const Btn = ({ v }: { v: Range }) => (
    <button
      onClick={() => onChange(v)}
      style={{
        padding: "6px 10px",
        marginRight: 8,
        border: "1px solid #555",
        background: value === v ? "#333" : "#111",
        color: "#eee",
        borderRadius: 6,
        cursor: "pointer",
      }}
    >
      {v}
    </button>
  );

  return (
    <div style={{ margin: "12px 0" }}>
      <Btn v="1m" />
      <Btn v="5m" />
      <Btn v="1h" />
    </div>
  );
}
