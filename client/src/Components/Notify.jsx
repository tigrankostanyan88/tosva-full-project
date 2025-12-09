import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import "../Styles/Notify.css";

const Ctx = createContext(null);

export function NotifyProvider({ children }) {
  const [items, setItems] = useState([]);
  const exitMs = 200;
  const MAX_ITEMS = 5;

  const push = useCallback((type, message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => {
      const next = [...prev, { id, type, message, closing: false }];
      if (next.length > MAX_ITEMS) {
        next.splice(0, next.length - MAX_ITEMS);
      }
      return next;
    });
    const showMs = 4000 - exitMs;
    setTimeout(() => {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, closing: true } : i));
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== id));
      }, exitMs);
    }, showMs);
  }, []);

  const close = useCallback((id) => {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, closing: true } : i));
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, exitMs);
  }, [exitMs]);

  const api = useMemo(() => ({
    success: (m) => push("success", m),
    error: (m) => push("error", m),
    info: (m) => push("info", m)
  }), [push]);

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="notifyContainer">
        {items.map((i, idx) => (
          <div
            key={i.id}
            className={`notifyItem ${i.type} ${i.closing ? 'leaving' : ''}`}
            style={{ '--i': idx }}
            onClick={() => close(i.id)}
          >
            <span className="notifyMessage">{i.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(Ctx);
  return ctx;
}
