import React from "react";

/**
 * Props:
 * - url: string (document URL)
 * - type: string ("pdf", "image", "word", etc.)
 */
export default function DocumentViewPlaceholder({ url, type }) {
  // Helper to detect image types
  const isImage = (t) => ["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(t);

  if (!url || !type) {
    return (
      <div style={{
        padding: "2.5rem",
        textAlign: "center",
        background: "#f8f9fa",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        maxWidth: 420,
        margin: "3rem auto"
      }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
        <h2 style={{ color: "#333", marginBottom: "0.5rem" }}>Document View Unavailable</h2>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          No document selected or unsupported file type.
        </p>
      </div>
    );
  }

  // PDF
  if (type === "pdf") {
    return (
      <iframe
        src={url}
        title="PDF Document"
        style={{ width: "100%", height: "80vh", border: "none", borderRadius: 8 }}
      />
    );
  }

  // Image
  if (isImage(type)) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <img src={url} alt="Document" style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: 8 }} />
      </div>
    );
  }

  // Word (doc, docx) via Office Online Viewer
  if (["doc", "docx"].includes(type)) {
    const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    return (
      <iframe
        src={officeUrl}
        title="Word Document"
        style={{ width: "100%", height: "80vh", border: "none", borderRadius: 8 }}
      />
    );
  }

  // Fallback for unsupported types
  return (
    <div style={{
      padding: "2.5rem",
      textAlign: "center",
      background: "#f8f9fa",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
      maxWidth: 420,
      margin: "3rem auto"
    }}>
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
      <h2 style={{ color: "#333", marginBottom: "0.5rem" }}>Document View Unavailable</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        This file type is not supported for inline viewing.<br />
        <a href={url} download style={{ color: "#007bff" }}>Download Document</a>
      </p>
    </div>
  );
} 