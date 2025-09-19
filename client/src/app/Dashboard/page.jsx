export default function Dashboard() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#0A2540", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px" }}>
      
      {/* Dashboard Box */}
      <div style={{
        background: "rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.15)",
        borderRadius: "20px",
        padding: "50px",
        width: "700px",
        textAlign: "center",
        boxShadow: "0 12px 36px rgba(0,0,0,0.55)"
      }}>
        <h2 style={{ fontSize: "28px", color: "#FFFFFF", fontWeight: 700, marginBottom: "20px" }}>
          Voice Analysis Dashboard
        </h2>
        <p style={{ fontSize: "16px", color: "#C9D6E2", marginBottom: "30px" }}>
          Upload an audio file or record live to begin AI-based verification.
        </p>

        {/* Upload Button */}
        <label style={{
          display: "inline-block",
          background: "#1D4ED8",
          color: "#fff",
          padding: "14px 28px",
          borderRadius: "100px",
          cursor: "pointer",
          fontWeight: "600",
          transition: "all 0.25s ease"
        }}>
          Upload Voice File
          <input type="file" accept="audio/*" style={{ display: "none" }} />
        </label>

    </div>
</div>
  );
}