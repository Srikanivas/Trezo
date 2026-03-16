import React, { useState } from "react";
import { Wallet, Users, TrendingUp, Shield, Zap, ArrowRight } from "lucide-react";

const SimpleHero: React.FC = () => {
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const modalStyle = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "20px",
  };

  const modalContentStyle = {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "32px",
    maxWidth: "400px",
    width: "100%",
    color: "#1f2937",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
  };

  const inputStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#1f2937",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s ease",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: "#1f2937",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Navigation */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "16px 20px",
          zIndex: 100,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={24} color="white" />
            </div>
            <span style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1f2937" }}>Trezo</span>
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <div style={{ textAlign: "center", maxWidth: "900px", marginTop: "80px" }}>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 5vw, 4rem)",
            fontWeight: "bold",
            marginBottom: "20px",
            lineHeight: "1.2",
            color: "#1f2937",
          }}
        >
          AI-Powered
          <span
            style={{
              display: "block",
              color: "#3b82f6",
            }}
          >
            Treasury Management
          </span>
        </h1>

        <p
          style={{
            fontSize: "1.25rem",
            marginBottom: "40px",
            color: "#6b7280",
            lineHeight: "1.6",
            maxWidth: "600px",
            margin: "0 auto 40px",
          }}
        >
          Transform your business finances with intelligent treasury management, automated workflows, and blockchain-powered security.
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "60px",
          }}
        >
          <button
            className="btn-primary"
            onClick={() => setShowRegister(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Users size={20} />
            Register Now
            <ArrowRight size={20} />
          </button>
          <button
            className="btn-secondary"
            onClick={() => setShowLogin(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "#ffffff",
              border: "2px solid #3b82f6",
              color: "#3b82f6",
              padding: "12px 32px",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textDecoration: "none",
            }}
          >
            <Wallet size={20} />
            Login
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Features Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "30px",
            marginTop: "80px",
          }}
        >
          {[
            { icon: <Wallet size={32} />, title: "AI Treasury Management", desc: "Intelligent asset allocation and automated rebalancing" },
            { icon: <TrendingUp size={32} />, title: "Smart Analytics", desc: "Real-time financial insights and predictive analytics" },
            { icon: <Shield size={32} />, title: "Enterprise Security", desc: "Multi-signature governance and atomic transactions" },
            { icon: <Zap size={32} />, title: "Instant Settlements", desc: "Lightning-fast blockchain transactions" },
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                padding: "30px",
                textAlign: "center",
                transition: "transform 0.3s ease, box-shadow 0.3s ease",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div style={{ color: "#3b82f6", marginBottom: "16px" }}>{feature.icon}</div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "12px", color: "#1f2937" }}>{feature.title}</h3>
              <p style={{ color: "#6b7280", lineHeight: "1.5" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div style={modalStyle} onClick={() => setShowRegister(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px", color: "#1f2937" }}>Create Account</h2>
            <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="text" placeholder="Company Name" style={inputStyle} />
              <input type="text" placeholder="Full Name" style={inputStyle} />
              <input type="email" placeholder="Email" style={inputStyle} />
              <input type="password" placeholder="Password" style={inputStyle} />
              <button type="submit" className="btn-primary" style={{ marginTop: "16px" }}>
                Create Account
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.9rem", color: "#6b7280" }}>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
                style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div style={modalStyle} onClick={() => setShowLogin(false)}>
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "20px", color: "#1f2937" }}>Welcome Back</h2>
            <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input type="email" placeholder="Email" style={inputStyle} />
              <input type="password" placeholder="Password" style={inputStyle} />
              <button type="submit" className="btn-primary" style={{ marginTop: "16px" }}>
                Sign In
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "16px", fontSize: "0.9rem", color: "#6b7280" }}>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setShowLogin(false);
                  setShowRegister(true);
                }}
                style={{ color: "#3b82f6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleHero;
