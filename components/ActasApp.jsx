"use client";
import { useState, useCallback, useEffect } from "react";

// ─── Due Legal Brand Constants ───────────────────────────────────────
const COLORS = {
  brand: "#232C54",       // Navy principal (70%)
  brandLight: "#2E3A6E",  // Navy claro
  accent: "#D85A2D",      // Naranja Due Legal (15%)
  accentLight: "#E8845F", // Naranja claro
  accentPale: "#FDEEE8",  // Naranja muy suave (backgrounds)
  blue: "#8DB5D3",        // Azul claro (10%)
  blueLight: "#C3D9E8",   // Azul muy claro
  bg: "#F5F7FA",          // Fondo general (gris-azulado)
  card: "#FFFFFF",        // Cards
  border: "#D8DDE6",      // Bordes
  text: "#232C54",        // Texto principal
  muted: "#6B7280",       // Texto secundario
  success: "#059669",     // Verde éxito
  error: "#DC2626",       // Rojo error
  surface: "#EBEAEB",     // Superficie (5% del manual)
  ai: "#7C3AED",          // LucIA AI (morado)
  aiLight: "#EDE9FE",     // AI background
  aiGlow: "rgba(124,58,237,0.12)", // AI shadow
};

// Due Legal typography
const FONTS = {
  heading: "'League Spartan', sans-serif",
  body: "'Comfortaa', sans-serif",
  mono: "'Share Tech Mono', monospace",
};

const STEPS = [
  { id: "sociedad", label: "Sociedad", icon: "🏢" },
  { id: "reunion", label: "Reunión", icon: "📋" },
  { id: "accionistas", label: "Accionistas", icon: "👥" },
  { id: "mesa", label: "Mesa Directiva", icon: "⚖️" },
  { id: "orden", label: "Orden del Día", icon: "📑" },
  { id: "decisiones", label: "Decisiones", icon: "✅" },
  { id: "preview", label: "Generar Acta", icon: "📄" },
];

const SUGGESTED_ITEMS_ORDINARIA = [
  "Aprobación del informe de gestión",
  "Presentación y aprobación de estados financieros",
  "Distribución de utilidades",
];

const SUGGESTED_ITEMS_EXTRAORDINARIA = [
  "Reforma de estatutos", "Aumento de capital autorizado", "Disminución de capital",
  "Cesión de acciones", "Cambio de representante legal", "Nombramiento/remoción de revisor fiscal",
  "Cambio de objeto social", "Cambio de domicilio", "Cambio de razón social",
  "Transformación societaria", "Fusión", "Escisión", "Disolución y liquidación",
];

const FIXED_START = [
  "Lectura y aprobación del orden del día",
  "Elección del Presidente y Secretario de la Reunión",
  "Verificación del Quórum",
];

const FIXED_END = [
  "Proposiciones y varios",
  "Lectura y aprobación del acta",
];

// ─── Utilities ───────────────────────────────────────────────────────
const fmtCurrency = (v) => {
  if (!v) return "";
  const n = parseInt(String(v).replace(/\D/g, ""));
  return isNaN(n) ? "" : n.toLocaleString("es-CO");
};

const n2w = (n) => {
  if (n === 0) return "cero";
  const u = ["","uno","dos","tres","cuatro","cinco","seis","siete","ocho","nueve"];
  const t = ["diez","once","doce","trece","catorce","quince","dieciséis","diecisiete","dieciocho","diecinueve"];
  const d = ["","diez","veinte","treinta","cuarenta","cincuenta","sesenta","setenta","ochenta","noventa"];
  const c = ["","ciento","doscientos","trescientos","cuatrocientos","quinientos","seiscientos","setecientos","ochocientos","novecientos"];
  if (n < 0) return "menos " + n2w(-n);
  if (n < 10) return u[n];
  if (n < 20) return t[n - 10];
  if (n < 100) { if (n === 20) return "veinte"; if (n < 30) return "veinti" + u[n % 10]; return d[Math.floor(n / 10)] + (n % 10 ? " y " + u[n % 10] : ""); }
  if (n === 100) return "cien";
  if (n < 1000) return c[Math.floor(n / 100)] + (n % 100 ? " " + n2w(n % 100) : "");
  if (n < 1000000) { const th = Math.floor(n / 1000); return (th === 1 ? "mil" : n2w(th) + " mil") + (n % 1000 ? " " + n2w(n % 1000) : ""); }
  if (n < 1000000000) { const m = Math.floor(n / 1000000); return (m === 1 ? "un millón" : n2w(m) + " millones") + (n % 1000000 ? " " + n2w(n % 1000000) : ""); }
  return n.toString();
};

const fmtDateW = (ds) => {
  if (!ds) return "[FECHA]";
  const d = new Date(ds + "T12:00:00");
  const ms = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const day = d.getDate(), m = ms[d.getMonth()], y = d.getFullYear();
  return `${n2w(day)} (${day}) del mes de ${m} del año dos mil ${n2w(y - 2000)} (${y})`;
};

const fmtHourW = (ts) => {
  if (!ts) return "[HORA]";
  const [h, m] = ts.split(":").map(Number);
  const p = h < 12 ? "de la mañana" : (h < 18 ? "de la tarde" : "de la noche");
  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
  if (m === 0) return `las ${n2w(h12)} ${p} (${ts.replace(/^0/, "")} ${h < 12 ? "a.m." : "p.m."})`;
  return `las ${n2w(h12)} y ${n2w(m)} minutos ${p} (${ts} ${h < 12 ? "a.m." : "p.m."})`;
};

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── UI Components ───────────────────────────────────────────────────
function Input({ label, required, error, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5, fontFamily: "'Comfortaa', sans-serif" }}>{label}{required && <span style={{ color: COLORS.accent }}> *</span>}</label>}
      <input {...props} style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${error ? COLORS.error : COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Comfortaa', sans-serif", color: COLORS.text, backgroundColor: COLORS.card, outline: "none", boxSizing: "border-box", transition: "border-color 0.2s", ...(props.style || {}) }} onFocus={e => { e.target.style.borderColor = COLORS.accent; props.onFocus?.(e); }} onBlur={e => { e.target.style.borderColor = error ? COLORS.error : COLORS.border; props.onBlur?.(e); }} />
      {error && <span style={{ fontSize: 11, color: COLORS.error, marginTop: 3, display: "block" }}>{error}</span>}
    </div>
  );
}

function Select({ label, required, options, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5, fontFamily: "'Comfortaa', sans-serif" }}>{label}{required && <span style={{ color: COLORS.accent }}> *</span>}</label>}
      <select {...props} style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Comfortaa', sans-serif", color: COLORS.text, backgroundColor: COLORS.card, outline: "none", cursor: "pointer", boxSizing: "border-box" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function TextArea({ label, required, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 5, fontFamily: "'Comfortaa', sans-serif" }}>{label}{required && <span style={{ color: COLORS.accent }}> *</span>}</label>}
      <textarea {...props} style={{ width: "100%", padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Comfortaa', sans-serif", color: COLORS.text, backgroundColor: COLORS.card, outline: "none", minHeight: 70, resize: "vertical", boxSizing: "border-box", lineHeight: 1.5 }} />
    </div>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", padding: "6px 0", fontFamily: "'Comfortaa', sans-serif", fontSize: 13 }}>
      <div onClick={onChange} style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${checked ? COLORS.accent : COLORS.border}`, backgroundColor: checked ? COLORS.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0, cursor: "pointer" }}>
        {checked && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
      </div>
      <span style={{ color: COLORS.text }}>{label}</span>
    </label>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 22, paddingLeft: 16, borderLeft: `3px solid ${COLORS.accent}` }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.brand, marginBottom: 4, fontFamily: FONTS.heading, marginTop: 0, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{children}</h2>
      {sub && <p style={{ color: COLORS.muted, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function Pill({ children, onClick }) {
  return (
    <button onClick={onClick} className="dl-btn" style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${COLORS.border}`, background: COLORS.card, color: COLORS.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body, transition: "all 0.2s", whiteSpace: "nowrap" }}
      onMouseEnter={e => { e.target.style.borderColor = COLORS.accent; e.target.style.color = COLORS.accent; e.target.style.background = COLORS.accentPale; }}
      onMouseLeave={e => { e.target.style.borderColor = COLORS.border; e.target.style.color = COLORS.muted; e.target.style.background = COLORS.card; }}>
      + {children}
    </button>
  );
}

// ─── AI Button Component ─────────────────────────────────────────────
function AIButton({ onClick, loading, label }) {
  return (
    <button onClick={onClick} disabled={loading} className="dl-btn" style={{
      padding: "9px 20px", borderRadius: 10, border: "none",
      background: loading ? COLORS.aiLight : `linear-gradient(135deg, ${COLORS.ai}, #9333ea)`,
      color: loading ? COLORS.ai : "#fff", fontSize: 12, fontWeight: 700, cursor: loading ? "wait" : "pointer",
      fontFamily: FONTS.body, display: "flex", alignItems: "center", gap: 7,
      boxShadow: loading ? "none" : `0 3px 16px ${COLORS.aiGlow}`, transition: "all 0.25s",
      letterSpacing: 0.3,
    }}>
      {loading ? (
        <><span style={{ display: "inline-block", width: 14, height: 14, border: `2px solid ${COLORS.ai}`, borderTopColor: "transparent", borderRadius: "50%", animation: "aispin 0.8s linear infinite" }} /> Redactando...</>
      ) : (
        <><span style={{ fontSize: 14 }}>✨</span> {label || "Redactar con LucIA"}</>
      )}
    </button>
  );
}

// ─── AI Integration (via backend API route) ─────────────────────────
async function callLucIA(prompt, context) {
  try {
    const res = await fetch("/api/lucia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("LucIA API error:", data.error);
      alert("Error de LucIA: " + (data.error || "Error desconocido"));
      return null;
    }
    if (!data.text) {
      console.error("LucIA returned empty text:", data);
      return null;
    }
    return data.text;
  } catch (e) {
    console.error("LucIA fetch error:", e);
    alert("Error de conexión con LucIA: " + e.message);
    return null;
  }
}

// ─── Step 1: Sociedad ────────────────────────────────────────────────
function StepSociedad({ data, onChange }) {
  const u = (f, v) => onChange({ ...data, [f]: v });
  return (
    <div>
      <SectionTitle sub="Datos de la S.A.S. para el encabezado del acta.">Información de la Sociedad</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div style={{ gridColumn: "1/-1" }}><Input label="Razón social completa" required placeholder="Ej: EMPRESA XYZ S.A.S." value={data.nombre} onChange={e => u("nombre", e.target.value)} /></div>
        <Input label="NIT" required placeholder="901.234.567-8" value={data.nit} onChange={e => u("nit", e.target.value)} />
        <Input label="Domicilio principal" required placeholder="Bogotá D.C." value={data.domicilio} onChange={e => u("domicilio", e.target.value)} />
        <Input label="Matrícula mercantil" placeholder="03-123456-01" value={data.matricula} onChange={e => u("matricula", e.target.value)} />
        <div />
      </div>
      <div style={{ background: COLORS.surface, borderRadius: 10, padding: 18, marginTop: 6, border: `1px solid ${COLORS.border}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.brand, marginBottom: 12, marginTop: 0 }}>Estructura de Capital</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <Input label="Capital autorizado ($)" required placeholder="100.000.000" value={data.cap_aut} onChange={e => u("cap_aut", e.target.value.replace(/\D/g, ""))} />
          <Input label="Acciones autorizadas" required placeholder="100" value={data.acc_aut} onChange={e => u("acc_aut", e.target.value.replace(/\D/g, ""))} />
          <Input label="Valor nominal ($)" required placeholder="1.000.000" value={data.val_nom} onChange={e => u("val_nom", e.target.value.replace(/\D/g, ""))} />
          <Input label="Capital suscrito ($)" required placeholder="65.000.000" value={data.cap_sus} onChange={e => u("cap_sus", e.target.value.replace(/\D/g, ""))} />
          <Input label="Acciones suscritas" required placeholder="65" value={data.acc_sus} onChange={e => u("acc_sus", e.target.value.replace(/\D/g, ""))} />
          <div />
          <Input label="Capital pagado ($)" required placeholder="65.000.000" value={data.cap_pag} onChange={e => u("cap_pag", e.target.value.replace(/\D/g, ""))} />
          <Input label="Acciones pagadas" required placeholder="65" value={data.acc_pag} onChange={e => u("acc_pag", e.target.value.replace(/\D/g, ""))} />
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Reunión ─────────────────────────────────────────────────
function StepReunion({ data, onChange }) {
  const u = (f, v) => onChange({ ...data, [f]: v });
  return (
    <div>
      <SectionTitle sub="Tipo, fecha, lugar y modalidad de la asamblea.">Detalles de la Reunión</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <Select label="Tipo de asamblea" required value={data.tipo} onChange={e => u("tipo", e.target.value)} options={[{ value: "ordinaria", label: "Ordinaria" }, { value: "extraordinaria", label: "Extraordinaria" }]} />
        <Input label="Número de acta" required placeholder="7" type="number" value={data.num_acta} onChange={e => u("num_acta", e.target.value)} />
        <Input label="Fecha" required type="date" value={data.fecha} onChange={e => u("fecha", e.target.value)} />
        <Input label="Hora de inicio" required type="time" value={data.hora} onChange={e => u("hora", e.target.value)} />
        <div style={{ gridColumn: "1/-1" }}><Input label="Lugar" required placeholder="Domicilio principal, Bogotá D.C." value={data.lugar} onChange={e => u("lugar", e.target.value)} /></div>
        <Select label="Modalidad" required value={data.modalidad} onChange={e => u("modalidad", e.target.value)} options={[{ value: "presencial", label: "Presencial" }, { value: "virtual", label: "Virtual" }, { value: "mixta", label: "Mixta" }, { value: "consentimiento", label: "Por consentimiento escrito" }]} />
        <Select label="Convocatoria" required value={data.convocatoria} onChange={e => u("convocatoria", e.target.value)} options={[{ value: "sin", label: "Sin convocatoria (quórum universal)" }, { value: "con", label: "Con convocatoria previa" }, { value: "derecho", label: "Por derecho propio (1er día hábil abril)" }]} />
      </div>
      {data.convocatoria === "con" && (
        <div style={{ background: COLORS.surface, borderRadius: 10, padding: 18, marginTop: 6, border: `1px solid ${COLORS.border}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.brand, marginBottom: 12, marginTop: 0 }}>Detalles de la Convocatoria</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
            <Input label="Forma" placeholder="Comunicación escrita" value={data.forma_conv} onChange={e => u("forma_conv", e.target.value)} />
            <Input label="Fecha convocatoria" type="date" value={data.fecha_conv} onChange={e => u("fecha_conv", e.target.value)} />
            <Input label="Días de antelación" type="number" value={data.dias_ant} onChange={e => u("dias_ant", e.target.value)} />
          </div>
        </div>
      )}
      {data.tipo === "ordinaria" && (
        <div style={{ marginTop: 12 }}><Input label="Período financiero (año)" required type="number" placeholder="2024" value={data.periodo} onChange={e => u("periodo", e.target.value)} /></div>
      )}
      <Input label="Hora de clausura" required type="time" value={data.hora_clausura} onChange={e => u("hora_clausura", e.target.value)} />
    </div>
  );
}

// ─── Step 3: Accionistas ─────────────────────────────────────────────
function StepAccionistas({ data, onChange, totalAcc }) {
  const add = () => onChange([...data, { id: uid(), nombre: "", tipo_doc: "CC", doc: "", domicilio: "", acciones: "", asiste: true, representante: "" }]);
  const rm = (i) => onChange(data.filter((_, idx) => idx !== i));
  const up = (i, f, v) => { const u = [...data]; u[i] = { ...u[i], [f]: v }; onChange(u); };
  const tot = data.reduce((s, a) => s + (parseInt(a.acciones) || 0), 0);

  return (
    <div>
      <SectionTitle sub="Accionistas de la sociedad y su asistencia a la reunión.">Composición Accionaria</SectionTitle>
      {data.map((a, i) => (
        <div key={a.id || i} style={{ background: COLORS.surface, borderRadius: 10, padding: 16, marginBottom: 12, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.brand }}>Accionista #{i + 1}</span>
            {data.length > 1 && <button onClick={() => rm(i)} style={{ background: "none", border: "none", color: COLORS.error, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>✕ Eliminar</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "0 12px" }}>
            <Input label="Nombre completo" required placeholder="Nombre" value={a.nombre} onChange={e => up(i, "nombre", e.target.value)} />
            <Select label="Tipo doc." value={a.tipo_doc} onChange={e => up(i, "tipo_doc", e.target.value)} options={[{ value: "CC", label: "C.C." }, { value: "CE", label: "C.E." }, { value: "PA", label: "Pasaporte" }, { value: "NIT", label: "NIT" }]} />
            <Input label="No. documento" required placeholder="1234567890" value={a.doc} onChange={e => up(i, "doc", e.target.value)} />
            <Input label="Domicilio" placeholder="Bogotá D.C." value={a.domicilio} onChange={e => up(i, "domicilio", e.target.value)} />
            <Input label="No. acciones" required type="number" placeholder="35" value={a.acciones} onChange={e => up(i, "acciones", e.target.value)} />
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 14 }}>
              <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>{tot > 0 ? ((parseInt(a.acciones) || 0) / tot * 100).toFixed(2) : "0.00"}%</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0 12px" }}>
            <Checkbox label="Asiste" checked={a.asiste} onChange={() => up(i, "asiste", !a.asiste)} />
            {!a.asiste && <Input label="Apoderado/Representante" placeholder="Nombre del representante" value={a.representante} onChange={e => up(i, "representante", e.target.value)} />}
          </div>
        </div>
      ))}
      <button onClick={add} className="dl-btn" style={{ width: "100%", padding: 14, border: `2px dashed ${COLORS.accent}`, borderRadius: 12, background: COLORS.accentPale, color: COLORS.accent, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.body, transition: "all 0.2s" }}>+ Agregar Accionista</button>
      <div style={{ marginTop: 12, padding: 14, background: COLORS.brand, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Total acciones registradas</span>
        <span style={{ color: COLORS.accent, fontSize: 16, fontWeight: 700 }}>{tot} acciones ({totalAcc > 0 ? ((tot / totalAcc) * 100).toFixed(0) : 0}% del capital suscrito)</span>
      </div>
    </div>
  );
}

// ─── Step 4: Mesa Directiva ──────────────────────────────────────────
function StepMesa({ data, onChange }) {
  const u = (f, v) => onChange({ ...data, [f]: v });
  const personas = data.personas || [];
  return (
    <div>
      <SectionTitle sub="Presidente y Secretario de la asamblea (Art. 189 y 431 C.Co.).">Mesa Directiva</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div>
          <Input label="Presidente" required placeholder="Nombre completo" value={data.pres_nombre} onChange={e => u("pres_nombre", e.target.value)} />
          <Input label="Documento" placeholder="CC 1234567890" value={data.pres_doc} onChange={e => u("pres_doc", e.target.value)} />
          <Input label="Calidad/Cargo" placeholder="Representante Legal" value={data.pres_calidad} onChange={e => u("pres_calidad", e.target.value)} />
        </div>
        <div>
          <Input label="Secretario" required placeholder="Nombre completo" value={data.sec_nombre} onChange={e => u("sec_nombre", e.target.value)} />
          <Input label="Documento" placeholder="CC 1234567890" value={data.sec_doc} onChange={e => u("sec_doc", e.target.value)} />
          <Input label="Calidad/Cargo" placeholder="Abogado de Due Legal" value={data.sec_calidad} onChange={e => u("sec_calidad", e.target.value)} />
        </div>
      </div>
      <div style={{ background: COLORS.surface, borderRadius: 10, padding: 16, marginTop: 12, border: `1px solid ${COLORS.border}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.brand, margin: "0 0 10px" }}>Otras personas presentes</p>
        {personas.map((p, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: 8, marginBottom: 6, alignItems: "end" }}>
            <Input label={i === 0 ? "Nombre" : ""} placeholder="Nombre" value={p.nombre} onChange={e => { const np = [...personas]; np[i] = { ...np[i], nombre: e.target.value }; u("personas", np); }} />
            <Input label={i === 0 ? "Documento" : ""} placeholder="CC 123..." value={p.doc} onChange={e => { const np = [...personas]; np[i] = { ...np[i], doc: e.target.value }; u("personas", np); }} />
            <Input label={i === 0 ? "Calidad" : ""} placeholder="Abogado" value={p.calidad} onChange={e => { const np = [...personas]; np[i] = { ...np[i], calidad: e.target.value }; u("personas", np); }} />
            <button onClick={() => u("personas", personas.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", color: COLORS.error, cursor: "pointer", fontSize: 16, paddingBottom: 14 }}>✕</button>
          </div>
        ))}
        <button onClick={() => u("personas", [...personas, { nombre: "", doc: "", calidad: "" }])} style={{ background: "none", border: `1px dashed ${COLORS.accent}`, borderRadius: 6, padding: "6px 14px", color: COLORS.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Agregar persona</button>
      </div>
    </div>
  );
}

// ─── Step 5: Orden del Día (FLEXIBLE) ────────────────────────────────
function StepOrden({ items, onChange, tipo }) {
  const suggestions = tipo === "ordinaria" ? SUGGESTED_ITEMS_ORDINARIA : SUGGESTED_ITEMS_EXTRAORDINARIA;
  const [newItem, setNewItem] = useState("");

  const addItem = (label) => {
    if (!label.trim()) return;
    onChange([...items, { id: uid(), label: label.trim(), resumen: "", textoFinal: "", votos: { favor: "", contra: "", blanco: "" } }]);
    setNewItem("");
  };

  const removeItem = (id) => onChange(items.filter(it => it.id !== id));

  const moveItem = (idx, dir) => {
    const arr = [...items];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    onChange(arr);
  };

  const updateLabel = (id, val) => onChange(items.map(it => it.id === id ? { ...it, label: val } : it));

  const alreadyAdded = items.map(it => it.label.toLowerCase());

  return (
    <div>
      <SectionTitle sub={`Configure libremente los puntos del orden del día. ${tipo === "extraordinaria" ? "Solo se podrá decidir sobre temas incluidos (Art. 425 C.Co.)." : ""}`}>Orden del Día</SectionTitle>

      <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Puntos fijos de apertura</p>
      {FIXED_START.map((item, i) => (
        <div key={item} style={{ padding: "8px 14px", background: COLORS.surface, borderRadius: 6, marginBottom: 4, fontSize: 13, color: COLORS.muted, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, width: 20 }}>{i + 1}.</span>
          {item}
          <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.border }}>Fijo</span>
        </div>
      ))}

      <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 1 }}>Puntos de decisión (editables y reordenables)</p>
      {items.length === 0 && <p style={{ fontSize: 12, color: COLORS.muted, fontStyle: "italic", margin: "8px 0 12px" }}>No hay puntos de decisión. Agregue puntos manualmente o use las sugerencias rápidas.</p>}
      {items.map((item, i) => (
        <div key={item.id} style={{ padding: "8px 14px", background: COLORS.card, borderRadius: 8, marginBottom: 4, border: `1.5px solid ${COLORS.border}`, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, width: 20 }}>{FIXED_START.length + i + 1}.</span>
          <input value={item.label} onChange={e => updateLabel(item.id, e.target.value)} style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: "'Comfortaa', sans-serif", color: COLORS.text, background: "transparent" }} />
          <div style={{ display: "flex", gap: 2 }}>
            <button onClick={() => moveItem(i, -1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: i === 0 ? COLORS.border : COLORS.muted, padding: 2 }}>↑</button>
            <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: i === items.length - 1 ? COLORS.border : COLORS.muted, padding: 2 }}>↓</button>
            <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: COLORS.error, padding: 2 }}>✕</button>
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 16 }}>
        <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === "Enter" && addItem(newItem)} placeholder="Escriba un nuevo punto del orden del día..." style={{ flex: 1, padding: "9px 12px", border: `1.5px solid ${COLORS.border}`, borderRadius: 8, fontSize: 13, fontFamily: "'Comfortaa', sans-serif", outline: "none", boxSizing: "border-box" }} />
        <button onClick={() => addItem(newItem)} style={{ padding: "9px 18px", background: COLORS.brand, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Comfortaa', sans-serif", whiteSpace: "nowrap" }}>+ Agregar</button>
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Sugerencias rápidas</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {suggestions.filter(s => !alreadyAdded.includes(s.toLowerCase())).map(s => (
          <Pill key={s} onClick={() => addItem(s)}>{s}</Pill>
        ))}
      </div>

      <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8, marginTop: 16, textTransform: "uppercase", letterSpacing: 1 }}>Puntos fijos de cierre</p>
      {FIXED_END.map((item, i) => (
        <div key={item} style={{ padding: "8px 14px", background: COLORS.surface, borderRadius: 6, marginBottom: 4, fontSize: 13, color: COLORS.muted, display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, width: 20 }}>{FIXED_START.length + items.length + i + 1}.</span>
          {item}
          <span style={{ marginLeft: "auto", fontSize: 10, color: COLORS.border }}>Fijo</span>
        </div>
      ))}
    </div>
  );
}

// ─── Step 6: Decisiones (AI + voting by shares) ─────────────────────
function StepDecisiones({ items, onChange, accionistas, sociedad, reunion, mesa }) {
  const accPresentes = accionistas.filter(a => a.asiste);
  const totalAccSus = parseInt(sociedad.acc_sus) || 0;
  const accPresCount = accPresentes.reduce((s, a) => s + (parseInt(a.acciones) || 0), 0);
  const mayoria = Math.floor(accPresCount / 2) + 1;

  const updateItem = (id, updates) => {
    if (typeof updates === "string") {
      // Legacy: updateItem(id, field, val) — but we won't use this anymore
      return;
    }
    onChange(items.map(it => it.id === id ? { ...it, ...updates } : it));
  };

  const updateField = (id, field, val) => {
    onChange(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  };

  const updateVotos = (id, field, val) => {
    onChange(items.map(it => it.id === id ? { ...it, votos: { ...it.votos, [field]: val } } : it));
  };

  const handleAI = async (item) => {
    if (!item.resumen?.trim()) return;
    updateField(item.id, "aiLoading", true);

    const context = `DATOS DE LA SOCIEDAD: ${sociedad.nombre}, NIT ${sociedad.nit}, domicilio en ${sociedad.domicilio}.
Capital suscrito: $${fmtCurrency(sociedad.cap_sus)} representado en ${sociedad.acc_sus} acciones suscritas.
Capital pagado: $${fmtCurrency(sociedad.cap_pag)} representado en ${sociedad.acc_pag} acciones pagadas.
TIPO DE ASAMBLEA: ${reunion.tipo === "ordinaria" ? "Ordinaria" : "Extraordinaria"}
${reunion.tipo === "ordinaria" ? `PERÍODO FINANCIERO: ${reunion.periodo}` : ""}
ACCIONES PRESENTES EN LA REUNIÓN: ${accPresCount} acciones suscritas y pagadas (${totalAccSus > 0 ? ((accPresCount / totalAccSus) * 100).toFixed(0) : 100}% del capital suscrito).
ACCIONISTAS PRESENTES: ${accPresentes.map(a => `${a.nombre} (${a.acciones} acciones)`).join(", ")}
PRESIDENTE: ${mesa.pres_nombre} | SECRETARIO: ${mesa.sec_nombre}
VOTACIÓN: ${item.votos.favor || accPresCount} acciones suscritas y pagadas a favor, ${item.votos.contra || 0} en contra, ${item.votos.blanco || 0} en blanco.`;

    const prompt = `Redacta el punto del acta de asamblea de accionistas titulado "${item.label}".

RESUMEN DEL ABOGADO SOBRE LO QUE SE DECIDIÓ:
${item.resumen}

Redacta el texto completo de este punto del acta incluyendo la deliberación, la propuesta, y el resultado de la votación con el número de acciones suscritas y pagadas que votaron a favor, en contra y en blanco. El texto debe cumplir con todos los requisitos del Art. 431 del Código de Comercio y la normatividad aplicable.`;

    const result = await callLucIA(prompt, context);
    // Combine both updates into a single state change to avoid race condition
    onChange(items.map(it => it.id === item.id ? { 
      ...it, 
      textoFinal: result || it.textoFinal || "", 
      aiLoading: false,
      aiError: result ? null : "No se pudo generar el texto. Verifica tu API Key e intenta de nuevo."
    } : it));
  };

  return (
    <div>
      <SectionTitle sub="Para cada punto, escriba un resumen y use LucIA para la redacción legal. Todo es 100% editable.">Detalle de las Decisiones</SectionTitle>

      <div style={{ background: COLORS.surface, borderRadius: 8, padding: "10px 14px", marginBottom: 20, fontSize: 12 }}>
        <strong>Quórum:</strong> {accPresCount} de {totalAccSus} acciones presentes ({totalAccSus > 0 ? ((accPresCount / totalAccSus) * 100).toFixed(0) : 0}%). Mayoría requerida (Art. 22 Ley 1258): <strong>{mayoria} acciones</strong> (mitad + 1 de presentes).
      </div>

      {items.map((item, i) => {
        const vf = parseInt(item.votos?.favor) || accPresCount;
        const vc = parseInt(item.votos?.contra) || 0;
        const vb = parseInt(item.votos?.blanco) || 0;
        const aprobada = vf >= mayoria;
        const unanime = vf === accPresCount && vc === 0 && vb === 0;

        return (
          <div key={item.id} style={{ background: COLORS.card, borderRadius: 10, padding: 20, marginBottom: 14, border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: COLORS.brand, marginBottom: 14, display: "flex", gap: 8, alignItems: "center", marginTop: 0 }}>
              <span style={{ background: COLORS.accent, color: "#fff", width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{FIXED_START.length + i + 1}</span>
              {item.label}
            </h3>

            <div style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14, marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, marginTop: 0 }}>Votación (en acciones suscritas y pagadas)</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <Input label="A favor" type="number" placeholder={String(accPresCount)} value={item.votos?.favor ?? ""} onChange={e => updateVotos(item.id, "favor", e.target.value)} />
                <Input label="En contra" type="number" placeholder="0" value={item.votos?.contra ?? ""} onChange={e => updateVotos(item.id, "contra", e.target.value)} />
                <Input label="En blanco" type="number" placeholder="0" value={item.votos?.blanco ?? ""} onChange={e => updateVotos(item.id, "blanco", e.target.value)} />
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 14, gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: aprobada ? COLORS.success : COLORS.error }}>
                    {aprobada ? "✓ APROBADA" : "✗ NO APROBADA"}
                  </span>
                  {unanime && <span style={{ fontSize: 10, color: COLORS.accent, fontWeight: 600 }}>(Unanimidad)</span>}
                </div>
              </div>
            </div>

            <TextArea label="📝 Resumen del abogado (describa lo decidido)" placeholder="Ej: Se presentó el informe de gestión del representante legal y los accionistas decidieron aprobarlo..." value={item.resumen || ""} onChange={e => updateField(item.id, "resumen", e.target.value)} />

            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
              <AIButton onClick={() => handleAI(item)} loading={item.aiLoading} label="Redactar con LucIA" />
              {!item.resumen?.trim() && <span style={{ fontSize: 11, color: COLORS.muted }}>Escriba un resumen para que LucIA redacte el texto legal</span>}
              {item.aiError && <span style={{ fontSize: 11, color: COLORS.error, fontWeight: 600 }}>⚠️ {item.aiError}</span>}
            </div>

            {(item.textoFinal || item.textoFinal === "") && (
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: COLORS.ai, marginBottom: 5, fontFamily: "'Comfortaa', sans-serif" }}>✨ Texto final del acta (editable)</label>
                <textarea value={item.textoFinal} onChange={e => updateField(item.id, "textoFinal", e.target.value)} style={{
                  width: "100%", padding: "12px 14px", border: `2px solid ${COLORS.ai}20`, borderRadius: 8, fontSize: 13,
                  fontFamily: "'Comfortaa', sans-serif", color: COLORS.text, backgroundColor: COLORS.aiLight + "40",
                  outline: "none", minHeight: 120, resize: "vertical", boxSizing: "border-box", lineHeight: 1.6,
                }} />
              </div>
            )}
          </div>
        );
      })}
      {items.length === 0 && <p style={{ fontSize: 13, color: COLORS.muted, textAlign: "center", padding: 30 }}>No hay puntos de decisión. Vuelva al paso "Orden del Día" para agregar puntos.</p>}
    </div>
  );
}

// ─── Step 7: Preview & Generate ──────────────────────────────────────
function StepPreview({ sociedad, reunion, accionistas, mesa, items, driveStatus, onDownloadDocx, onUploadDrive, docxLoading, driveLoading, driveResult }) {
  const totalAccSus = parseInt(sociedad.acc_sus) || 0;
  const accPresentes = accionistas.filter(a => a.asiste);
  const accPresCount = accPresentes.reduce((s, a) => s + (parseInt(a.acciones) || 0), 0);
  const tipoLabel = reunion.tipo === "ordinaria" ? "Ordinaria" : "Extraordinaria";
  const [editableHTML, setEditableHTML] = useState("");

  const generateHTML = useCallback(() => {
    let h = "";
    h += `<div style="text-align:center;margin-bottom:20px;">`;
    h += `<p style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0;">REUNIÓN DE ASAMBLEA GENERAL ${tipoLabel.toUpperCase()} DE ACCIONISTAS DE LA SOCIEDAD ${sociedad.nombre}</p>`;
    h += `<p style="font-size:13px;font-weight:700;margin:8px 0 0;">ACTA No. ${reunion.num_acta}.</p></div>`;

    h += `<p style="text-align:justify;line-height:1.8;font-size:13px;">Siendo ${fmtHourW(reunion.hora)} del ${fmtDateW(reunion.fecha)}, se llevó a cabo la Reunión de Asamblea General ${tipoLabel} de Accionistas de la sociedad <strong>${sociedad.nombre}</strong> (en adelante "la Sociedad"), identificada con NIT ${sociedad.nit}, con domicilio principal en la ciudad de ${sociedad.domicilio}${sociedad.matricula ? `, inscrita en la Cámara de Comercio bajo matrícula mercantil No. ${sociedad.matricula}` : ""}.</p>`;

    h += `<p style="font-size:13px;font-weight:700;margin-top:14px;">ASISTENCIA:</p>`;
    h += `<table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:12px;">`;
    h += `<tr style="background:${COLORS.brand};color:#fff;"><th style="padding:7px;border:1px solid #ccc;">ASISTENTE</th><th style="padding:7px;border:1px solid #ccc;">ACCIONES SUSCRITAS Y PAGADAS</th><th style="padding:7px;border:1px solid #ccc;">% PARTICIPACIÓN</th></tr>`;
    accPresentes.forEach(a => {
      const pct = totalAccSus > 0 ? ((parseInt(a.acciones) / totalAccSus) * 100).toFixed(2) : "0";
      h += `<tr><td style="padding:7px;border:1px solid #ccc;">${a.nombre.toUpperCase()}</td><td style="padding:7px;border:1px solid #ccc;text-align:center;">${a.acciones}</td><td style="padding:7px;border:1px solid #ccc;text-align:center;">${pct}%</td></tr>`;
    });
    h += `<tr style="font-weight:700;"><td style="padding:7px;border:1px solid #ccc;">TOTAL</td><td style="padding:7px;border:1px solid #ccc;text-align:center;">${accPresCount}</td><td style="padding:7px;border:1px solid #ccc;text-align:center;">${totalAccSus > 0 ? ((accPresCount / totalAccSus) * 100).toFixed(0) : 0}%</td></tr></table>`;

    if (reunion.convocatoria === "sin") {
      h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se deja constancia que la reunión se llevó a cabo sin convocatoria previa, toda vez que se encontraban representadas la totalidad de las ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas de la Sociedad, correspondientes al ciento por ciento (100%) del capital suscrito y pagado, y todos los accionistas aceptaron deliberar, de conformidad con el artículo 182 del Código de Comercio.</p>`;
    } else if (reunion.convocatoria === "con") {
      h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se deja constancia que la reunión fue convocada mediante ${reunion.forma_conv} con fecha ${reunion.fecha_conv}, con una antelación de ${reunion.dias_ant} días, dando cumplimiento a los requisitos del artículo 20 de la Ley 1258 de 2008 y los estatutos sociales.</p>`;
    } else {
      h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se deja constancia que la reunión se celebra por derecho propio, conforme al artículo 422 del Código de Comercio.</p>`;
    }

    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se encontraban presentes: `;
    const pp = [];
    const rom = ["i","ii","iii","iv","v","vi","vii","viii","ix","x"];
    if (mesa.pres_nombre) pp.push(`(${rom[pp.length]}) ${mesa.pres_nombre}, identificado con ${mesa.pres_doc || "[documento]"}, en calidad de ${mesa.pres_calidad || "Presidente de la Reunión"}`);
    if (mesa.sec_nombre) pp.push(`(${rom[pp.length]}) ${mesa.sec_nombre}, identificado con ${mesa.sec_doc || "[documento]"}, en calidad de ${mesa.sec_calidad || "Secretario de la Reunión"}`);
    (mesa.personas || []).filter(p => p.nombre).forEach(p => { pp.push(`(${rom[pp.length]}) ${p.nombre}, identificado con ${p.doc || "[documento]"}, en calidad de ${p.calidad || "[calidad]"}`); });
    h += pp.join("; ") + ".</p>";

    h += `<p style="font-size:13px;font-weight:700;margin-top:14px;">ORDEN DEL DÍA:</p>`;
    const allItems = [...FIXED_START, ...items.map(it => it.label), ...FIXED_END];
    allItems.forEach((item, i) => { h += `<p style="font-size:13px;margin:3px 0 3px 18px;">${i + 1}. ${item};</p>`; });
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;margin-top:10px;">El orden del día fue aprobado con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco.</p>`;

    h += `<p style="font-size:14px;font-weight:700;margin-top:18px;text-transform:uppercase;">LECTURA Y APROBACIÓN DEL ORDEN DEL DÍA.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Tras dar lectura al orden del día, fue aprobado con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco, es decir, por unanimidad.</p>`;

    h += `<p style="font-size:14px;font-weight:700;margin-top:18px;text-transform:uppercase;">ELECCIÓN DEL PRESIDENTE Y SECRETARIO DE LA REUNIÓN.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se propuso elegir como Presidente al señor ${mesa.pres_nombre || "[NOMBRE]"} y como Secretario al señor(a) ${mesa.sec_nombre || "[NOMBRE]"}. Los nombramientos fueron aprobados con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco, es decir, por unanimidad.</p>`;

    h += `<p style="font-size:14px;font-weight:700;margin-top:18px;text-transform:uppercase;">VERIFICACIÓN DEL QUÓRUM.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">El Secretario comprobó que se encontraban representadas ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, correspondientes al ${totalAccSus > 0 ? ((accPresCount / totalAccSus) * 100).toFixed(0) : 100}% del capital suscrito y pagado, quedando conformado el quórum deliberatorio y decisorio de conformidad con la Ley y los Estatutos.</p>`;

    items.forEach(item => {
      const vf = parseInt(item.votos?.favor) || accPresCount;
      const vc = parseInt(item.votos?.contra) || 0;
      const vb = parseInt(item.votos?.blanco) || 0;
      const unanime = vf === accPresCount && vc === 0 && vb === 0;

      h += `<p style="font-size:14px;font-weight:700;margin-top:18px;text-transform:uppercase;">${item.label.toUpperCase()}.</p>`;

      if (item.textoFinal?.trim()) {
        h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">${item.textoFinal.replace(/\n/g, '</p><p style="text-align:justify;font-size:13px;line-height:1.8;">')}</p>`;
      } else if (item.resumen?.trim()) {
        h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">${item.resumen}</p>`;
        h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">La propuesta fue sometida a votación y aprobada con el voto favorable de ${n2w(vf)} (${vf}) acciones suscritas y pagadas, ${n2w(vc)} (${vc}) votos en contra y ${n2w(vb)} (${vb}) votos en blanco${unanime ? ", es decir, por unanimidad" : ""}.</p>`;
      } else {
        h += `<p style="text-align:justify;font-size:13px;line-height:1.8;color:#999;">[Pendiente de redacción]</p>`;
      }
    });

    h += `<p style="font-size:14px;font-weight:700;margin-top:18px;text-transform:uppercase;">PROPOSICIONES Y VARIOS.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se dispuso del espacio para proposiciones. Ninguno de los presentes formuló proposiciones adicionales.</p>`;

    h += `<p style="font-size:14px;font-weight:700;margin-top:18px;text-transform:uppercase;">LECTURA Y APROBACIÓN DEL ACTA.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se elaboró la presente acta y fue sometida a consideración de la Asamblea. Fue aprobada con el voto favorable de ${n2w(accPresCount)} (${accPresCount}) acciones suscritas y pagadas, cero (0) votos en contra y cero (0) votos en blanco, es decir, por unanimidad.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">Se levantó la sesión a ${fmtHourW(reunion.hora_clausura || "11:00")}.</p>`;
    h += `<p style="text-align:justify;font-size:13px;line-height:1.8;">En constancia firman:</p>`;

    h += `<div style="display:flex;justify-content:space-between;margin-top:44px;">`;
    h += `<div style="text-align:center;"><p style="border-top:1px solid #000;padding-top:6px;font-size:11px;min-width:180px;"><strong>${(mesa.pres_nombre || "[PRESIDENTE]").toUpperCase()}</strong><br/>Presidente</p></div>`;
    h += `<div style="text-align:center;"><p style="border-top:1px solid #000;padding-top:6px;font-size:11px;min-width:180px;"><strong>${(mesa.sec_nombre || "[SECRETARIO]").toUpperCase()}</strong><br/>Secretario</p></div>`;
    h += `</div>`;

    return h;
  }, [sociedad, reunion, accionistas, mesa, items, accPresCount, totalAccSus, tipoLabel]);

  useEffect(() => { setEditableHTML(generateHTML()); }, [generateHTML]);

  const handleDownload = () => {
    const full = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:'Times New Roman',serif;max-width:700px;margin:40px auto;padding:40px;color:#1a1a1a;line-height:1.6;}table{font-family:'Times New Roman',serif;}@media print{body{margin:0;padding:20px;}}</style></head><body>${editableHTML}</body></html>`;
    const blob = new Blob([full], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Acta_No_${reunion.num_acta}_${tipoLabel}_${sociedad.nombre.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <SectionTitle sub="El contenido es completamente editable. Haz clic en el documento para modificar cualquier parte.">Generar Acta</SectionTitle>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={onDownloadDocx} disabled={docxLoading} className="dl-btn" style={{ padding: "11px 22px", background: docxLoading ? COLORS.surface : `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandLight})`, color: docxLoading ? COLORS.muted : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: docxLoading ? "wait" : "pointer", fontFamily: FONTS.body, display: "flex", alignItems: "center", gap: 7, boxShadow: docxLoading ? "none" : `0 2px 12px ${COLORS.brand}30`, transition: "all 0.2s" }}>
          {docxLoading ? "⏳ Generando..." : "📄 Descargar .docx"}
        </button>
        <button onClick={handleDownload} className="dl-btn" style={{ padding: "11px 22px", background: COLORS.card, color: COLORS.brand, border: `1.5px solid ${COLORS.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body, display: "flex", alignItems: "center", gap: 7, transition: "all 0.2s" }}>📥 Descargar HTML</button>
        {driveStatus?.configured && (
          driveStatus.connected ? (
            <button onClick={onUploadDrive} disabled={driveLoading} className="dl-btn" style={{ padding: "11px 22px", background: driveLoading ? "#e8f5e9" : "#059669", color: driveLoading ? "#059669" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: driveLoading ? "wait" : "pointer", fontFamily: FONTS.body, display: "flex", alignItems: "center", gap: 7, boxShadow: "0 2px 12px rgba(5,150,105,0.25)", transition: "all 0.2s" }}>
              {driveLoading ? "⏳ Subiendo..." : "☁️ Subir a Google Drive"}
            </button>
          ) : (
            <a href="/api/drive/auth" className="dl-btn" style={{ padding: "11px 22px", background: "#fff", color: "#4285F4", border: "2px solid #4285F4", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: FONTS.body, display: "flex", alignItems: "center", gap: 7 }}>🔗 Conectar Google Drive</a>
          )
        )}
        <button onClick={() => setEditableHTML(generateHTML())} className="dl-btn" style={{ padding: "11px 22px", background: COLORS.card, color: COLORS.brand, border: `1.5px solid ${COLORS.border}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body, transition: "all 0.2s" }}>🔄 Regenerar</button>
      </div>

      {driveResult && (
        <div style={{ marginBottom: 12, padding: 12, borderRadius: 8, background: driveResult.success ? "#e8f5e9" : "#fce4ec", fontSize: 12 }}>
          {driveResult.success ? (
            <span>✅ Subido exitosamente: <a href={driveResult.webViewLink} target="_blank" rel="noopener noreferrer" style={{ color: "#4285F4", fontWeight: 600 }}>{driveResult.fileName}</a></span>
          ) : (
            <span style={{ color: COLORS.error }}>❌ {driveResult.error}</span>
          )}
        </div>
      )}

      <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "36px 44px", maxHeight: 520, overflow: "auto", boxShadow: "0 6px 24px rgba(35,44,84,0.08), inset 0 0 0 1px rgba(35,44,84,0.03)", fontFamily: "'Times New Roman', Georgia, serif" }}>
        <div contentEditable suppressContentEditableWarning onBlur={e => setEditableHTML(e.currentTarget.innerHTML)} dangerouslySetInnerHTML={{ __html: editableHTML }} style={{ outline: "none", minHeight: 200 }} />
      </div>

      <div style={{ marginTop: 20, padding: "14px 16px", background: `linear-gradient(135deg, ${COLORS.brand}08, ${COLORS.blue}10)`, borderRadius: 10, fontSize: 11, color: COLORS.muted, border: `1px solid ${COLORS.border}`, fontFamily: FONTS.mono }}>
        <strong style={{ color: COLORS.brand }}>⚖️ Fundamento legal:</strong> Art. 189 y 431 C.Co. · Ley 1258/2008 (Arts. 17-22, 29, 37) · Ley 222/1995 (Arts. 19-20) · Circular Básica Jurídica Supersociedades No. 100-000005/2017 · Decreto 398/2020.
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────
export default function ActasSASApp() {
  const [step, setStep] = useState(0);
  const [sociedad, setSociedad] = useState({ nombre: "", nit: "", domicilio: "", matricula: "", cap_aut: "", acc_aut: "", val_nom: "", cap_sus: "", acc_sus: "", cap_pag: "", acc_pag: "" });
  const [reunion, setReunion] = useState({ tipo: "ordinaria", num_acta: "", fecha: "", hora: "10:00", lugar: "", modalidad: "presencial", convocatoria: "sin", forma_conv: "", fecha_conv: "", dias_ant: "", periodo: String(new Date().getFullYear() - 1), hora_clausura: "11:00" });
  const [accionistas, setAccionistas] = useState([{ id: uid(), nombre: "", tipo_doc: "CC", doc: "", domicilio: "", acciones: "", asiste: true, representante: "" }]);
  const [mesa, setMesa] = useState({ pres_nombre: "", pres_doc: "", pres_calidad: "", sec_nombre: "", sec_doc: "", sec_calidad: "", personas: [] });
  const [items, setItems] = useState([]);

  // ─── Google Drive state ───
  const [driveStatus, setDriveStatus] = useState({ connected: false, configured: false });
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveResult, setDriveResult] = useState(null);
  const [docxLoading, setDocxLoading] = useState(false);

  // Check Drive status on mount
  useEffect(() => {
    fetch("/api/drive/status")
      .then(r => r.json())
      .then(setDriveStatus)
      .catch(() => {});
    // Check URL params for Drive callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("drive_connected")) {
      setDriveStatus(prev => ({ ...prev, connected: true }));
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ─── Download .docx ───
  const handleDownloadDocx = async () => {
    setDocxLoading(true);
    try {
      const res = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sociedad, reunion, accionistas, mesa, items }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error generando documento");
      }
      const blob = await res.blob();
      const tipoLabel = reunion.tipo === "ordinaria" ? "Ordinaria" : "Extraordinaria";
      const filename = `Acta_No_${reunion.num_acta}_${tipoLabel}_${(sociedad.nombre || "SAS").replace(/\s+/g, "_")}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Error: " + e.message);
    }
    setDocxLoading(false);
  };

  // ─── Upload to Google Drive ───
  const handleUploadDrive = async () => {
    setDriveLoading(true);
    setDriveResult(null);
    try {
      // First generate the docx
      const docxRes = await fetch("/api/generate-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sociedad, reunion, accionistas, mesa, items }),
      });
      if (!docxRes.ok) throw new Error("Error generando documento");
      const blob = await docxRes.blob();

      const tipoLabel = reunion.tipo === "ordinaria" ? "Ordinaria" : "Extraordinaria";
      const filename = `Acta_No_${reunion.num_acta}_${tipoLabel}_${(sociedad.nombre || "SAS").replace(/\s+/g, "_")}.docx`;

      // Upload to Drive
      const formData = new FormData();
      formData.append("file", blob, filename);
      formData.append("fileName", filename);

      const uploadRes = await fetch("/api/drive/upload", { method: "POST", body: formData });
      const result = await uploadRes.json();

      if (!uploadRes.ok) {
        if (result.needsAuth) {
          window.location.href = "/api/drive/auth";
          return;
        }
        throw new Error(result.error);
      }

      setDriveResult({ success: true, ...result });
    } catch (e) {
      setDriveResult({ success: false, error: e.message });
    }
    setDriveLoading(false);
  };

  const totalAcc = parseInt(sociedad.acc_sus) || 0;

  const renderStep = () => {
    switch (step) {
      case 0: return <StepSociedad data={sociedad} onChange={setSociedad} />;
      case 1: return <StepReunion data={reunion} onChange={setReunion} />;
      case 2: return <StepAccionistas data={accionistas} onChange={setAccionistas} totalAcc={totalAcc} />;
      case 3: return <StepMesa data={mesa} onChange={setMesa} />;
      case 4: return <StepOrden items={items} onChange={setItems} tipo={reunion.tipo} />;
      case 5: return <StepDecisiones items={items} onChange={setItems} accionistas={accionistas} sociedad={sociedad} reunion={reunion} mesa={mesa} />;
      case 6: return <StepPreview sociedad={sociedad} reunion={reunion} accionistas={accionistas} mesa={mesa} items={items} driveStatus={driveStatus} onDownloadDocx={handleDownloadDocx} onUploadDrive={handleUploadDrive} docxLoading={docxLoading} driveLoading={driveLoading} driveResult={driveResult} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(180deg, #F0F2F6 0%, ${COLORS.bg} 30%, #F0F2F6 100%)`, fontFamily: FONTS.body }}>
      <link href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@400;500;600;700;800&family=Comfortaa:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />

      {/* ─── CSS Animations ─── */}
      <style>{`
        @keyframes aispin { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(216,90,45,0.3); } 50% { box-shadow: 0 0 0 6px rgba(216,90,45,0); } }
        .dl-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(35,44,84,0.2) !important; }
        .dl-btn:active { transform: translateY(0); }
        .dl-input:focus { border-color: ${COLORS.accent} !important; box-shadow: 0 0 0 3px ${COLORS.accent}18 !important; }
        .dl-step-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(35,44,84,0.12) !important; }
        .dl-card-enter { animation: fadeInUp 0.35s ease-out; }
      `}</style>

      {/* ─── Header ─── */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.brand} 0%, #1a2245 100%)`, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "relative", overflow: "hidden" }}>
        {/* Subtle geometric accent */}
        <div style={{ position: "absolute", right: -40, top: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${COLORS.accent}08, transparent 70%)` }} />
        <div style={{ position: "absolute", left: "30%", bottom: -60, width: 300, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${COLORS.blue}06, transparent 70%)` }} />
        
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 1 }}>
          {/* Due Legal Logo Mark - D with star */}
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="8" fill={COLORS.accent} />
            <path d="M10 9h6c5.523 0 10 4.477 10 10s-4.477 10-10 10h-6V9z" fill="white" fillOpacity="0.95"/>
            <path d="M12 18l3-6 1.5 3.5L20 14l-2 4 2 4-3.5-1.5L15 24l-3-6z" fill={COLORS.accent}/>
          </svg>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ color: "#fff", fontSize: 17, fontWeight: 700, letterSpacing: 0.3, fontFamily: FONTS.heading }}>Due Legal</span>
              <span style={{ color: COLORS.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Suite</span>
            </div>
            <span style={{ color: COLORS.blue, fontSize: 11, display: "block", marginTop: 1, fontWeight: 500 }}>Generador de Actas de Asamblea S.A.S.</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 1 }}>
          <span style={{ background: `linear-gradient(135deg, ${COLORS.ai}, #9333ea)`, color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>✨ LucIA AI</span>
          {driveStatus.configured && (
            <span style={{ background: driveStatus.connected ? "rgba(5,150,105,0.85)" : "rgba(255,255,255,0.1)", color: "#fff", padding: "5px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)" }}>
              {driveStatus.connected ? "☁️ Drive" : "☁️ Drive"}
            </span>
          )}
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontFamily: FONTS.mono, letterSpacing: 0.5 }}>Ley 1258/2008</span>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 80px" }}>
        {/* ─── Progress Stepper ─── */}
        <div style={{ position: "relative", display: "flex", gap: 0, marginBottom: 28, padding: "0 8px" }}>
          {/* Connecting line */}
          <div style={{ position: "absolute", top: 18, left: 48, right: 48, height: 2, background: COLORS.border, zIndex: 0 }} />
          <div style={{ position: "absolute", top: 18, left: 48, height: 2, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.brand})`, zIndex: 1, width: `${(step / (STEPS.length - 1)) * (100 - (96 / (STEPS.length * 8)))}%`, transition: "width 0.4s ease", borderRadius: 2 }} />
          
          {STEPS.map((s, i) => (
            <button key={s.id} onClick={() => setStep(i)} className="dl-step-btn" style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer", padding: "0 2px", position: "relative", zIndex: 2, transition: "all 0.2s",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: i === step ? COLORS.accent : (i < step ? COLORS.brand : COLORS.card),
                color: i <= step ? "#fff" : COLORS.muted,
                border: i === step ? `3px solid ${COLORS.accent}` : (i < step ? `3px solid ${COLORS.brand}` : `2px solid ${COLORS.border}`),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: i < step ? 14 : 13, fontWeight: 700, fontFamily: FONTS.heading,
                transition: "all 0.3s ease",
                boxShadow: i === step ? `0 0 0 4px ${COLORS.accent}20` : "none",
              }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 10, fontWeight: i === step ? 700 : 500,
                color: i === step ? COLORS.accent : (i < step ? COLORS.brand : COLORS.muted),
                fontFamily: FONTS.body, letterSpacing: 0.2, whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}>{s.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Main Content Card ─── */}
        <div className="dl-card-enter" key={step} style={{ 
          background: COLORS.card, borderRadius: 16, padding: "32px 36px", 
          border: `1px solid ${COLORS.border}`, 
          borderLeft: `4px solid ${step === 6 ? COLORS.success : COLORS.accent}`,
          boxShadow: "0 4px 24px rgba(35,44,84,0.06), 0 1px 4px rgba(35,44,84,0.04)", 
          minHeight: 400,
        }}>
          {renderStep()}
        </div>

        {/* ─── Navigation ─── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
          <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="dl-btn" style={{
            padding: "11px 28px", background: step === 0 ? COLORS.surface : COLORS.card, color: step === 0 ? COLORS.muted : COLORS.brand,
            border: `1.5px solid ${step === 0 ? COLORS.surface : COLORS.border}`, borderRadius: 10, fontSize: 13, fontWeight: 700, 
            cursor: step === 0 ? "default" : "pointer", fontFamily: FONTS.body, transition: "all 0.2s",
          }}>← Anterior</button>
          <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: FONTS.mono }}>{step + 1} / {STEPS.length}</span>
          {step < STEPS.length - 1 && (
            <button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} className="dl-btn" style={{
              padding: "11px 28px", background: `linear-gradient(135deg, ${COLORS.brand}, ${COLORS.brandLight})`, color: "#fff", 
              border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FONTS.body,
              boxShadow: `0 2px 12px ${COLORS.brand}30`, transition: "all 0.2s",
            }}>Siguiente →</button>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div style={{ textAlign: "center", marginTop: 32, paddingTop: 20, borderTop: `1px solid ${COLORS.border}` }}>
          <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: FONTS.body }}>
            Powered by <strong style={{ color: COLORS.brand }}>Due Legal</strong> · La plataforma legaltech más relevante de Colombia
          </span>
        </div>
      </div>
    </div>
  );
}
