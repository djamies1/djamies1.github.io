import type {
  Cert,
  EducationEntry,
  HeroStat,
  Job,
  SkillPillar,
} from "./types.ts";

/*
 * ════════════════════════════════════════════════════════════════
 * SINGLE SOURCE OF TRUTH for all résumé content.
 * Rendered by the page, the build-time JSON-LD, and the <noscript>
 * fallback — edit here, never in components.
 * Content mirrors davidjmn_resume.docx (2026). No phone number.
 * ════════════════════════════════════════════════════════════════
 */

export const CAREER_START_YEAR = 2013;

export const PERSON = {
  name: "David Jamieson",
  title: "Business Intelligence Engineer",
  org: "Amazon Leo (Project Kuiper)",
  location: "Kirkland, WA",
  email: "david.jamieson.bz@gmail.com",
  linkedin: "https://www.linkedin.com/in/david-jamieson-75314674/",
  site: "https://djamies1.github.io/resume/",
  taglines: [
    "Business Intelligence Engineer",
    "Financial platform builder",
    "AI & RAG practitioner",
    "Finance-native data engineer",
  ],
  summary:
    "BI engineer at Amazon Leo — sole technical owner of the finance org's production analytics platform. Thirteen years across accounting, FP&A, data engineering, and applied AI.",
};

export const yearsInData = () =>
  new Date().getFullYear() - CAREER_START_YEAR;

export const HERO_STATS: HeroStat[] = [
  {
    label: "years in data & finance",
    value: yearsInData(),
    suffix: "+",
    note: "since 2013",
  },
  { label: "roles across 5 companies", value: 7, note: "EY to Amazon" },
  {
    label: "domains spanned",
    value: 4,
    note: "Finance → BI → Cloud → AI",
  },
  { label: "certifications", value: 4, note: "AWS & Microsoft" },
];

export const JOBS: Job[] = [
  {
    id: "amazon-leo",
    role: "Business Intelligence Engineer",
    company: "Amazon",
    org: "Finance · Amazon Leo / Project Kuiper (Satellite Broadband)",
    location: "Seattle, WA",
    start: "2025-07-01",
    end: null,
    accent: "amazon",
    highlight: "🛰️ Satellite broadband · Finance",
    bullets: [
      "Sole technical owner for a ~130-person finance organization: designed, built, and operate a production financial-operations web platform (Python/Flask) unifying eight domains — variance commentary with AI-assisted review, live P&L and capital-expenditure analytics, an AI knowledge assistant, a resource library, planning dashboards, and reporting.",
      "Built and launched an AI-powered financial knowledge assistant using retrieval-augmented generation over hundreds of curated documents, with automatic source citation and export-control screening — adopted org-wide and accessible in-app, via a hosted agent, and inside analysts' local AI tools.",
      "Co-created and led the pre-launch quality audit of a reusable AI skill library now used across the broader finance organization; finalist among a 600-person internal hackathon.",
      "Replaced a manual spreadsheet process with an interactive general-ledger analytics dashboard offering transaction-level drill-down across seven dimensions for month-end close and purchase-order controllership.",
      "Primary technical advisor bridging finance and adjacent engineering, data, and platform orgs; established and lead a monthly Analytics & AI forum driving AI adoption across the organization.",
    ],
    overview:
      "Embedded in the Amazon Leo finance org as its sole technical owner — designing, building, and operating the production platform that runs financial operations for a ~130-person organization, at the intersection of satellite broadband and applied AI.",
    projects: [
      {
        name: "Financial-Operations Platform",
        desc: "Production Python/Flask web platform unifying eight domains for the finance org: variance commentary with AI-assisted review, live P&L and capex analytics, an AI knowledge assistant, a resource library, planning dashboards, and reporting.",
        tags: ["Python", "Flask", "AWS", "P&L Analytics", "CapEx"],
      },
      {
        name: "RAG Knowledge Assistant",
        desc: "Retrieval-augmented generation over hundreds of curated finance documents with automatic source citation and export-control screening. Adopted org-wide across three surfaces: in-app, a hosted agent, and analysts' local AI tools.",
        tags: ["RAG", "AWS Bedrock", "LLM", "Prompt Engineering", "Python"],
      },
      {
        name: "Reusable AI Skill Library",
        desc: "Co-created a library of reusable AI skills standardizing and accelerating analysts' AI workflows across the broader finance organization; led its pre-launch quality audit. Finalist among a 600-person internal hackathon.",
        tags: ["GenAI", "Enablement", "Quality Audit"],
      },
      {
        name: "General-Ledger Drill-Down",
        desc: "Interactive GL analytics dashboard replacing a manual spreadsheet process — transaction-level drill-down across seven dimensions supporting month-end close and purchase-order controllership.",
        tags: ["SQL", "Dashboarding", "Controllership"],
      },
    ],
    metrics: [
      { label: "finance org served", value: 130, display: "~130 people" },
      { label: "platform domains unified", value: 8, display: "8" },
      { label: "hackathon field (finalist)", value: 600, display: "600" },
      { label: "GL drill-down dimensions", value: 7, display: "7" },
    ],
  },
  {
    id: "amazon-pxt",
    role: "Business Intelligence Engineer",
    company: "Amazon",
    org: "Compensation · People Experience & Technology (PXT)",
    location: "Seattle, WA",
    start: "2022-03-01",
    end: "2025-07-01",
    accent: "amazon",
    bullets: [
      "Designed a company-wide compensation range review tool — a heavily utilized dashboard shaped through weekly managed workgroup sessions, user-acceptance testing, and launch demos.",
      "Created compensation cost modelers to simulate the implications of potential policy changes — highly customizable scenario builders enabling quick, flexible modeling.",
      "Led implementation of a machine-learning-powered natural-language querying tool across an organization of 100+ users; on a team of 3, maintained a dashboard suite with 5k+ monthly accesses across 600+ users.",
      "Developed dynamic, finely grained data security for 10k+ managers and built and maintained ETL pipelines on a Redshift data warehouse — SQL, refresh scheduling, dependency management, and data-quality inspection.",
    ],
    overview:
      "BI engineer for Amazon's compensation org — building the analytics and modeling tools behind company-wide pay decisions, on a three-person team serving hundreds of users at Amazon scale.",
    projects: [
      {
        name: "Compensation Range Review Tool",
        desc: "Company-wide dashboard for reviewing compensation ranges — designed through weekly managed workgroups, hardened with UAT, and launched with stakeholder demos.",
        tags: ["QuickSight", "UAT", "Stakeholder Management"],
      },
      {
        name: "Compensation Cost Modelers",
        desc: "Customizable scenario builders simulating the cost implications of proposed policy changes — fast, flexible what-if modeling for compensation planners.",
        tags: ["Scenario Analysis", "Financial Modelling", "SQL"],
      },
      {
        name: "Natural-Language Querying Rollout",
        desc: "Led the implementation of an ML-powered NLQ tool across 100+ users — improving speed to insight and reducing strain on BI resources.",
        tags: ["NLQ", "QuickSight Q", "Change Management"],
      },
      {
        name: "Row-Level Security & ETL",
        desc: "Dynamic fine-grained data security spanning 10k+ managers, plus Redshift ETL pipelines with refresh scheduling, dependency management, and data-quality inspection.",
        tags: ["Redshift", "Row-Level Security", "ETL", "Data Quality"],
      },
    ],
    metrics: [
      { label: "active dashboard users", value: 600, display: "600+" },
      { label: "monthly accesses", value: 5000, display: "5k+" },
      { label: "managers under RLS", value: 10000, display: "10k+" },
      { label: "NLQ rollout users", value: 100, display: "100+" },
    ],
  },
  {
    id: "pac-bi",
    role: "Business Intelligence Developer",
    company: "PAC Worldwide",
    location: "Redmond, WA",
    start: "2020-04-01",
    end: "2022-02-01",
    accent: "pac",
    bullets: [
      "Created, managed, and scaled the company data warehouse — pipeline development, data cleansing, incremental loads, execution scheduling, security, and error handling.",
      "Built primary financial reporting with Power BI, Jet Reports, and Excel/VBA alongside the CFO and business-unit stakeholders.",
      "Migrated data between ERP systems for multiple go-lives — automated, scalable ETL transferring general and sub-ledgers between environments.",
      "Developed a cross-department budgeting system feeding consolidated financials, and aided sales forecasting with a machine-learning sales algorithm.",
    ],
    overview:
      "First dedicated BI role at PAC Worldwide — built the company's data infrastructure largely from scratch, moving a finance-heavy organisation toward data-driven decisions across operations, sales, and supply chain.",
    projects: [
      {
        name: "Enterprise Data Warehouse",
        desc: "Designed and scaled PAC's data warehouse end-to-end — source mapping, dimensional modelling, incremental loads, scheduling, security, and error handling, with a Power BI semantic layer on top.",
        tags: ["SQL Server", "Power BI", "Data Modelling", "ETL"],
      },
      {
        name: "ERP Migration Automation",
        desc: "Automated multi-entity Microsoft Dynamics ERP data migrations across several go-lives — scalable ETL moving general and sub-ledger data cleanly between environments.",
        tags: ["MS Dynamics", "ETL", "SQL", "Data Migration"],
      },
      {
        name: "ML Sales Forecasting",
        desc: "Supported sales forecasting with BI solutions built on a machine-learning sales algorithm, integrated into executive planning.",
        tags: ["Python", "ML", "Forecasting", "Power BI"],
      },
    ],
    metrics: [
      { label: "ERP go-lives supported", value: 3, display: "multiple" },
      { label: "reporting stack tools", value: 4, display: "4" },
    ],
  },
  {
    id: "pac-fpa",
    role: "FP&A Manager",
    company: "PAC Worldwide",
    location: "Redmond, WA",
    start: "2017-10-01",
    end: "2020-04-01",
    accent: "pac",
    bullets: [
      "Partnered with the CFO and executive leadership on financial insight and reporting for a global packaging manufacturer.",
      "Built a cross-department budgeting system feeding a consolidated set of financials.",
      "Began the finance function's shift toward analytics — the pivot that created the dedicated BI Developer role.",
    ],
    overview:
      "Three years leading FP&A at PAC Worldwide — partnering with the CFO on planning infrastructure and steering the finance function toward data-driven analytics. This role directly led to the BI Developer position.",
    projects: [
      {
        name: "Collaborative Budgeting System",
        desc: "Cross-departmental budgeting tool feeding one consolidated set of financials — replacing disconnected spreadsheets with a unified model all department heads could contribute to.",
        tags: ["Excel", "VBA", "FP&A", "Budgeting"],
      },
      {
        name: "Analytics-First Pivot",
        desc: "Drove the tooling and culture shift from static reporting to interactive analytics — early Power BI and DOMO work that justified a dedicated BI hire.",
        tags: ["Power BI", "DOMO", "Change Management"],
      },
    ],
    metrics: [{ label: "years partnering with CFO", value: 3, display: "3" }],
  },
  {
    id: "falck",
    role: "Financial Analyst",
    company: "Falck USA",
    location: "Bothell, WA",
    start: "2015-08-01",
    end: "2017-09-01",
    accent: "falck",
    bullets: [
      "Delivered financial analysis and reporting for a multi-site healthcare services organisation.",
      "Developed forecasting models supporting cost management across multiple business units.",
      "Presented insights to operational leadership — sharpening the stakeholder communication that defines every role since.",
    ],
    overview:
      "Financial analyst in a complex multi-site healthcare services organisation — forecasting models, variance analysis, and reporting for operational leadership across business units.",
    projects: [
      {
        name: "Cost Management Forecasting",
        desc: "Forecasting models supporting cost management across Falck USA business units — monthly variance analysis, scenario planning, and operational reporting.",
        tags: ["Excel", "Forecasting", "Cost Analysis"],
      },
    ],
    metrics: [],
  },
  {
    id: "ey",
    role: "Assurance Intern",
    company: "Ernst & Young",
    location: "Seattle, WA",
    start: "2014-06-01",
    end: "2014-08-01",
    accent: "ey",
    bullets: [
      "Supported audit engagements at a Big Four firm.",
      "Built the disciplined, detail-first approach to financial data that underpins every analytics role since.",
    ],
    overview:
      "Assurance internship at a Big Four firm — a formative summer inside enterprise financial controls and the rigour of audit-grade numbers.",
    projects: [
      {
        name: "Assurance Engagements",
        desc: "Supported audit teams across client engagements — enterprise financial controls, compliance frameworks, and audit discipline.",
        tags: ["Audit", "Financial Controls", "Compliance"],
      },
    ],
    metrics: [],
  },
  {
    id: "inspired-led",
    role: "Controller",
    company: "Inspired LED",
    location: "Tempe, AZ",
    start: "2013-05-01",
    end: "2015-07-01",
    accent: "led",
    bullets: [
      "Managed full-cycle accounting and financial control for a growing LED lighting manufacturer.",
      "Hands-on across every facet of a small-business finance function — AR, AP, payroll, reporting.",
      "Built the financial reporting foundation that supported rapid product expansion.",
    ],
    overview:
      "First role out of school — Controller at a fast-growing LED lighting startup, building the finance function from the ground up.",
    projects: [
      {
        name: "Financial Infrastructure Build",
        desc: "Full-cycle accounting and reporting infrastructure — AR, AP, payroll, management reporting, and audit-ready records through rapid product expansion.",
        tags: ["Full-Cycle Accounting", "QuickBooks", "Excel"],
      },
    ],
    metrics: [],
  },
];

export const SKILL_PILLARS: SkillPillar[] = [
  {
    id: "data-engineering",
    name: "Data Engineering",
    icon: "🗄️",
    radar: 92,
    overview:
      "Data pipelines are a product, not plumbing — they need reliability, observability, and the same discipline as user-facing software. That's the lens on every pipeline I build.",
    bullets: [
      "Built and operate the data layer of the Amazon Leo finance platform — the pipelines behind live P&L, capex analytics, and planning dashboards for a ~130-person org.",
      "Engineered dynamic row-level security spanning 10k+ Amazon managers with ETL pipelines on Redshift — refresh scheduling, dependency management, data-quality inspection.",
      "Created, managed, and scaled PAC Worldwide's data warehouse end-to-end: incremental loads, execution scheduling, security, and error handling.",
      "Automated multi-entity ERP data migrations across several go-lives, moving general and sub-ledger data cleanly between environments.",
    ],
  },
  {
    id: "bi-visualisation",
    name: "BI & Visualisation",
    icon: "📊",
    radar: 95,
    overview:
      "Good BI isn't pretty charts — it's making the right decision obvious at a glance. I design for the decision-maker, not the data engineer.",
    bullets: [
      "Replaced a manual spreadsheet process with an interactive general-ledger dashboard — transaction-level drill-down across seven dimensions for month-end close.",
      "On a team of 3, maintained an Amazon dashboard suite with 5k+ monthly accesses across 600+ users; designed the company-wide compensation range review tool.",
      "Led an ML-powered natural-language querying rollout to 100+ users, improving speed to insight and reducing strain on BI resources.",
      "Built PAC Worldwide's primary financial reporting in Power BI, Jet Reports, and Excel/VBA, directly with the CFO.",
    ],
  },
  {
    id: "python-ml-genai",
    name: "Python, AI & GenAI",
    icon: "🐍",
    radar: 88,
    overview:
      "Python is the connective tissue of my stack — production Flask platforms, ETL, and LLM applications, not just notebooks. Shipped and maintained beats clever and abandoned.",
    bullets: [
      "Designed, built, and operate a production Python/Flask financial-operations platform unifying eight domains for the Amazon Leo finance org.",
      "Built a RAG-powered financial knowledge assistant over hundreds of curated documents — automatic source citation, export-control screening, org-wide adoption.",
      "Co-created a reusable AI skill library standardizing analysts' AI workflows across finance; finalist among a 600-person internal hackathon.",
      "Supported PAC Worldwide sales forecasting with BI solutions built on a machine-learning sales algorithm.",
    ],
  },
  {
    id: "cloud-aws",
    name: "Cloud (AWS)",
    icon: "☁️",
    radar: 85,
    overview:
      "I build on AWS at Amazon's own scale — production systems serving hundreds of daily users inside one of the world's largest cloud environments.",
    bullets: [
      "AWS Bedrock for the RAG knowledge assistant and AI-assisted review workflows in the Leo finance platform.",
      "Redshift data warehousing: ETL pipelines, refresh scheduling, dependency management, and performance-conscious SQL at enterprise scale.",
      "QuickSight administration — row-level security design and the NLQ (QuickSight Q) rollout across 100+ users.",
      "AWS Certified Cloud Practitioner; daily production work across the AWS analytics stack.",
    ],
  },
  {
    id: "financial-analytics",
    name: "Financial Analytics",
    icon: "💼",
    radar: 95,
    overview:
      "I started as an accountant — so I know exactly what finance teams need from their data, and where most BI tools fall short. That foundation is the differentiator.",
    bullets: [
      "Run variance commentary, live P&L, and capital-expenditure analytics for the Amazon Leo finance org — the platform behind month-end close and controllership.",
      "Built compensation cost modelers simulating policy-change implications — customizable scenario builders for Amazon-wide planning.",
      "Three years as FP&A Manager reporting to PAC Worldwide's CFO: consolidated budgeting, multi-entity financials.",
      "EY assurance grounding: enterprise financial controls, audit standards, and the discipline of numbers that must be exactly right.",
    ],
  },
  {
    id: "systems-erp",
    name: "Systems & ERP",
    icon: "⚙️",
    radar: 80,
    overview:
      "Most analysts work around ERP systems; I build bridges into them. Understanding the source data model at schema level changes everything.",
    bullets: [
      "Led multi-entity Microsoft Dynamics (NAV, F&O) migrations at PAC Worldwide with automated, reconciled ETL between ERP environments.",
      "Built live reporting bridges from Dynamics into Power BI and Jet Reports — operational source-of-truth to executive dashboards without duplication.",
      "Jet Data Manager / Jet Reports implementation connecting the Dynamics GL to formatted financial statements.",
      "Power Platform workflows automating manual close processes and eliminating error-prone spreadsheet hand-offs.",
    ],
  },
];

export const CERTS: Cert[] = [
  {
    name: "AWS Certified AI Practitioner",
    issuer: "Amazon Web Services",
    date: "2025",
    needsConfirmation: true,
  },
  {
    name: "AWS Certified Cloud Practitioner",
    issuer: "Amazon Web Services",
    date: "Oct 2024",
  },
  {
    name: "Data Analyst Associate",
    issuer: "Microsoft Certified",
    date: "Apr 2021",
  },
  {
    name: "Power Platform Fundamentals",
    issuer: "Microsoft Certified",
    date: "Nov 2021",
  },
];

export const EDUCATION: EducationEntry[] = [
  {
    school: "University of Washington",
    detail:
      "Certificate in Business Intelligence: Building the Data Warehouse · Foundations of Programming (Python)",
    location: "Seattle, WA",
  },
  {
    school: "Arizona State University — W. P. Carey School of Business",
    detail: "Bachelor of Science, Accountancy",
    location: "Tempe, AZ",
  },
];

export const TECH_SKILLS = [
  "SQL",
  "Python",
  "Flask",
  "AWS",
  "AWS Bedrock",
  "RAG",
  "AI/LLM app development",
  "Prompt engineering",
  "QuickSight",
  "Power BI",
  "Data Warehousing",
  "ETL",
  "Git",
  "Microsoft Dynamics (NAV, F&O)",
  "MS SQL Data Tools",
  "Advanced Excel",
  "VBA",
  "Jet Data Manager / Reports",
  "DOMO",
];

export const INTERESTS = [
  { icon: "📚", label: "Fantasy & Sci-Fi" },
  { icon: "🥾", label: "Hiking" },
  { icon: "🎮", label: "Gaming" },
  { icon: "🏄", label: "Paddle Boarding" },
  { icon: "✈️", label: "Traveling" },
  { icon: "🌱", label: "Gardening" },
];

/** "Jul 2025 — Present" style range for display. */
export function formatRange(job: Job): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${fmt(job.start)} — ${job.end ? fmt(job.end) : "Present"}`;
}
