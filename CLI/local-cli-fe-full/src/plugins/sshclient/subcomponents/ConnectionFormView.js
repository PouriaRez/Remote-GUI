import React from 'react';

export const FormField = ({ 
  label, 
  name, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  fullWidth = false,
  required = false,
  options = null,
  onFileChange = null,
  accept = null,
  disabled = false
}) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      ...(fullWidth ? { gridColumn: "1 / span 2" } : {})
    }}>
      <label style={{
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        color: "#475569",
      }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      
      {options ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            backgroundColor: "#f8fafc",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "file" ? (
        <input
          type="file"
          name={name}
          onChange={onFileChange}
          accept={accept}
          disabled={disabled}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            backgroundColor: "#f8fafc",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
            cursor: "pointer",
          }}
        />
      ) : (
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            padding: "10px",
            borderRadius: "6px",
            border: "1px solid #cbd5e1",
            fontSize: "14px",
            backgroundColor: "#f8fafc",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );
};

export const FormHeader = ({ title, description }) => (
  <div style={{
    marginBottom: "24px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "12px",
  }}>
    <h3 style={{
      fontSize: "18px",
      fontWeight: "600",
      margin: "0 0 4px 0",
      color: "#0f172a",
    }}>
      {title}
    </h3>
    {description && (
      <p style={{
        fontSize: "13px",
        color: "#64748b",
        margin: 0,
      }}>
        {description}
      </p>
    )}
  </div>
);

export const FormContainer = ({ children, style = {} }) => (
  <div style={{
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "24px",
    color: "#334155",
    backgroundColor: "#fff",
    ...style 
  }}>
    {children}
  </div>
);

export const FormGrid = ({ children }) => (
  <div style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  }}>
    {children}
  </div>
);

export const FormButton = ({ 
  children, 
  onClick, 
  primary = true, 
  fullWidth = false,
  type = "button",
  disabled = false,
  style = {}
}) => {
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      style={{
        padding: "12px 24px",
        borderRadius: "8px",
        border: "none",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s",
        backgroundColor: primary ? "#0f172a" : "#e2e8f0",
        color: primary ? "#fff" : "#334155",
        ...(fullWidth ? { width: "100%", gridColumn: "1 / span 2" } : {}),
        ...(disabled ? { opacity: 0.6, cursor: "not-allowed" } : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
};