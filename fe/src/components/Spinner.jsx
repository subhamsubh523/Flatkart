export default function Spinner({ fullPage = false, size = 40, color = "#1abc9c" }) {
  const style = {
    width: size, height: size,
    border: `4px solid #e0e0e0`,
    borderTop: `4px solid ${color}`,
    borderRadius: "50%",
    animation: "spin 0.75s linear infinite",
  };
  if (!fullPage) return <div style={style} />;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
      <div style={style} />
    </div>
  );
}
