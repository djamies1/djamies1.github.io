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
 * fallback. Edit here, never in components.
 * Content mirrors davidjmn_resume.docx (2026). No phone number.
 * Style rules: no em dashes; US spelling; plain sentences over
 * fragment-chains. Icons live in components (this module is also
 * imported by the node-side build plugin, so keep it dependency-free).
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
    "Data & analytics for finance",
    "Accountant turned engineer",
    "Building with AI in production",
  ],
  summary:
    "Business intelligence engineer at Amazon Leo, working in data and analytics for the finance org. Thirteen years from accounting through FP&A and data engineering, lately using AI to build tools that reach past the usual dashboard.",
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
    label: "disciplines",
    value: 4,
    note: "finance, BI, cloud, AI",
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
    highlight: "Satellite broadband · Finance",
    tagline:
      "Data and analytics for the finance org behind Amazon's satellite constellation, plus the AI tools I've built on top.",
    bullets: [
      "Own the finance org's core analytics and reporting: variance commentary, live P&L, and capital-expenditure views that carry through month-end close and purchase-order controllership.",
      "Replaced a manual spreadsheet process with a general-ledger dashboard that drills from summary down to individual transactions across seven dimensions.",
      "As AI opened up new tooling, built a Python/Flask web app that brings several of the org's workflows into one place for roughly 130 people: variance commentary, planning, reporting, and an AI assistant. Sole technical owner.",
      "Built the AI knowledge assistant on retrieval-augmented generation over several hundred curated documents, with source citations and export-control screening. Co-created a reusable AI skill library for the wider finance org, a finalist in an internal hackathon with about 600 entrants.",
      "Main technical contact between finance and the neighboring engineering and data teams, and I run the org's monthly analytics and AI forum.",
    ],
    overview:
      "I'm the BI engineer for the Amazon Leo finance org: the analytics, reporting, and data behind month-end close, P&L, and capex. Alongside that core work, I've used AI to build tools the team now leans on, including a Flask platform and a RAG knowledge assistant.",
    projects: [
      {
        name: "Financial-Operations Platform",
        desc: "A Python/Flask web app I built as AI made this kind of tooling reachable for a BI engineer. It brings several finance workflows into one place: variance commentary with AI-assisted review, live P&L and capex views, planning dashboards, a resource library, and the AI assistant.",
        tags: ["Python", "Flask", "AWS", "P&L Analytics", "CapEx"],
      },
      {
        name: "RAG Knowledge Assistant",
        desc: "Answers finance questions from several hundred curated documents, with source citations and export-control screening. Available in the platform, as a hosted agent, and inside analysts' local AI tools.",
        tags: ["RAG", "AWS Bedrock", "LLM", "Prompt Engineering", "Python"],
      },
      {
        name: "Reusable AI Skill Library",
        desc: "A shared library of AI skills that gives analysts a consistent starting point for common workflows. Co-created it, ran the pre-launch quality audit, and took it to the finals of an internal hackathon with about 600 entrants.",
        tags: ["GenAI", "Enablement", "Quality Audit"],
      },
      {
        name: "General-Ledger Drill-Down",
        desc: "Replaced the manual spreadsheet process behind month-end close. Drills from summary to individual transactions across seven dimensions, including purchase-order controllership views.",
        tags: ["SQL", "Dashboarding", "Controllership"],
      },
    ],
    metrics: [
      { label: "people in the finance org", value: 130, display: "~130" },
      { label: "areas on one platform", value: 8, display: "8" },
      { label: "hackathon entrants, finalist", value: 600, display: "600" },
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
    tagline:
      "Built the dashboards and cost models Amazon's compensation team uses for pay planning.",
    bullets: [
      "Designed the tool Amazon uses for company-wide compensation range reviews, shaped through weekly workgroup sessions, user-acceptance testing, and launch demos.",
      "Built cost modelers so compensation planners could test policy changes before committing to them, with scenario controls flexible enough to answer most follow-ups without new development.",
      "Rolled out a machine-learning natural-language query tool to 100+ users. On a team of three, helped maintain a dashboard suite with 5k+ monthly accesses from 600+ users.",
      "Built dynamic row-level security covering 10k+ managers, plus the Redshift ETL pipelines behind it: refresh scheduling, dependency management, and data-quality checks.",
    ],
    overview:
      "Three years on the BI team behind Amazon's compensation org. There were three of us supporting hundreds of dashboard users, so much of the work went into self-serve tooling, security, and pipelines that didn't need babysitting.",
    projects: [
      {
        name: "Compensation Range Review Tool",
        desc: "The dashboard Amazon uses to review compensation ranges company-wide. Requirements came out of weekly workgroups; it went through UAT and stakeholder demos before launch.",
        tags: ["QuickSight", "UAT", "Stakeholder Management"],
      },
      {
        name: "Compensation Cost Modelers",
        desc: "Scenario builders for testing proposed pay-policy changes. Planners adjust the assumptions and the model shows the cost.",
        tags: ["Scenario Analysis", "Financial Modeling", "SQL"],
      },
      {
        name: "Natural-Language Querying Rollout",
        desc: "Led the QuickSight Q rollout to 100+ users so routine data questions stopped needing a BI ticket.",
        tags: ["NLQ", "QuickSight Q", "Change Management"],
      },
      {
        name: "Row-Level Security & ETL",
        desc: "Dynamic row-level security for 10k+ managers, with Redshift pipelines underneath: refresh scheduling, dependency management, data-quality checks.",
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
    tagline:
      "PAC's first BI hire. Built the data warehouse, the Power BI reporting on it, and the ERP migration tooling.",
    bullets: [
      "Built and ran the company data warehouse: pipeline development, data cleansing, incremental loads, scheduling, security, and error handling.",
      "Delivered the company's main financial reporting in Power BI, Jet Reports, and Excel/VBA, working with the CFO and business-unit stakeholders.",
      "Moved ledgers between ERP systems for several go-lives, with automated ETL in place of manual exports and re-keying.",
      "Built a cross-department budgeting system feeding consolidated financials, and supported sales forecasting with a machine-learning model.",
    ],
    overview:
      "PAC created this role after I spent three years running FP&A there. I built the data warehouse and reporting stack from scratch and handled the data side of several ERP go-lives along the way.",
    projects: [
      {
        name: "Enterprise Data Warehouse",
        desc: "SQL Server warehouse built from source mapping up: dimensional modeling, incremental loads, scheduling, security, error handling, and a Power BI semantic layer on top.",
        tags: ["SQL Server", "Power BI", "Data Modeling", "ETL"],
      },
      {
        name: "ERP Migration Automation",
        desc: "Automated the data side of several Microsoft Dynamics go-lives. ETL moved general and sub-ledger data between environments and reconciled the results.",
        tags: ["MS Dynamics", "ETL", "SQL", "Data Migration"],
      },
      {
        name: "ML Sales Forecasting",
        desc: "Sales forecasting built on a machine-learning model, folded into executive planning.",
        tags: ["Python", "ML", "Forecasting", "Power BI"],
      },
    ],
    metrics: [
      { label: "ERP go-lives supported", value: 3, display: "multiple" },
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
    tagline:
      "Ran FP&A for a global packaging manufacturer, and made the case for the BI role I later moved into.",
    bullets: [
      "Handled financial planning, analysis, and reporting for a global packaging manufacturer, working with the CFO and executive team.",
      "Built a cross-department budgeting system that rolled every department's plan into one consolidated set of financials.",
      "Started the finance team's move from static spreadsheets to interactive analytics. That work became the case for a dedicated BI position.",
    ],
    overview:
      "Three years of FP&A at PAC, working with the CFO. The longer I did the job, the more of it became building better tooling, and eventually the company agreed and created a BI role for it.",
    projects: [
      {
        name: "Collaborative Budgeting System",
        desc: "Replaced disconnected departmental spreadsheets with one budgeting model everyone contributed to, feeding a single consolidated set of financials.",
        tags: ["Excel", "VBA", "FP&A", "Budgeting"],
      },
      {
        name: "The Case for BI",
        desc: "Early Power BI and DOMO work that showed what interactive reporting could do, and justified a dedicated BI hire.",
        tags: ["Power BI", "DOMO", "Change Management"],
      },
    ],
    metrics: [
      { label: "years working with the CFO", value: 3, display: "3" },
    ],
  },
  {
    id: "falck",
    role: "Financial Analyst",
    company: "Falck USA",
    location: "Bothell, WA",
    start: "2015-08-01",
    end: "2017-09-01",
    accent: "falck",
    tagline:
      "Forecasting and cost analysis for a multi-site healthcare operator.",
    bullets: [
      "Financial analysis and reporting for a multi-site healthcare services company.",
      "Built forecasting models used for cost management across several business units.",
      "Presented monthly results and forecasts to operational leadership.",
    ],
    overview:
      "Financial analyst for Falck's US operation: forecasting, variance analysis, and reporting across business units for operational leadership.",
    projects: [
      {
        name: "Cost Management Forecasting",
        desc: "Forecasting models for cost management across business units, with monthly variance analysis and operational reporting.",
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
    tagline: "A summer of Big Four audit work in Seattle.",
    bullets: [
      "Supported audit engagements across client teams.",
      "First exposure to enterprise financial controls and how auditors think about numbers.",
    ],
    overview:
      "An assurance internship at EY. Short, but it set the bar for what correct numbers look like in enterprise finance.",
    projects: [],
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
    tagline:
      "First job out of school. Ran the books for a growing LED manufacturer.",
    bullets: [
      "Ran full-cycle accounting for a growing LED lighting manufacturer: AR, AP, payroll, and monthly reporting.",
      "Set up the financial reporting the company needed as it expanded its product line.",
    ],
    overview:
      "Controller at a small LED lighting company in Tempe, straight out of ASU. Everything finance-related crossed my desk at some point, which turned out to be good training.",
    projects: [
      {
        name: "Finance Function Setup",
        desc: "Full-cycle accounting and reporting: AR, AP, payroll, management reporting, and audit-ready records through a stretch of fast product growth.",
        tags: ["Full-Cycle Accounting", "QuickBooks", "Excel"],
      },
    ],
    metrics: [],
  },
];

/*
 * Pillar scores are years of hands-on use, from the career timeline:
 * finance since 2013 (Controller), BI since the 2018 PAC analytics
 * push, data engineering and Python since the 2020 warehouse build,
 * ERP work during the PAC years, AWS since joining Amazon in 2022.
 */
export const SKILL_PILLARS: SkillPillar[] = [
  {
    id: "data-engineering",
    name: "Data Engineering",
    years: 6,
    since: "since 2020",
    overview:
      "Warehouse design, ETL, and the operational side: scheduling, dependencies, data quality, and access control. Most of this work has been on Redshift and SQL Server.",
    bullets: [
      "Built and operate the data layer of the Amazon Leo finance platform: the pipelines behind live P&L, capex reporting, and planning dashboards.",
      "Built dynamic row-level security covering 10k+ Amazon managers, with the Redshift ETL behind it: refresh scheduling, dependency management, data-quality checks.",
      "Built and ran PAC Worldwide's data warehouse: incremental loads, scheduling, security, and error handling.",
      "Automated multi-entity ERP data migrations across several go-lives, moving general and sub-ledger data between environments.",
    ],
  },
  {
    id: "bi-visualisation",
    name: "BI & Visualization",
    years: 8,
    since: "since 2018",
    overview:
      "Dashboards and reporting for finance and HR audiences, mostly in QuickSight and Power BI. I spend the effort on sensible defaults and drill-downs that answer the follow-up question.",
    bullets: [
      "Replaced a manual spreadsheet process with a general-ledger dashboard: transaction-level drill-down across seven dimensions for month-end close.",
      "Helped maintain an Amazon dashboard suite with 5k+ monthly accesses from 600+ users, on a team of three, and designed the company-wide compensation range review tool.",
      "Rolled out an ML-powered natural-language query tool to 100+ users so routine questions stopped needing a BI ticket.",
      "Built PAC Worldwide's main financial reporting in Power BI, Jet Reports, and Excel/VBA, working directly with the CFO.",
    ],
  },
  {
    id: "python-ml-genai",
    name: "Python, AI & GenAI",
    years: 6,
    since: "since 2020",
    overview:
      "The AI-enabled side of the BI work: Flask apps, ETL scripts, and LLM features like RAG, prompt pipelines, and AI-assisted review. Everything here is running in production, not sitting in a notebook.",
    bullets: [
      "Built a Python/Flask web app for the Amazon Leo finance org that brings several workflows and an AI assistant into one place.",
      "Built a RAG knowledge assistant over several hundred curated documents, with source citations and export-control screening, now used across the org.",
      "Co-created a reusable AI skill library for the wider finance organization. Finalist in an internal hackathon with about 600 entrants.",
      "Supported PAC Worldwide's sales forecasting with a machine-learning model.",
    ],
  },
  {
    id: "cloud-aws",
    name: "Cloud (AWS)",
    years: 4,
    since: "since 2022",
    overview:
      "Day-to-day work in Redshift, QuickSight, and Bedrock inside Amazon, plus the certifications to back it up.",
    bullets: [
      "AWS Bedrock for the RAG assistant and the AI-assisted review workflows in the Leo finance platform.",
      "Redshift warehousing: ETL pipelines, refresh scheduling, dependency management, and performance-minded SQL.",
      "QuickSight administration, including row-level security design and the QuickSight Q rollout to 100+ users.",
      "AWS Certified Cloud Practitioner, in the AWS analytics stack daily.",
    ],
  },
  {
    id: "financial-analytics",
    name: "Financial Analytics",
    years: 13,
    since: "since 2013",
    overview:
      "P&L, capex, variance, and close. I did the accounting and FP&A jobs before the engineering ones, which keeps the requirements conversations short.",
    bullets: [
      "Run variance commentary, live P&L, and capex reporting for the Amazon Leo finance org, including month-end close and controllership.",
      "Built compensation cost modelers used in Amazon-wide planning: adjustable scenarios for proposed policy changes.",
      "Three years of FP&A at PAC Worldwide working with the CFO: consolidated budgeting and multi-entity financials.",
      "Audit at EY and controllership at a startup, so close, AR/AP, and controls are first-hand experience.",
    ],
  },
  {
    id: "systems-erp",
    name: "Systems & ERP",
    years: 4,
    since: "at PAC Worldwide",
    overview:
      "Microsoft Dynamics data models, ledger migrations between ERP environments, and reporting bridges into Power BI and Jet Reports.",
    bullets: [
      "Led the data side of multi-entity Microsoft Dynamics (NAV, F&O) migrations at PAC Worldwide, with automated, reconciled ETL between environments.",
      "Built live reporting bridges from Dynamics into Power BI and Jet Reports, so executive dashboards read straight from the operational system.",
      "Implemented Jet Data Manager and Jet Reports, connecting the Dynamics GL to formatted financial statements.",
      "Automated manual close processes with Power Platform workflows, removing error-prone spreadsheet hand-offs.",
    ],
  },
];

/** Longest pillar tenure; normalizes the radar and the card bars. */
export const PILLAR_MAX_YEARS = Math.max(
  ...SKILL_PILLARS.map((p) => p.years)
);

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
    school: "Arizona State University, W. P. Carey School of Business",
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
  "ERP Data Migration",
  "Dimensional Modeling",
  "Row-Level Security",
  "Git",
  "Microsoft Dynamics (NAV, F&O)",
  "MS SQL Data Tools",
  "Advanced Excel",
  "VBA",
  "Jet Data Manager / Reports",
  "DOMO",
];

/** Differentiators recruiters should catch in one glance. One line each. */
export const SPECIALTIES = [
  {
    title: "ERP Data Migration",
    desc: "Multi-entity Microsoft Dynamics go-lives with automated, reconciled ledger cutovers.",
  },
  {
    title: "Production GenAI",
    desc: "A RAG assistant and an AI skill library, both shipped and in daily use across Amazon finance.",
  },
  {
    title: "Accounting Foundation",
    desc: "Controller and FP&A manager before engineering. Close, audit, and controllership are familiar ground.",
  },
  {
    title: "Stakeholder Leadership",
    desc: "Weekly workgroups, UAT programs, launch demos, and a monthly analytics and AI forum.",
  },
];

/** Landing-surface KPIs for the current role. Counts animate on view. */
export const LEO_KPIS = [
  { value: 130, prefix: "~", label: "people in the finance org" },
  { value: 8, label: "areas on one platform" },
  { value: 600, label: "hackathon entrants, finalist" },
  { value: 7, label: "GL drill-down dimensions" },
];

export const INTERESTS = [
  { label: "Fantasy & sci-fi" },
  { label: "Hiking" },
  { label: "Gaming" },
  { label: "Paddle boarding" },
  { label: "Traveling" },
  { label: "Gardening" },
];

/** "Jul 2025 – Present" style range for display (en dash by convention). */
export function formatRange(job: Job): string {
  const fmt = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  return `${fmt(job.start)} – ${job.end ? fmt(job.end) : "Present"}`;
}
