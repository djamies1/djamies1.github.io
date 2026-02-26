import { useState, useCallback } from "react";

const PROFILE = `
Name: David Jamieson
Location: Kirkland/Bothell, WA (Seattle area)
Role Target: Business Intelligence Engineer, BI Developer, Data Engineer, Analytics Engineer
Skills: SQL, Python, AWS (Redshift, SageMaker, QuickSight, S3), Power BI, ETL, Data Warehousing, Machine Learning, QuickSight, DOMO, Microsoft Dynamics, VBA, Advanced Excel
Experience: 10+ years in BI, FP&A, data warehousing, and analytics. Currently at Amazon as a BI Engineer.
Certifications: AWS Certified AI Practitioner, AWS Certified Cloud Practitioner, Microsoft Certified Data Analyst Associate
Education: UW Certificate in Business Intelligence, ASU BS Accountancy
Preferences: Remote-first, but open to hybrid/onsite in Seattle/Kirkland/Bothell/Redmond area
`;

const JOB_BOARDS = [
  { name: "LinkedIn", url: "linkedin.com/jobs" },
  { name: "Indeed", url: "indeed.com" },
  { name: "Greenhouse", url: "greenhouse.io" },
  { name: "Lever", url: "jobs.lever.co" },
  { name: "Wellfound", url: "wellfound.com" },
];

const COMPANY_CAREER_PAGES = [
  { name: "Microsoft", url: "careers.microsoft.com", tags: ["BI", "Data"] },
  { name: "Google", url: "careers.google.com", tags: ["BI", "Analytics"] },
  { name: "Tableau / Salesforce", url: "salesforce.com/company/careers", tags: ["BI"] },
  { name: "Databricks", url: "databricks.com/company/careers", tags: ["Data", "ML"] },
  { name: "dbt Labs", url: "getdbt.com/careers", tags: ["Analytics"] },
  { name: "Snowflake", url: "careers.snowflake.com", tags: ["Data"] },
  { name: "Stripe", url: "stripe.com/jobs", tags: ["Data", "Analytics"] },
  { name: "Figma", url: "figma.com/careers", tags: ["BI", "Data"] },
  { name: "Expedia", url: "careers.expediagroup.com", tags: ["BI", "Seattle"] },
  { name: "Boeing", url: "boeing.com/careers", tags: ["Analytics", "Seattle"] },
  { name: "Costco", url: "costco.com/jobs.html", tags: ["BI", "Local"] },
  { name: "T-Mobile", url: "careers.t-mobile.com", tags: ["BI", "Seattle"] },
  { name: "Redfin", url: "redfin.com/about/jobs", tags: ["Data", "Seattle"] },
  { name: "Zillow", url: "zillow.com/careers", tags: ["Data", "Seattle"] },
  { name: "Convoy", url: "convoy.com/careers", tags: ["BI", "Seattle"] },
];

const SEARCH_QUERIES = [
  "Business Intelligence Engineer remote 2025",
  "BI Developer remote AWS Redshift",
  "Analytics Engineer remote SQL Python",
  "Data Engineer remote AWS Seattle",
  "Business Intelligence Engineer Seattle Bellevue Kirkland",
  "Senior BI Engineer Power BI QuickSight",
];

function ScoreBar({ score }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? "#00e5a0" : pct >= 60 ? "#f0b429" : "#e05c5c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{
        flex: 1, height: 4, background: "rgba(255,255,255,0.08)",
        borderRadius: 2, overflow: "hidden"
      }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 11, color, fontFamily: "monospace", minWidth: 32 }}>{pct}%</span>
    </div>
  );
}

function JobCard({ job, index }) {
  const [expanded, setExpanded] = useState(false);
  const isRemote = job.location?.toLowerCase().includes("remote");
  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: "16px 20px",
        cursor: "pointer",
        transition: "border-color 0.2s, background 0.2s",
        animation: `fadeSlideIn 0.4s ease ${index * 0.06}s both`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = "rgba(0,229,160,0.3)";
        e.currentTarget.style.background = "rgba(0,229,160,0.04)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        e.currentTarget.style.background = "rgba(255,255,255,0.03)";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>
              {job.title}
            </span>
            {isRemote && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
                background: "rgba(0,229,160,0.15)", color: "#00e5a0",
                padding: "2px 8px", borderRadius: 20, textTransform: "uppercase"
              }}>Remote</span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, color: "#8892a4" }}>{job.company}</span>
            <span style={{ fontSize: 13, color: "#555f70" }}>·</span>
            <span style={{ fontSize: 13, color: "#8892a4" }}>{job.location}</span>
            {job.source && <span style={{ fontSize: 13, color: "#555f70" }}>· via {job.source}</span>}
          </div>
        </div>
        <div style={{ minWidth: 100 }}>
          <div style={{ fontSize: 10, color: "#555f70", marginBottom: 4, textAlign: "right" }}>Match</div>
          <ScoreBar score={job.matchScore || 0.7} />
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 13, color: "#8892a4", lineHeight: 1.7, margin: "0 0 12px" }}>{job.summary}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {(job.tags || []).map(t => (
              <span key={t} style={{
                fontSize: 11, padding: "3px 10px", borderRadius: 20,
                background: "rgba(255,255,255,0.06)", color: "#8892a4"
              }}>{t}</span>
            ))}
          </div>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: "inline-block", fontSize: 12, color: "#00e5a0",
                textDecoration: "none", borderBottom: "1px solid rgba(0,229,160,0.3)",
                paddingBottom: 1
              }}
            >
              View Posting →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressLog({ logs }) {
  return (
    <div style={{
      background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "12px 16px",
      fontFamily: "monospace", fontSize: 12, color: "#8892a4",
      maxHeight: 160, overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)"
    }}>
      {logs.map((log, i) => (
        <div key={i} style={{ marginBottom: 2 }}>
          <span style={{ color: "#00e5a0" }}>›</span> {log}
        </div>
      ))}
      {logs.length === 0 && <span style={{ color: "#3a4455" }}>Awaiting scan...</span>}
    </div>
  );
}

export default function JobScout() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("match");
  const [sources, setSources] = useState({ boards: true, companies: true });
  const [scanned, setScanned] = useState(false);

  const addLog = (msg) => setLogs(prev => [...prev, msg]);

  const callClaude = async (prompt) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }]
      })
    });
    const data = await response.json();
    return data.content.map(b => b.type === "text" ? b.text : "").join("\n");
  };

  const parseJobs = (text, source) => {
    const jobs = [];
    // Try to extract JSON array if model returned one
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map(j => ({ ...j, source: j.source || source }));
      } catch {}
    }
    return jobs;
  };

  const runScan = useCallback(async () => {
    setLoading(true);
    setJobs([]);
    setLogs([]);
    setScanned(false);
    const allJobs = [];

    try {
      if (sources.boards) {
        for (const query of SEARCH_QUERIES.slice(0, 4)) {
          addLog(`Searching job boards: "${query}"`);
          const prompt = `Search for job postings matching this query: "${query}".
          
Candidate profile:
${PROFILE}

Use web search to find REAL, current job postings from job boards like LinkedIn, Indeed, Greenhouse, Lever, Wellfound.
Return a JSON array (and ONLY the JSON array, no other text) of up to 4 relevant jobs with this structure:
[{
  "title": "Job Title",
  "company": "Company Name",
  "location": "Remote / City, ST",
  "url": "https://...",
  "summary": "2-3 sentence description of the role and why it fits this candidate",
  "tags": ["SQL", "Python", "AWS"],
  "matchScore": 0.0-1.0,
  "source": "${query.includes("remote") ? "Job Board" : "Job Board"}"
}]

Prioritize remote roles first, then Seattle-area. Only include real postings you find via search. Score matchScore honestly against the candidate's profile.`;
          
          try {
            const result = await callClaude(prompt);
            const parsed = parseJobs(result, "Job Board");
            if (parsed.length > 0) {
              allJobs.push(...parsed);
              setJobs([...allJobs]);
              addLog(`  Found ${parsed.length} postings`);
            } else {
              addLog(`  No structured results returned`);
            }
          } catch (e) {
            addLog(`  Error: ${e.message}`);
          }
        }
      }

      if (sources.companies) {
        const companiesBatch = COMPANY_CAREER_PAGES.slice(0, 8);
        addLog(`Scanning ${companiesBatch.length} company career pages...`);
        
        const batchPrompt = `Search for BI Engineer / Analytics Engineer / Data Engineer job openings at these specific companies:
${companiesBatch.map(c => `- ${c.name} (${c.url})`).join("\n")}

Candidate profile:
${PROFILE}

Use web search to find real, current openings. Return ONLY a JSON array of relevant jobs:
[{
  "title": "Job Title",
  "company": "Company Name", 
  "location": "Remote / City, ST",
  "url": "https://direct-link-to-job",
  "summary": "2-3 sentences on the role and fit",
  "tags": ["SQL","Python"],
  "matchScore": 0.0-1.0,
  "source": "Company Page"
}]

Only include real listings you find. Prioritize remote roles. Be honest with matchScore.`;

        try {
          const result = await callClaude(batchPrompt);
          const parsed = parseJobs(result, "Company Page");
          if (parsed.length > 0) {
            allJobs.push(...parsed);
            setJobs([...allJobs]);
            addLog(`Found ${parsed.length} openings across company career pages`);
          }
        } catch (e) {
          addLog(`Company page scan error: ${e.message}`);
        }

        // Second batch
        const batch2 = COMPANY_CAREER_PAGES.slice(8);
        if (batch2.length > 0) {
          addLog(`Scanning remaining ${batch2.length} companies...`);
          const batchPrompt2 = `Search for BI/Analytics/Data Engineer jobs at:
${batch2.map(c => `- ${c.name} (${c.url})`).join("\n")}

Candidate: BI Engineer, SQL+Python+AWS, Seattle area, remote preferred.
Return ONLY JSON array: [{"title","company","location","url","summary","tags":[],"matchScore","source":"Company Page"}]
Only real listings. Be concise.`;
          try {
            const result2 = await callClaude(batchPrompt2);
            const parsed2 = parseJobs(result2, "Company Page");
            if (parsed2.length > 0) {
              allJobs.push(...parsed2);
              setJobs([...allJobs]);
              addLog(`Found ${parsed2.length} more from company pages`);
            }
          } catch {}
        }
      }

      addLog(`Scan complete. ${allJobs.length} total positions found.`);
    } catch (e) {
      addLog(`Fatal error: ${e.message}`);
    } finally {
      setLoading(false);
      setScanned(true);
    }
  }, [sources]);

  const exportCSV = () => {
    const headers = ["Title", "Company", "Location", "Match Score", "Source", "Tags", "Summary", "URL"];
    const rows = filteredSorted.map(j => [
      j.title, j.company, j.location,
      `${Math.round((j.matchScore || 0.7) * 100)}%`,
      j.source, (j.tags || []).join("; "),
      j.summary, j.url
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `job-scout-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredSorted = jobs
    .filter(j => {
      if (filter === "remote") return j.location?.toLowerCase().includes("remote");
      if (filter === "local") return !j.location?.toLowerCase().includes("remote");
      if (filter === "boards") return j.source === "Job Board";
      if (filter === "companies") return j.source === "Company Page";
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "match") return (b.matchScore || 0.7) - (a.matchScore || 0.7);
      if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
      return 0;
    });

  const remoteCount = jobs.filter(j => j.location?.toLowerCase().includes("remote")).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0b0f17; }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: "#0b0f17",
        fontFamily: "'DM Sans', sans-serif", color: "#f0f0f0",
        padding: "0 0 60px"
      }}>
        {/* Header */}
        <div style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 40px",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "#00e5a0",
                animation: loading ? "pulse 1s infinite" : "none"
              }} />
              <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#00e5a0", textTransform: "uppercase", fontFamily: "'DM Mono', monospace" }}>
                Job Scout
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
              David's BI Job Radar
            </h1>
            <p style={{ fontSize: 13, color: "#555f70", marginTop: 2 }}>
              BI Engineer · SQL · Python · AWS · Seattle / Remote
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {jobs.length > 0 && (
              <button
                onClick={exportCSV}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent", color: "#8892a4", cursor: "pointer",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.target.style.borderColor = "rgba(255,255,255,0.3)"; e.target.style.color = "#f0f0f0"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.12)"; e.target.style.color = "#8892a4"; }}
              >
                ↓ Export CSV
              </button>
            )}
            <button
              onClick={runScan}
              disabled={loading}
              style={{
                padding: "9px 22px", borderRadius: 8,
                background: loading ? "rgba(0,229,160,0.15)" : "#00e5a0",
                border: "none", color: loading ? "#00e5a0" : "#0b0f17",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 8
              }}
            >
              {loading && <div style={{ width: 12, height: 12, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />}
              {loading ? "Scanning..." : scanned ? "Re-scan" : "Run Scan"}
            </button>
          </div>
        </div>

        <div style={{ padding: "0 40px", maxWidth: 1100, margin: "0 auto" }}>
          {/* Config row */}
          <div style={{
            display: "flex", gap: 16, marginTop: 28, flexWrap: "wrap"
          }}>
            <div style={{
              flex: 1, minWidth: 240, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px"
            }}>
              <div style={{ fontSize: 11, color: "#555f70", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Sources</div>
              {[
                { key: "boards", label: "Job Boards", sub: "LinkedIn, Indeed, Greenhouse, Lever" },
                { key: "companies", label: "Company Career Pages", sub: `${COMPANY_CAREER_PAGES.length} curated companies` }
              ].map(s => (
                <label key={s.key} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 10 }}>
                  <div
                    onClick={() => setSources(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                    style={{
                      width: 18, height: 18, borderRadius: 4,
                      background: sources[s.key] ? "#00e5a0" : "transparent",
                      border: sources[s.key] ? "none" : "1px solid rgba(255,255,255,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, transition: "all 0.2s"
                    }}
                  >
                    {sources[s.key] && <span style={{ color: "#0b0f17", fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#dde1e8" }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: "#555f70" }}>{s.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, flex: 2, minWidth: 300 }}>
              {[
                { label: "Total Found", value: jobs.length, color: "#f0f0f0" },
                { label: "Remote", value: remoteCount, color: "#00e5a0" },
                { label: "Local / Hybrid", value: jobs.length - remoteCount, color: "#f0b429" },
                { label: "Avg Match", value: jobs.length ? `${Math.round(jobs.reduce((a, j) => a + (j.matchScore || 0.7), 0) / jobs.length * 100)}%` : "—", color: "#a78bfa" },
              ].map(stat => (
                <div key={stat.label} style={{
                  flex: 1, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
                  padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center"
                }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: stat.color, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.02em" }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#555f70", marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress log */}
          {(loading || logs.length > 0) && (
            <div style={{ marginTop: 20 }}>
              <ProgressLog logs={logs} />
            </div>
          )}

          {/* Filters + results */}
          {jobs.length > 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28, marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {[["all", "All"], ["remote", "Remote"], ["local", "Local/Hybrid"], ["boards", "Job Boards"], ["companies", "Company Pages"]].map(([val, lbl]) => (
                    <button
                      key={val}
                      onClick={() => setFilter(val)}
                      style={{
                        padding: "6px 14px", borderRadius: 20, border: "1px solid",
                        borderColor: filter === val ? "rgba(0,229,160,0.5)" : "rgba(255,255,255,0.08)",
                        background: filter === val ? "rgba(0,229,160,0.1)" : "transparent",
                        color: filter === val ? "#00e5a0" : "#8892a4",
                        cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s"
                      }}
                    >{lbl}</button>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#555f70" }}>Sort:</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    style={{
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 6, color: "#8892a4", padding: "4px 8px", fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif"
                    }}
                  >
                    <option value="match">Best Match</option>
                    <option value="company">Company A–Z</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredSorted.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "#555f70" }}>
                    No results match this filter.
                  </div>
                ) : (
                  filteredSorted.map((job, i) => <JobCard key={`${job.company}-${job.title}-${i}`} job={job} index={i} />)
                )}
              </div>
            </>
          )}

          {!loading && !scanned && (
            <div style={{
              textAlign: "center", padding: "80px 0", color: "#3a4455"
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⌖</div>
              <div style={{ fontSize: 16, color: "#555f70", marginBottom: 8 }}>Ready to scan</div>
              <div style={{ fontSize: 13 }}>Configure your sources above and hit Run Scan</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
