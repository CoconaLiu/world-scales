"use client";

const PIN_POSITIONS = [
  { left: "49%", top: "44%" },
  { left: "39%", top: "28%" },
  { left: "70%", top: "40%" },
  { left: "82%", top: "46%" },
  { left: "76%", top: "68%" },
];

export function AtlasMap({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="atlas-map" aria-hidden="true">
      <div className="land land-a" />
      <div className="land land-b" />
      <div className="land land-c" />
      <div className="route-line" />
      {PIN_POSITIONS.map((position, index) => (
        <span
          key={index}
          className={`map-pin${index === activeIndex ? " is-active" : ""}`}
          style={position}
        />
      ))}
    </div>
  );
}
