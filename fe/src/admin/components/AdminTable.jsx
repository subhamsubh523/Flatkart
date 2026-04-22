export default function AdminTable({ columns, data, loading, emptyMsg = "No data found." }) {
  if (loading) return <div style={s.loading}>Loading...</div>;
  if (!data.length) return <div style={s.empty}>{emptyMsg}</div>;

  return (
    <div style={s.wrap}>
      <table style={s.table}>
        <thead>
          <tr style={s.thead}>
            {columns.map((c) => <th key={c.key} style={s.th}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row._id || i} style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              {columns.map((c) => (
                <td key={c.key} style={s.td}>
                  {c.render ? c.render(row) : row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  wrap: { overflowX: "auto", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.07)" },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  thead: { background: "#2c3e50" },
  th: { padding: "12px 16px", color: "#fff", textAlign: "left", fontSize: "0.82rem", fontWeight: "600", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #f0f0f0" },
  td: { padding: "12px 16px", fontSize: "0.88rem", color: "#444", verticalAlign: "middle" },
  loading: { padding: "40px", textAlign: "center", color: "#888" },
  empty: { padding: "40px", textAlign: "center", color: "#aaa", fontSize: "0.95rem" },
};
