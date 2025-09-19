"use client"
import {useRouter} from "next/navigation";

export default function Page() {
    const router=useRouter();
  const features = [
    { icon: "🗂️", title: "Voiceprint Database", desc: "Secure enrollment and storage of inmate voice profiles based on unique biometric sound features." },
    { icon: "✅", title: "Automatic Verification", desc: "Real-time authentication of speaker identity during monitored calls or recorded communications." },
    { icon: "🎙️", title: "Synthetic Voice Detection", desc: "Detection of AI-generated or cloned voices using advanced forensic acoustic analysis." },
    { icon: "📑", title: "Forensic Reports", desc: "Automated reports with file hashes, analysis results, spectrograms, and QR code validation for legal evidence." },
    { icon: "1🛡️", title: "Audit Logs", desc: "Tamper-proof storage of all analyses to ensure accountability and chain-of-custody integrity." },
    { icon: "📊", title: "Supervisor Dashboard", desc: "Centralized dashboard for audio uploads, instant results, and alerts for flagged high-risk calls." },
    { icon: "🔍", title: "Spectrogram & Playback", desc: "Interactive visualization and playback to detect anomalies in speech patterns." },
    { icon: "🌐", title: "Language Independence", desc: "Designed to work across multiple Indian languages by focusing on biometric sound characteristics, not vocabulary." },
    { icon: "🏛️", title: "Scalability", desc: "Can begin at a single facility and scale seamlessly across correctional institutions in Goa or nationwide." },
  ];

  return (
    <div style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#0A2540", minHeight: "100vh", color: "#FFFFFF" }}>
      
      {/* Hero Section */}
      <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "80px 100px" }}>
        <div style={{ maxWidth: "55%" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 700, marginBottom: "20px", lineHeight: 1.2 }}>
            SecureVox: AI-Based Voice Recognition <br /> & Synthetic Voice Detection
          </h1>
          <p style={{ fontSize: "18px", lineHeight: "1.8", marginBottom: "40px", color: "#C9D6E2" }}>
            SecureVox empowers law enforcement agencies with advanced AI-driven technology to verify voice authenticity, 
            identify AI-cloned speech, and provide reliable digital forensic evidence. 
            Designed for correctional facilities, it ensures communication monitoring is both secure and tamper-proof.
          </p>
          <button className="cta" onClick={()=>{
            router.push("/Dashboard");
          }}>Request Access</button>
        </div>

        <div style={{ textAlign: "right" }}>
           <h1 style={{ fontSize: "100px", fontWeight: 900, margin: 0, color: "#f6f6f6ff" }}>
                Secure
            </h1>
            <h1 style={{ fontSize: "100px", fontWeight: 900, margin: 0, color: "#f5f5f5ff",padding: "0px 170px" }}>
                 Vox
            </h1>
          <p style={{ fontSize: "16px", color: "#A9C3DB", marginTop: "-10px" }}>
            Trusted AI Solution for Police & Correctional Systems
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: "80px 100px", backgroundColor: "#112B4A" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "700", marginBottom: "50px", textAlign: "center", color: "#FFFFFF" }}>
          Core Capabilities for Law Enforcement
        </h2>

        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 100px", backgroundColor: "#0A1A2F", textAlign: "center", color: "#A9C3DB", fontSize: "14px" }}>
        © {new Date().getFullYear()} SecureVox | Developed for Law Enforcement Agencies in Goa
      </footer>

      {/* Inline CSS */}
      <style>{`
        .cta {
          background:#1D4ED8;
          color:#fff;
          padding:16px 32px;
          border:none;
          border-radius:8px;
          font-weight:700;
          font-size:16px;
          cursor:pointer;
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .cta:hover { transform: translateY(-3px); box-shadow: 0 8px 20px rgba(29,78,216,0.25); }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.06);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 28px;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.35);
          transition: transform .25s ease, box-shadow .25s ease;
        }
        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 36px rgba(0,0,0,0.55);
        }
        .feature-card h3 {
          font-size: 20px;
          color: #38BDF8;
          margin: 0 0 10px 0;
          font-weight: 600;
        }
        .feature-card p {
          font-size: 15px;
          color: #D1E3F0;
          line-height: 1.6;
          margin: 0;
        }
        .icon {
          background: #1D4ED8;
          color: white;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(29,78,216,0.45);
        }

        @media (max-width: 880px) {
          section { padding: 40px 28px; }
          .features-grid { gap: 20px; }
          h1[style] { font-size: 34px !important; }
        }
      `}</style>
    </div>
  );
}
