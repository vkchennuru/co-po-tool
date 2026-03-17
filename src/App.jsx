import { useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ─── Constants ───────────────────────────────────────────────────────────────
const POS = ["PO1","PO2","PO3","PO4","PO5","PO6","PO7","PO8","PO9","PO10","PO11","PO12"];
const PO_LABELS = [
  "Engineering Knowledge","Problem Analysis","Design/Development","Investigation",
  "Modern Tool Usage","Engineer & Society","Environment & Sustainability","Ethics",
  "Individual & Team Work","Communication","Project Management","Life-long Learning"
];
const MAX_COS = 6;
const C = {
  primary:"#1a4f8a", accent:"#e8a020", yes:"#1e8a4a", no:"#c0392b",
  light:"#f0f5fb", border:"#ccd8e8", bg:"#eaf1fb", gold:"#f0c040",
  l0:"#c0392b", l1:"#e67e22", l2:"#1e8a4a", l3:"#1a4f8a"
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const attainLevel = pct => pct >= 70 ? 3 : pct >= 60 ? 2 : pct >= 50 ? 1 : 0;
const levelColor  = l => [C.l0, C.l1, C.l2, C.l3][l];
const levelBg     = l => ["#fde8e8","#fef3e2","#d4edda","#d6eaf8"][l];
const csvDownload = (rows, name) => {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
  a.download = name; a.click();
};

// ─── Shared sub-components ───────────────────────────────────────────────────
const Card = ({ children, style }) => <div style={{ ...ST.card, ...style }}>{children}</div>;
const SectionTitle = ({ children }) => <div style={ST.sectionTitle}>{children}</div>;
const Hint = ({ children }) => <div style={ST.hint}>{children}</div>;
const Btn = ({ children, onClick, variant="primary", disabled, style }) => (
  <button
    style={{
      ...ST.btn,
      ...(variant==="outline" ? ST.btnOut : {}),
      ...(variant==="success" ? { ...ST.btn, background:"#1e8a4a" } : {}),
      ...(variant==="purple"  ? { ...ST.btn, background:"#6f42c1" } : {}),
      opacity: disabled ? 0.45 : 1,
      ...style
    }}
    onClick={onClick} disabled={disabled}
  >{children}</button>
);
const Field = ({ label, value, onChange, placeholder }) => (
  <div style={ST.field}>
    <label style={ST.label}>{label}</label>
    <input style={ST.input} value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || label.replace(" *","")} />
  </div>
);
const LevelBadge = ({ l }) => (
  <span style={{
    display:"inline-block", padding:"2px 12px", borderRadius:20,
    fontSize:11, fontWeight:700, background:levelBg(l), color:levelColor(l)
  }}>Level {l}</span>
);
const MappingCell = ({ val, onClick }) => (
  <div onClick={onClick} style={{
    width:44, height:30, cursor:"pointer", borderRadius:5, margin:"auto",
    border:`2px solid ${val?C.yes:C.no}`, background:val?"#d4edda":"#fde8e8",
    color:val?C.yes:C.no, fontWeight:"bold", fontSize:12,
    display:"flex", alignItems:"center", justifyContent:"center",
    transition:"all 0.12s", userSelect:"none"
  }}>{val?"✔":"✗"}</div>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <div style={{ background:C.primary, color:"#fff", textAlign:"center", padding:"18px 24px 16px" }}>
    <div style={{ fontSize:14, fontWeight:800, letterSpacing:0.3 }}>
      Designed &amp; Developed by{" "}
      <span style={{ color:C.gold }}>Dr. C. V. Krishnaveni</span>
    </div>
    <div style={{ fontSize:11, marginTop:3, opacity:0.9 }}>
      Lecturer in Computer Science &amp; IQAC Coordinator · HOD, Dept. of Computer Science
    </div>
    <div style={{ fontSize:11, opacity:0.85 }}>
      SKR &amp; SKR Government College for Women (Autonomous), Kadapa, Andhra Pradesh
    </div>
    <div style={{ fontSize:11, marginTop:6, opacity:0.8 }}>
      © {new Date().getFullYear()} Dr. C. V. Krishnaveni · All Rights Reserved
    </div>
    <div style={{
      display:"inline-block", marginTop:8,
      background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.25)",
      borderRadius:20, padding:"4px 18px", fontSize:11
    }}>
      🌐 Open Educational Resource (OER) · Licensed under{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer"
        style={{ color:C.gold, textDecoration:"underline" }}>CC BY 4.0</a>{" "}
      · Free to use, share &amp; adapt with attribution
    </div>
    <div style={{ fontSize:10, marginTop:6, opacity:0.55 }}>
      Madhu Educational Academy · cvkrishnaveni.blogspot.com
    </div>
  </div>
);

const ReportHeaderBlock = ({ ci, title, extra }) => (
  <div style={{ textAlign:"center", borderBottom:`3px solid ${C.primary}`, paddingBottom:12, marginBottom:16 }}>
    <div style={{ fontSize:13, fontWeight:700, color:C.primary }}>{ci.college}</div>
    <div style={{ fontSize:11, color:"#555", marginTop:2 }}>
      {ci.department && `Department of ${ci.department}`}
      {ci.program && ` | ${ci.program}`}
      {ci.year && ` | Academic Year: ${ci.year}`}
    </div>
    <div style={{ fontSize:19, fontWeight:800, color:C.primary, letterSpacing:1.5, margin:"7px 0 4px", fontFamily:"Georgia,serif" }}>
      {title}
    </div>
    <div style={{ fontSize:11, color:"#444" }}>
      <b>Course:</b> {ci.courseName} {ci.courseCode && `(${ci.courseCode})`}
      {ci.semester && ` | Semester: ${ci.semester}`}
      {ci.faculty && ` | Faculty: ${ci.faculty}`}
      {extra}
    </div>
  </div>
);

const SignatureBlock = () => (
  <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, fontSize:11, color:"#555" }}>
    {["Faculty Signature","HOD Signature","Principal / IQAC"].map(t => (
      <div key={t} style={{ textAlign:"center" }}>
        <div style={{ borderTop:`1px solid #333`, paddingTop:4, width:170 }}>{t}</div>
      </div>
    ))}
  </div>
);

const ReportCredit = () => (
  <div style={{ marginTop:12, fontSize:9, color:"#aaa", textAlign:"center" }}>
    Designed &amp; Developed by Dr. C. V. Krishnaveni · SKR &amp; SKR GCW (Autonomous), Kadapa ·
    © {new Date().getFullYear()} Dr. C. V. Krishnaveni · OER: CC BY 4.0 · {new Date().toLocaleDateString("en-IN")}
  </div>
);

const ModuleStepBar = ({ steps, step, setStep }) => (
  <div style={{ display:"flex", gap:6, justifyContent:"center", padding:"12px 0 8px",
    background:"#dce8f5", borderBottom:`1px solid ${C.border}`, flexWrap:"wrap" }}>
    {steps.map((s,i) => (
      <div key={i} onClick={()=>step>i+1 && setStep(i+1)}
        style={{ display:"flex", flexDirection:"column", alignItems:"center",
          padding:"7px 18px", borderRadius:8, cursor:step<i+1?"default":"pointer",
          background:step===i+1?C.primary:step>i+1?C.yes:"#d5e5f5",
          color:step>=i+1?"#fff":"#777", transition:"all 0.2s", minWidth:80 }}>
        <div style={{ fontWeight:"bold", fontSize:13 }}>{step>i+1?"✓":i+1}</div>
        <div style={{ fontSize:10, marginTop:1 }}>{s}</div>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — CO-PO MAPPING
// ═══════════════════════════════════════════════════════════════════════════════
function MappingModule({ shared }) {
  const { ci, setCi, coCount, setCoCount, coLabels, setCoLabels, matrix, setMatrix } = shared;
  const [step, setStep] = useState(1);

  const toggleCell = (co, po) => setMatrix(prev => {
    const n = prev.map(r=>[...r]); n[co][po]=!n[co][po]; return n;
  });

  const downloadCSV = () => {
    const header = ["CO / PO", ...POS.map((p,i)=>`${p}: ${PO_LABELS[i]}`)];
    const rows = Array.from({length:coCount},(_,i)=>[coLabels[i], ...POS.map((_,j)=>matrix[i][j]?"Yes":"No")]);
    const summ = [[],["PO","COs Mapped"],...POS.map((p,j)=>[p,matrix.slice(0,coCount).filter(r=>r[j]).length])];
    csvDownload([header,...rows,...summ], `CO-PO-Mapping-${ci.courseCode||"course"}.csv`);
  };

  const copyText = () => {
    const header = ["Course Outcome",...POS].join("\t");
    const body = Array.from({length:coCount},(_,i)=>[coLabels[i],...POS.map((_,j)=>matrix[i][j]?"✔":"—")].join("\t"));
    navigator.clipboard.writeText([header,...body].join("\n"));
    alert("✅ Copied! Paste into Word or Notepad.");
  };

  // Step 1 — Course Info
  const S1 = () => (
    <Card>
      <div style={ST.stepTitle}>📋 Step 1 — Course Details</div>
      <Hint>Fill in your course information. Course Name is required to proceed.</Hint>
      <div style={ST.grid2}>
        {[["College / Institution","college"],["Department","department"],
          ["Program","program"],["Course Name *","courseName"],
          ["Course Code","courseCode"],["Faculty Name","faculty"],
          ["Semester","semester"],["Academic Year","year"]
        ].map(([l,k])=>(
          <Field key={k} label={l} value={ci[k]} onChange={v=>setCi(p=>({...p,[k]:v}))} />
        ))}
      </div>
      <Btn onClick={()=>setStep(2)} disabled={!ci.courseName}>Next: Define Course Outcomes →</Btn>
    </Card>
  );

  // Step 2 — COs
  const S2 = () => (
    <Card>
      <div style={ST.stepTitle}>🎯 Step 2 — Course Outcomes</div>
      <Hint>Select how many COs your course has and type each CO statement.</Hint>
      <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:18 }}>
        <span style={ST.label}>Number of COs:</span>
        {[3,4,5,6].map(n=>(
          <button key={n} onClick={()=>setCoCount(n)} style={{
            ...ST.smallBtn,
            background:coCount===n?C.primary:"#e0eaf5",
            color:coCount===n?"#fff":C.primary
          }}>{n}</button>
        ))}
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {Array.from({length:coCount},(_,i)=>(
          <Field key={i} label={`CO${i+1} Statement`} value={coLabels[i]}
            onChange={v=>{ const n=[...coLabels]; n[i]=v; setCoLabels(n); }}
            placeholder={`CO${i+1}: Students will be able to...`} />
        ))}
      </div>
      <div style={{ display:"flex", gap:10, marginTop:20 }}>
        <Btn variant="outline" onClick={()=>setStep(1)}>← Back</Btn>
        <Btn onClick={()=>setStep(3)}>Next: Map COs to POs →</Btn>
      </div>
    </Card>
  );

  // Step 3 — Matrix
  const S3 = () => (
    <Card>
      <div style={ST.stepTitle}>🗺️ Step 3 — CO-PO Matrix</div>
      <Hint>Click each cell to toggle: <b style={{color:C.yes}}>Green ✔ = Mapped</b> · <b style={{color:C.no}}>Red ✗ = Not Mapped</b>. Hover over PO headers to see full names.</Hint>
      <div style={{ overflowX:"auto" }}>
        <table style={ST.table}>
          <thead>
            <tr>
              <th style={{ ...ST.th, width:200, textAlign:"left", position:"sticky", left:0, zIndex:2 }}>
                Course Outcome
              </th>
              {POS.map((p,i) => (
                <th key={p} style={{ ...ST.th, minWidth:50 }} title={PO_LABELS[i]}>
                  <div>{p}</div>
                  <div style={{ fontSize:8, fontWeight:400, opacity:0.85, marginTop:1 }}>
                    {PO_LABELS[i].split("/")[0].substring(0,7)}
                  </div>
                </th>
              ))}
              <th style={{ ...ST.th, background:C.accent }}>Count</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({length:coCount},(_,i) => (
              <tr key={i} style={{ background:i%2===0?"#f7faff":"#fff" }}>
                <td style={{ ...ST.td, fontWeight:600, fontSize:11, position:"sticky", left:0,
                  background:i%2===0?"#f0f5fb":"#fff", zIndex:1, maxWidth:200, whiteSpace:"normal" }}>
                  {coLabels[i] || `CO${i+1}`}
                </td>
                {POS.map((_,j) => (
                  <td key={j} style={ST.td}>
                    <MappingCell val={matrix[i][j]} onClick={()=>toggleCell(i,j)} />
                  </td>
                ))}
                <td style={{ ...ST.td, fontWeight:"bold", color:C.accent, textAlign:"center" }}>
                  {matrix[i].filter(Boolean).length}/{POS.length}
                </td>
              </tr>
            ))}
            <tr style={{ background:"#e8f0fb" }}>
              <td style={{ ...ST.td, fontWeight:700, fontSize:11, position:"sticky", left:0, background:"#ddeaff", zIndex:1 }}>
                COs mapped →
              </td>
              {POS.map((_,j) => (
                <td key={j} style={{ ...ST.td, textAlign:"center", fontWeight:"bold", color:C.primary }}>
                  {matrix.slice(0,coCount).filter(r=>r[j]).length}
                </td>
              ))}
              <td style={ST.td}/>
            </tr>
          </tbody>
        </table>
      </div>
      <div style={{ display:"flex", gap:10, marginTop:18, flexWrap:"wrap" }}>
        <Btn variant="outline" onClick={()=>setStep(2)}>← Back</Btn>
        <Btn onClick={()=>setStep(4)}>Generate Mapping Report →</Btn>
      </div>
    </Card>
  );

  // Step 4 — Mapping Report
  const S4 = () => (
    <div>
      <Card style={{ padding:"14px 20px" }}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
          <Btn onClick={()=>window.print()}>🖨️ Print / Save as PDF</Btn>
          <Btn variant="success" onClick={downloadCSV}>📊 Download Excel (CSV)</Btn>
          <Btn variant="purple" onClick={copyText}>📋 Copy-Paste</Btn>
          <Btn variant="outline" onClick={()=>setStep(3)}>← Edit Mapping</Btn>
        </div>
      </Card>
      <div id="printable-mapping">
        <Card>
          <ReportHeaderBlock ci={ci} title="CO – PO MAPPING" />

          <SectionTitle>Program Outcomes Reference</SectionTitle>
          <div style={{ overflowX:"auto", marginBottom:14 }}>
            <table style={{ ...ST.table, fontSize:10 }}>
              <thead>
                <tr>{POS.map((p,i) => (
                  <th key={p} style={{ ...ST.th, fontSize:9, padding:"4px 3px" }}>
                    {p}<br/><span style={{ fontWeight:400 }}>{PO_LABELS[i]}</span>
                  </th>
                ))}</tr>
              </thead>
            </table>
          </div>

          <SectionTitle>Course Outcome Statements</SectionTitle>
          <table style={{ ...ST.table, fontSize:11, marginBottom:14 }}>
            <tbody>
              {Array.from({length:coCount},(_,i) => (
                <tr key={i} style={{ background:i%2===0?"#f7faff":"#fff" }}>
                  <td style={{ ...ST.td, width:60, fontWeight:700, color:C.primary }}>CO{i+1}</td>
                  <td style={ST.td}>{coLabels[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <SectionTitle>CO-PO Mapping Matrix</SectionTitle>
          <div style={{ overflowX:"auto", marginBottom:14 }}>
            <table style={{ ...ST.table, fontSize:11 }}>
              <thead>
                <tr>
                  <th style={{ ...ST.th, textAlign:"left", width:70 }}>CO / PO</th>
                  {POS.map(p => <th key={p} style={{ ...ST.th, minWidth:38 }}>{p}</th>)}
                  <th style={{ ...ST.th, background:C.accent }}>Count</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({length:coCount},(_,i) => (
                  <tr key={i} style={{ background:i%2===0?"#f7faff":"#fff" }}>
                    <td style={{ ...ST.td, fontWeight:700, color:C.primary }}>CO{i+1}</td>
                    {POS.map((_,j) => (
                      <td key={j} style={{ ...ST.td, textAlign:"center", fontWeight:"bold",
                        color:matrix[i][j]?C.yes:"#ccc", background:matrix[i][j]?"#d4edda":"transparent" }}>
                        {matrix[i][j]?"Yes":"—"}
                      </td>
                    ))}
                    <td style={{ ...ST.td, textAlign:"center", fontWeight:"bold", color:C.accent }}>
                      {matrix[i].filter(Boolean).length}/{POS.length}
                    </td>
                  </tr>
                ))}
                <tr style={{ background:"#ddeaff", fontWeight:"bold" }}>
                  <td style={{ ...ST.td, fontWeight:700 }}>COs Mapped</td>
                  {POS.map((_,j) => (
                    <td key={j} style={{ ...ST.td, textAlign:"center", color:C.primary, fontWeight:"bold" }}>
                      {matrix.slice(0,coCount).filter(r=>r[j]).length}
                    </td>
                  ))}
                  <td style={ST.td}/>
                </tr>
              </tbody>
            </table>
          </div>

          <SectionTitle>PO-wise Summary</SectionTitle>
          <table style={{ ...ST.table, fontSize:11, marginBottom:14 }}>
            <thead>
              <tr>
                <th style={ST.th}>PO</th>
                <th style={{ ...ST.th, textAlign:"left" }}>Program Outcome</th>
                <th style={ST.th}>COs Mapped</th>
                <th style={{ ...ST.th, textAlign:"left" }}>Mapped COs</th>
              </tr>
            </thead>
            <tbody>
              {POS.map((p,j) => {
                const mapped = Array.from({length:coCount},(_,i)=>matrix[i][j]?`CO${i+1}`:null).filter(Boolean);
                return (
                  <tr key={p} style={{ background:j%2===0?"#f7faff":"#fff" }}>
                    <td style={{ ...ST.td, fontWeight:700, color:C.primary, textAlign:"center" }}>{p}</td>
                    <td style={{ ...ST.td, fontSize:10 }}>{PO_LABELS[j]}</td>
                    <td style={{ ...ST.td, textAlign:"center", fontWeight:"bold", color:mapped.length?C.yes:"#aaa" }}>{mapped.length}</td>
                    <td style={{ ...ST.td, color:C.yes, fontSize:10 }}>{mapped.join(", ")||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <SignatureBlock />
          <ReportCredit />
        </Card>
      </div>
    </div>
  );

  return (
    <div>
      <ModuleStepBar steps={["Course Info","Course Outcomes","CO-PO Matrix","Report"]} step={step} setStep={setStep} />
      <div style={ST.content}>
        {step===1 && <S1/>}
        {step===2 && <S2/>}
        {step===3 && <S3/>}
        {step===4 && <S4/>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — CO-PO ATTAINMENT
// ═══════════════════════════════════════════════════════════════════════════════
function AttainmentModule({ shared }) {
  const { ci, coCount, coLabels, matrix } = shared;
  const [step, setStep] = useState(1);
  const [studentCount, setStudentCount] = useState(30);
  const [maxMarks, setMaxMarks] = useState(Array(MAX_COS).fill(20));
  const [studentMarks, setStudentMarks] = useState(
    Array.from({length:120}, ()=>Array(MAX_COS).fill(0))
  );
  const [results, setResults] = useState(null);

  const updateMark = (s, c, v) => setStudentMarks(prev => {
    const n = prev.map(r=>[...r]); n[s][c]=parseFloat(v)||0; return n;
  });
  const updateMax = (i, v) => setMaxMarks(prev => { const n=[...prev]; n[i]=parseInt(v)||1; return n; });

  const calculate = () => {
    const n = studentCount;
    const thresh = Array.from({length:coCount},(_,ci) => {
      const mx=maxMarks[ci], thr=mx*0.6;
      return (studentMarks.slice(0,n).filter(r=>r[ci]>=thr).length/n)*100;
    });
    const avgPct = Array.from({length:coCount},(_,ci) => {
      const mx=maxMarks[ci];
      return (studentMarks.slice(0,n).reduce((s,r)=>s+r[ci],0)/n/mx)*100;
    });
    const threshLvl = thresh.map(attainLevel);
    const avgLvl    = avgPct.map(attainLevel);
    const finalLvl  = Array.from({length:coCount},(_,i)=>Math.round((threshLvl[i]+avgLvl[i])/2));
    const poLvl = POS.map((_,j) => {
      const mapped = Array.from({length:coCount},(_,i)=>matrix[i][j]?finalLvl[i]:null).filter(v=>v!==null);
      return mapped.length ? parseFloat((mapped.reduce((s,v)=>s+v,0)/mapped.length).toFixed(2)) : 0;
    });
    setResults({ thresh, avgPct, threshLvl, avgLvl, finalLvl, poLvl, n });
    setStep(2);
  };

  const downloadCSV = () => {
    if(!results) return;
    const { thresh, avgPct, threshLvl, avgLvl, finalLvl, poLvl } = results;
    const h1 = ["CO","CO Statement","Method1 %","M1 Level","Method2 %","M2 Level","Final Level"];
    const r1 = Array.from({length:coCount},(_,i)=>[`CO${i+1}`,coLabels[i],thresh[i].toFixed(1),threshLvl[i],avgPct[i].toFixed(1),avgLvl[i],finalLvl[i]]);
    const h2 = ["PO","Program Outcome","Attainment Value","Level"];
    const r2 = POS.map((p,j)=>[p,PO_LABELS[j],poLvl[j].toFixed(2),Math.round(poLvl[j])]);
    csvDownload([h1,...r1,[],...[h2,...r2]], `CO-PO-Attainment-${ci.courseCode||"course"}.csv`);
  };

  const copyReport = () => {
    if(!results) return;
    const { finalLvl, poLvl } = results;
    let t = `CO-PO ATTAINMENT REPORT\n${ci.courseName} (${ci.courseCode}) | ${ci.faculty}\n\nCO ATTAINMENT\n`;
    Array.from({length:coCount},(_,i) => { t+=`CO${i+1}: ${coLabels[i]} → Level ${finalLvl[i]}\n`; });
    t += `\nPO ATTAINMENT\n`;
    POS.forEach((p,j) => { if(poLvl[j]>0) t+=`${p}: ${PO_LABELS[j]} → ${poLvl[j].toFixed(2)} (Level ${Math.round(poLvl[j])})\n`; });
    navigator.clipboard.writeText(t);
    alert("✅ Attainment report copied!");
  };

  const barColors = [C.l0, C.l1, C.l2, C.l3];
  const chartOpts = {
    responsive:true, maintainAspectRatio:false,
    scales:{ y:{ min:0, max:3, ticks:{ stepSize:1 }, grid:{ color:"#eee" } } },
    plugins:{ legend:{ display:false } }
  };

  // Step 1 — Marks entry
  const A1 = () => (
    <Card>
      <div style={ST.stepTitle}>📝 Enter Student Marks — Semester End Exam</div>
      <Hint>
        Enter total students and max marks per CO question in the exam paper, then enter each student's score per CO.
        <br/>The CO-PO Mapping from Module 1 is used automatically — complete that first for PO Attainment.
      </Hint>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"center", marginBottom:14 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={ST.label}>No. of students:</span>
          <input type="number" style={{ ...ST.input, width:80 }}
            value={studentCount} min={1} max={120}
            onChange={e=>setStudentCount(parseInt(e.target.value)||1)} />
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <div style={ST.label}>Max Marks per CO (in question paper):</div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:6 }}>
          {Array.from({length:coCount},(_,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:4 }}>
              <span style={{ fontSize:11, color:"#555" }}>CO{i+1}:</span>
              <input type="number" style={{ ...ST.input, width:66 }}
                value={maxMarks[i]} min={1}
                onChange={e=>updateMax(i,e.target.value)} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={ST.table}>
          <thead>
            <tr>
              <th style={{ ...ST.th, width:68, textAlign:"left" }}>Student</th>
              {Array.from({length:coCount},(_,i) => (
                <th key={i} style={{ ...ST.th, minWidth:76 }}>
                  CO{i+1}<br/>
                  <span style={{ fontSize:9, fontWeight:400, opacity:0.8 }}>Max: {maxMarks[i]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({length:studentCount},(_,s) => (
              <tr key={s} style={{ background:s%2===0?"#f7faff":"#fff" }}>
                <td style={{ ...ST.td, fontWeight:600, fontSize:11 }}>S{s+1}</td>
                {Array.from({length:coCount},(_,c) => (
                  <td key={c} style={ST.td}>
                    <input type="number" style={{ ...ST.input, width:66, padding:"4px 6px", fontSize:12 }}
                      value={studentMarks[s][c]} min={0} max={maxMarks[c]}
                      onChange={e=>updateMark(s,c,e.target.value)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop:16, display:"flex", gap:10 }}>
        <Btn onClick={calculate}>Calculate CO-PO Attainment →</Btn>
      </div>
    </Card>
  );

  // Step 2 — Full Attainment Report
  const A2 = () => {
    if(!results) return null;
    const { thresh, avgPct, threshLvl, avgLvl, finalLvl, poLvl, n } = results;
    const avg = arr => (arr.reduce((s,v)=>s+v,0)/arr.length).toFixed(2);

    const coChartData = {
      labels: Array.from({length:coCount},(_,i)=>`CO${i+1}`),
      datasets:[{ data:finalLvl, backgroundColor:finalLvl.map(l=>barColors[l]), borderRadius:5 }]
    };
    const poChartData = {
      labels: POS,
      datasets:[{ data:poLvl.map(v=>parseFloat(v.toFixed(2))), backgroundColor:poLvl.map(v=>barColors[Math.round(v)]), borderRadius:5 }]
    };

    return (
      <div>
        <Card style={{ padding:"14px 20px" }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            <Btn onClick={()=>window.print()}>🖨️ Print / Save as PDF</Btn>
            <Btn variant="success" onClick={downloadCSV}>📊 Download CSV</Btn>
            <Btn variant="purple" onClick={copyReport}>📋 Copy Summary</Btn>
            <Btn variant="outline" onClick={()=>setStep(1)}>← Edit Marks</Btn>
          </div>
        </Card>

        <div id="printable-attainment">
          <Card>
            <ReportHeaderBlock ci={ci} title="CO – PO ATTAINMENT REPORT" extra={` | Students: ${n}`} />

            {/* Summary metrics */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:16 }}>
              {[
                ["Avg CO Attainment", avg(finalLvl)],
                ["Avg PO Attainment", avg(poLvl.filter(v=>v>0))],
                [`COs at Level ≥ 2`, `${finalLvl.filter(v=>v>=2).length} / ${coCount}`],
                ["POs Attained (>0)", `${poLvl.filter(v=>v>0).length} / 12`],
              ].map(([l,v]) => (
                <div key={l} style={{ background:C.light, borderRadius:8, padding:"10px 14px", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:"#666", marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:22, fontWeight:800, color:C.primary }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Two methods */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <SectionTitle>Method 1 — Threshold (60/60 rule)</SectionTitle>
                <Hint>% of students scoring ≥ 60% of max marks per CO</Hint>
                <table style={ST.table}>
                  <thead><tr>
                    <th style={ST.th}>CO</th>
                    <th style={ST.th}>% Students ≥ 60%</th>
                    <th style={ST.th}>Level</th>
                  </tr></thead>
                  <tbody>{Array.from({length:coCount},(_,i) => (
                    <tr key={i} style={{ background:i%2===0?"#f7faff":"#fff" }}>
                      <td style={{ ...ST.td, fontWeight:700, color:C.primary, textAlign:"center" }}>CO{i+1}</td>
                      <td style={{ ...ST.td, textAlign:"center" }}>{thresh[i].toFixed(1)}%</td>
                      <td style={{ ...ST.td, textAlign:"center" }}><LevelBadge l={threshLvl[i]}/></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div>
                <SectionTitle>Method 2 — Average Marks Method</SectionTitle>
                <Hint>Average % score per CO across all students</Hint>
                <table style={ST.table}>
                  <thead><tr>
                    <th style={ST.th}>CO</th>
                    <th style={ST.th}>Avg % Score</th>
                    <th style={ST.th}>Level</th>
                  </tr></thead>
                  <tbody>{Array.from({length:coCount},(_,i) => (
                    <tr key={i} style={{ background:i%2===0?"#f7faff":"#fff" }}>
                      <td style={{ ...ST.td, fontWeight:700, color:C.primary, textAlign:"center" }}>CO{i+1}</td>
                      <td style={{ ...ST.td, textAlign:"center" }}>{avgPct[i].toFixed(1)}%</td>
                      <td style={{ ...ST.td, textAlign:"center" }}><LevelBadge l={avgLvl[i]}/></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>

            {/* Final CO Attainment */}
            <SectionTitle>Final CO Attainment (Average of Both Methods)</SectionTitle>
            <table style={{ ...ST.table, marginBottom:14 }}>
              <thead><tr>
                <th style={ST.th}>CO</th>
                <th style={{ ...ST.th, textAlign:"left" }}>CO Statement</th>
                <th style={ST.th}>Method 1</th>
                <th style={ST.th}>Method 2</th>
                <th style={ST.th}>Final Level</th>
              </tr></thead>
              <tbody>{Array.from({length:coCount},(_,i) => (
                <tr key={i} style={{ background:i%2===0?"#f7faff":"#fff" }}>
                  <td style={{ ...ST.td, fontWeight:700, color:C.primary, textAlign:"center" }}>CO{i+1}</td>
                  <td style={{ ...ST.td, fontSize:11 }}>{coLabels[i]}</td>
                  <td style={{ ...ST.td, textAlign:"center" }}><LevelBadge l={threshLvl[i]}/></td>
                  <td style={{ ...ST.td, textAlign:"center" }}><LevelBadge l={avgLvl[i]}/></td>
                  <td style={{ ...ST.td, textAlign:"center" }}><LevelBadge l={finalLvl[i]}/></td>
                </tr>
              ))}</tbody>
            </table>

            {/* PO Attainment */}
            <SectionTitle>PO Attainment (from CO-PO Mapping × CO Levels)</SectionTitle>
            <table style={{ ...ST.table, marginBottom:14 }}>
              <thead><tr>
                <th style={ST.th}>PO</th>
                <th style={{ ...ST.th, textAlign:"left" }}>Program Outcome</th>
                <th style={ST.th}>Mapped COs</th>
                <th style={ST.th}>Attainment</th>
                <th style={ST.th}>Level</th>
              </tr></thead>
              <tbody>{POS.map((p,j) => {
                const mapped = Array.from({length:coCount},(_,i)=>matrix[i][j]?`CO${i+1}`:null).filter(Boolean);
                return (
                  <tr key={p} style={{ background:j%2===0?"#f7faff":"#fff" }}>
                    <td style={{ ...ST.td, fontWeight:700, color:C.primary, textAlign:"center" }}>{p}</td>
                    <td style={{ ...ST.td, fontSize:10 }}>{PO_LABELS[j]}</td>
                    <td style={{ ...ST.td, fontSize:10, color:C.yes }}>{mapped.join(", ")||"—"}</td>
                    <td style={{ ...ST.td, textAlign:"center", fontWeight:700 }}>{poLvl[j].toFixed(2)}</td>
                    <td style={{ ...ST.td, textAlign:"center" }}>
                      {mapped.length
                        ? <LevelBadge l={Math.round(poLvl[j])}/>
                        : <span style={{ color:"#bbb", fontSize:10 }}>Not mapped</span>}
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>

            {/* Charts */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              <div>
                <SectionTitle>CO Attainment — Bar Chart</SectionTitle>
                <div style={{ position:"relative", height:200 }}>
                  <Bar data={coChartData} options={chartOpts}/>
                </div>
              </div>
              <div>
                <SectionTitle>PO Attainment — Bar Chart</SectionTitle>
                <div style={{ position:"relative", height:200 }}>
                  <Bar data={poChartData} options={{ ...chartOpts,
                    scales:{ ...chartOpts.scales, x:{ ticks:{ font:{ size:9 } } } } }}/>
                </div>
              </div>
            </div>

            {/* Scale legend */}
            <div style={{ display:"flex", gap:14, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:11, fontWeight:700, color:"#555" }}>Scale:</span>
              {[[0,"< 50%"],[1,"50–59%"],[2,"60–69%"],[3,"≥ 70%"]].map(([l,r]) => (
                <span key={l} style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11 }}>
                  <span style={{ width:12, height:12, borderRadius:3, background:levelBg(l),
                    border:`1px solid ${levelColor(l)}`, display:"inline-block" }}/>
                  <b style={{ color:levelColor(l) }}>Level {l}</b> = {r}
                </span>
              ))}
            </div>

            <SignatureBlock />
            <ReportCredit />
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div>
      <ModuleStepBar steps={["Student Marks","Attainment Report"]} step={step} setStep={setStep}/>
      <div style={ST.content}>
        {step===1 && <A1/>}
        {step===2 && <A2/>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeTab, setActiveTab] = useState("mapping");

  // Shared state — entered once in Mapping, reused in Attainment
  const [ci, setCi] = useState({
    college:"SKR & SKR Government College for Women (Autonomous), Kadapa",
    department:"", courseName:"", courseCode:"",
    faculty:"", semester:"", year:"", program:""
  });
  const [coCount, setCoCount]   = useState(5);
  const [coLabels, setCoLabels] = useState(Array.from({length:MAX_COS},(_,i)=>`CO${i+1}: `));
  const [matrix, setMatrix]     = useState(Array.from({length:MAX_COS},()=>Array(12).fill(false)));

  const shared = { ci, setCi, coCount, setCoCount, coLabels, setCoLabels, matrix, setMatrix };

  return (
    <div style={ST.outer}>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #printable-mapping, #printable-mapping *,
          #printable-attainment, #printable-attainment * { visibility: visible !important; }
          #printable-mapping, #printable-attainment {
            position: absolute !important; left: 0 !important;
            top: 0 !important; width: 100% !important; padding: 20px !important;
          }
        }
        input:focus { outline: 2px solid #1a4f8a; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={ST.topbar}>
        <div style={{ fontSize:21, fontWeight:800, letterSpacing:0.4, fontFamily:"Georgia,serif" }}>
          📐 CO–PO Mapping &amp; Attainment Tool
        </div>
        <div style={{ fontSize:11, opacity:0.82, marginTop:2 }}>
          NAAC-Ready · Mapping + Attainment in One Place · Designed for All Faculty
        </div>
      </div>

      {/* Module tabs */}
      <div style={{ background:"#1a3f70", display:"flex", padding:"0 24px", flexWrap:"wrap" }}>
        {[
          ["mapping",    "📋 CO-PO Mapping",    "Define which COs link to which POs"],
          ["attainment", "📊 CO-PO Attainment",  "Calculate levels from student marks"],
        ].map(([id,label,sub]) => (
          <div key={id} onClick={()=>setActiveTab(id)} style={{
            padding:"12px 24px 10px", cursor:"pointer",
            borderBottom:activeTab===id?"3px solid #f0c040":"3px solid transparent",
            color:activeTab===id?"#f0c040":"#aac4e8",
            transition:"all 0.18s", userSelect:"none"
          }}>
            <div style={{ fontSize:14, fontWeight:700 }}>{label}</div>
            <div style={{ fontSize:10, opacity:0.75, marginTop:1 }}>{sub}</div>
          </div>
        ))}
        <div style={{ marginLeft:"auto", padding:"14px 4px 0", fontSize:10, color:"#7aa3cc" }}>
          ℹ️ Course details &amp; mapping entered here carry over to Attainment tab
        </div>
      </div>

      {/* Active module */}
      {activeTab==="mapping"    && <MappingModule    shared={shared}/>}
      {activeTab==="attainment" && <AttainmentModule shared={shared}/>}

      <Footer />
    </div>
  );
}

// ─── Styles object ─────────────────────────────────────────────────────────────
const ST = {
  outer:{ fontFamily:"'Segoe UI',Arial,sans-serif", background:C.bg, minHeight:"100vh", paddingBottom:40 },
  topbar:{ background:`linear-gradient(120deg,${C.primary} 65%,#2d6bc4)`, color:"#fff",
    padding:"16px 28px 12px", boxShadow:"0 3px 16px #1a4f8a33" },
  content:{ maxWidth:1120, margin:"22px auto", padding:"0 16px" },
  card:{ background:"#fff", borderRadius:12, padding:"24px 28px",
    boxShadow:"0 2px 16px #1a4f8a14", marginBottom:18 },
  stepTitle:{ fontSize:17, fontWeight:800, color:C.primary, marginBottom:7, fontFamily:"Georgia,serif" },
  hint:{ fontSize:12, color:"#666", marginBottom:14, lineHeight:1.65 },
  grid2:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 22px", marginBottom:18 },
  field:{ display:"flex", flexDirection:"column", gap:4 },
  label:{ fontSize:12, fontWeight:600, color:"#444" },
  input:{ padding:"8px 11px", border:`1.5px solid ${C.border}`, borderRadius:7,
    fontSize:13, background:C.light, color:"#222" },
  btn:{ background:C.primary, color:"#fff", border:"none", borderRadius:8,
    padding:"9px 20px", fontWeight:700, fontSize:13, cursor:"pointer",
    boxShadow:"0 2px 6px #1a4f8a28" },
  btnOut:{ background:"#fff", color:C.primary, border:`2px solid ${C.primary}`,
    borderRadius:8, padding:"9px 18px", fontWeight:700, fontSize:13, cursor:"pointer" },
  smallBtn:{ padding:"6px 14px", borderRadius:6, border:`1.5px solid ${C.primary}`,
    fontWeight:700, fontSize:13, cursor:"pointer" },
  table:{ borderCollapse:"collapse", width:"100%", fontSize:12, border:`1px solid ${C.border}` },
  th:{ background:C.primary, color:"#fff", padding:"7px 6px", textAlign:"center",
    fontWeight:700, fontSize:11, border:`1px solid #3a6aaa` },
  td:{ padding:"5px 6px", border:`1px solid ${C.border}`, fontSize:12, verticalAlign:"middle" },
  sectionTitle:{ fontSize:12, fontWeight:700, color:C.primary, marginBottom:6,
    borderLeft:`4px solid ${C.accent}`, paddingLeft:8 },
};
