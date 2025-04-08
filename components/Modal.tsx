import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center" style={{ 
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div
        style={{
          backgroundColor: "#1e293b", // Dark blue/gray outer box
          borderRadius: "12px",
          border: "1px solid #334155",
          padding: "40px",
          maxWidth: "500px",
          width: "100%",
          position: "relative",
          zIndex: 1000000
        }}
      >
        <button 
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            border: "none",
            background: "none",
            color: "#ffffff", // White color
            fontSize: "28px",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 1000001,
            lineHeight: "1",
            padding: "0",
            margin: "0"
          }}
          onClick={onClose}
          aria-label="Close"
        >
          &#215;
        </button>
        
        <div
          ref={modalRef}
          style={{
            backgroundColor: "#000000", // Black inner box
            borderRadius: "8px",
            width: "100%",
            position: "relative",
            color: "white"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
