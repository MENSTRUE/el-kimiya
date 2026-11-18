import { useMemo, useState, type ReactNode } from "react";
import {
  Atom,
  Bell,
  BookMarked,
  BookOpen,
  Bookmark,
  BrainCircuit,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Cloud,
  FlaskConical,
  Grid2X2,
  Home,
  Layers3,
  Library,
  Lightbulb,
  List,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  FileText,
  Compass,
  Sun,
  Target,
  Trophy,
  Upload,
  User,
  Wifi,
  WifiOff,
  X,
  Zap,
} from "lucide-react";
import { BrandMark } from "./components/BrandMark";

type Page =
  | "landing"
  | "dashboard"
  | "library"
  | "reader"
  | "tutor"
  | "hybrid"
  | "practice"
  | "explorer"
  | "flashcards"
  | "progress"
  | "notes"
  | "settings"
  | "scan"
  | "profile";

const navItems: { id: Page; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "library", label: "My Library", icon: Library },
  { id: "tutor", label: "AI Chemistry Tutor", icon: Sparkles },
  { id: "explorer", label: "Chemistry Explorer", icon: Atom },
  { id: "practice", label: "Practice Lab", icon: FlaskConical },
  { id: "flashcards", label: "Flashcards", icon: Layers3 },
  { id: "progress", label: "Learning Progress", icon: Trophy },
  { id: "notes", label: "Saved Notes", icon: NotebookPen },
];

const books = [
  {
    title: "Foundations of Chemistry",
    meta: "Secondary level · 12 chapters",
    progress: 68,
    tone: "blue",
    symbol: "H₂O",
  },
  {
    title: "Matter & Its Interactions",
    meta: "Core concepts · 9 chapters",
    progress: 34,
    tone: "navy",
    symbol: "CO₂",
  },
  {
    title: "Chemical Bonds",
    meta: "Focused study · 7 chapters",
    progress: 12,
    tone: "gold",
    symbol: "NaCl",
  },
];

function Badge({
  children,
  variant = "blue",
}: {
  children: ReactNode;
  variant?: "blue" | "gold" | "neutral";
}) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

function Progress({ value }: { value: number }) {
  return (
    <div className="progress-track" aria-label={`${value}% complete`}>
      <span style={{ width: `${value}%` }} />
    </div>
  );
}

function Sidebar({
  page,
  setPage,
  collapsed,
  setCollapsed,
}: {
  page: Page;
  setPage: (page: Page) => void;
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
}) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-top">
        <button className="brand" aria-label="El-Kīmiyā home" onClick={() => setPage("dashboard")}>
          <BrandMark compact={collapsed} size="sm" />
        </button>
        <button
          className="icon-button collapse-button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="side-nav" aria-label="Main navigation">
        <p className="nav-label">{collapsed ? "•••" : "Learning space"}</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={page === item.id ? "active" : ""}
              onClick={() => setPage(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="side-nav secondary-nav">
        <button className={page === "hybrid" ? "active" : ""} onClick={() => setPage("hybrid")}>
          <BrainCircuit size={19} />
          {!collapsed && <span>AI Engine Status</span>}
          {!collapsed && <i className="status-dot" />}
        </button>
        <button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}>
          <Settings size={19} />
          {!collapsed && <span>Settings</span>}
        </button>
        <button onClick={() => setPage("landing")}>
          <CircleHelp size={19} />
          {!collapsed && <span>About El-Kīmiyā</span>}
        </button>
      </div>
      <div className="sidebar-quote">
        <span className="workspace-avatar"><GraduationCap size={17} /></span>
        {!collapsed && <div><strong>My learning space</strong><p>Student workspace · Demo</p></div>}
        {!collapsed && <ChevronRight size={15} className="workspace-chevron" />}
      </div>
    </aside>
  );
}

function Header({
  page,
  setPage,
  dark,
  setDark,
  offline,
}: {
  page: Page;
  setPage: (page: Page) => void;
  dark: boolean;
  setDark: (value: boolean) => void;
  offline: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const searchRoutes: {label:string; meta:string; to:Page}[] = [
    {label:"Atomic structure",meta:"Guided lesson",to:"reader"},
    {label:"Chemical bonding",meta:"Guided lesson",to:"reader"},
    {label:"My textbooks",meta:"Library",to:"library"},
    {label:"Ask AI chemistry tutor",meta:"Assistant · Demo",to:"tutor"},
    {label:"Hybrid AI status",meta:"Inference preferences",to:"hybrid"},
    {label:"Practice equations",meta:"Practice lab",to:"practice"},
    {label:"Molecular explorer",meta:"Chemistry explorer",to:"explorer"},
  ];
  const searchResults = searchTerm.trim()
    ? searchRoutes.filter((entry) => `${entry.label} ${entry.meta}`.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
    : [];
  const openSearchResult = (to:Page) => { setPage(to); setSearchTerm(""); };
  const titles: Partial<Record<Page, string>> = {
    library: "My chemistry library",
    tutor: "AI chemistry tutor",
    hybrid: "Hybrid AI engine",
    practice: "Practice lab",
    explorer: "Chemistry explorer",
    flashcards: "Flashcards",
    progress: "Learning progress",
    settings: "Settings",
    notes: "Saved notes",
  };
  return (
    <header className="topbar">
      <button
        className="mobile-header-brand"
        aria-label="El-Kīmiyā home"
        onClick={() => setPage("dashboard")}
      >
        <BrandMark compact inverted={dark} size="sm" />
      </button>
      <div>
        <p className="eyebrow">
          {page === "dashboard" ? "YOUR PERSONAL LABORATORY" : "EL-KĪMIYĀ  /  STUDY SPACE"}
        </p>
        <h1>
          {page === "dashboard" ? "Make room for discovery." : titles[page] || "Continue learning"}
        </h1>
      </div>
      <div className="header-actions">
        <div className="global-search-wrap">
          <label className="global-search">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && searchResults[0]) openSearchResult(searchResults[0].to);
                if (event.key === "Escape") setSearchTerm("");
              }}
              aria-label="Search lessons and tools"
              placeholder="Search lessons and tools..."
            />
            <kbd>/</kbd>
          </label>
          {searchTerm && <div className="search-results" role="listbox" aria-label="Search results">
            {searchResults.length > 0 ? searchResults.map((entry) => (
              <button key={entry.label} onClick={() => openSearchResult(entry.to)}>
                <Search size={14} /><span><strong>{entry.label}</strong><small>{entry.meta}</small></span><ArrowUpRight size={14}/>
              </button>
            )) : <p>No matching lesson in this demo.</p>}
          </div>}
        </div>
        <button
          className={`engine-pill ${offline ? "offline" : ""}`}
          onClick={() => setPage("hybrid")}
        >
          {offline ? <WifiOff size={15} /> : <Zap size={15} />}
          <span>{offline ? "Offline mode" : "AI available"}</span>
          <Badge>Demo</Badge>
        </button>
        <button className="icon-button" onClick={() => setDark(!dark)} aria-label="Toggle theme">
          {dark ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <button className="icon-button notification" onClick={() => setPage("progress")} aria-label="View learning progress">
          <Target size={19} />
        </button>
        <button className="avatar" onClick={() => setPage("profile")} aria-label="Open profile">
          AS
        </button>
      </div>
    </header>
  );
}

function LandingPage({ enterApp }: { enterApp: () => void }) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <button aria-label="El-Kīmiyā home">
          <BrandMark size="sm" showTagline />
        </button>
        <nav aria-label="Public website navigation">
          <a href="#product">Product</a>
          <a href="#experience">How it works</a>
          <a href="#hybrid">Hybrid AI</a>
          <a href="#tools">Learning tools</a>
        </nav>
        <div>
          <button className="landing-signin" onClick={enterApp}>
            Sign in
          </button>
          <button className="primary-button" onClick={enterApp}>
            Start learning <ChevronRight size={16} />
          </button>
        </div>
      </header>

      <section className="landing-hero" id="product">
        <div className="landing-hero-copy">
          <div className="landing-edition"><span>EL-KĪMIYĀ</span><i /> AN EDUCATION EXPERIENCE · EST. 2026</div>
          <h1>Make sense of <em>matter.</em><br/>Make space for <em>curiosity.</em></h1>
          <p>
            Chemistry isn't meant to be memorized. It's meant to be understood.
            Learn from your own books, ask better questions, and discover the science
            behind everyday life — wherever you are.
          </p>
          <div className="landing-actions">
            <button className="primary-button" onClick={enterApp}>
              Start Learning Free <ChevronRight size={17} />
            </button>
            <button className="secondary-button" onClick={enterApp}>
              View the learning space
            </button>
          </div>
          <div className="landing-trust">
            <span><BookOpen size={15} /> YOUR BOOKS</span>
            <span><BrainCircuit size={15} /> HYBRID INTELLIGENCE</span>
            <span><FlaskConical size={15} /> REAL UNDERSTANDING</span>
          </div>
        </div>
        <div className="product-showcase" aria-label="El-Kīmiyā learning workspace preview">
          <div className="showcase-window">
            <div className="showcase-sidebar">
              <BrandMark compact inverted size="sm" />
              {[Home, Library, BookOpen, FlaskConical].map((Icon, index) => (
                <span className={index === 0 ? "active" : ""} key={index}>
                  <Icon size={16} />
                </span>
              ))}
            </div>
            <div className="showcase-content">
              <div className="showcase-topline">
                <span>Continue learning</span>
                <Badge>Demo preview</Badge>
              </div>
              <div className="showcase-lesson">
                <div>
                  <small>CHAPTER 03</small>
                  <strong>Atomic structure & chemical bonding</strong>
                  <Progress value={68} />
                </div>
                <div className="showcase-molecule">
                  <i>C</i>
                  <span />
                  <i>O</i>
                </div>
              </div>
              <div className="showcase-cards">
                <span>
                  <BookOpen size={17} />
                  <b>Guided reading</b>
                  <small>Grounded in context</small>
                </span>
                <span>
                  <BrainCircuit size={17} />
                  <b>Hybrid intelligence</b>
                  <small>Visible execution path</small>
                </span>
              </div>
            </div>
          </div>
          <div className="showcase-phone">
            <BrandMark compact size="sm" />
            <small>Good morning, Scholar.</small>
            <strong>Let’s discover something new today.</strong>
            <div>
              <BookOpen size={17} />
              <span>Continue learning</span>
              <b>68%</b>
            </div>
            <button onClick={enterApp}>
              <Camera size={17} /> Scan a page
            </button>
          </div>
        </div>
      </section>

      <section className="landing-principles" id="experience">
        <div>
          <p className="eyebrow">Designed around understanding</p>
          <h2>One connected learning experience, wherever you study.</h2>
        </div>
        <div className="principle-grid">
          {[
            [
              BookOpen,
              "Learn from your material",
              "Read, highlight, and ask questions without losing the original context.",
            ],
            [
              BrainCircuit,
              "Understand the AI path",
              "See when a demonstration uses an on-device or cloud route—and when neither is available.",
            ],
            [
              FlaskConical,
              "Practice with purpose",
              "Build confidence through safe conceptual exercises and concise feedback.",
            ],
          ].map(([Icon, title, copy]) => {
            const FeatureIcon = Icon as typeof BookOpen;
            return (
              <article key={title as string}>
                <span>
                  <FeatureIcon size={20} />
                </span>
                <h3>{title as string}</h3>
                <p>{copy as string}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-hybrid" id="hybrid">
        <div>
          <Badge variant="gold">Hackathon signature experience</Badge>
          <h2>Learning support that responds honestly to what is available.</h2>
          <p>
            El-Kīmiyā’s prototype makes preferred inference and the actual simulated provider
            distinct, so students never mistake cached content for a newly generated answer.
          </p>
          <button className="secondary-button" onClick={enterApp}>
            Open Hybrid AI demo <ChevronRight size={16} />
          </button>
        </div>
        <div className="landing-route">
          <article>
            <BrainCircuit size={22} />
            <strong>On-device AI</strong>
            <small>For compatible devices and supported tasks</small>
          </article>
          <span className="route-connector">
            <i />
            <BrandMark compact inverted size="sm" />
            <i />
          </span>
          <article>
            <Cloud size={22} />
            <strong>Cloud AI</strong>
            <small>For connected and extended capabilities</small>
          </article>
          <Badge>Interactive demonstration</Badge>
        </div>
      </section>

      <section className="landing-final" id="tools">
        <BrandMark size="lg" showTagline />
        <h2>Build a stronger understanding, one concept at a time.</h2>
        <button className="primary-button" onClick={enterApp}>
          Enter the learning workspace <ChevronRight size={17} />
        </button>
      </section>
      <footer className="landing-footer">
        <BrandMark inverted size="sm" showTagline />
        <p>Hybrid AI Chemistry Learning Platform · Demonstration prototype</p>
        <span>© 2026 El-Kīmiyā</span>
      </footer>
    </main>
  );
}

function Dashboard({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <main className="page dashboard-page">
      <div className="dashboard-welcome">
        <div>
          <span className="dashboard-overline"><i/> THE LEARNING JOURNAL <span> / </span> 01—04</span>
          <h2>Every great discovery<br/><em>begins with a question.</em></h2>
          <p>A thoughtful place to read, experiment, and understand chemistry—one idea at a time.</p>
        </div>
        <div className="dashboard-quick-actions" aria-label="Quick actions">
          <button onClick={() => setPage("scan")}><span><Camera size={18}/></span> Scan a page <ArrowUpRight size={17}/></button>
          <button onClick={() => setPage("tutor")}><span><MessageCircle size={18}/></span> Ask the tutor <ArrowUpRight size={17}/></button>
        </div>
      </div>
      <section className="dashboard-main">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your next step</p>
            <h2>Continue learning</h2>
          </div>
          <button className="text-button" onClick={() => setPage("library")}>
            View learning path <ChevronRight size={16} />
          </button>
        </div>
        <article className="continue-card">
          <div className="continue-copy">
            <span className="feature-overline">FEATURED LESSON <i/> CHAPTER NO. 03</span>
            <h3>
              The beautiful logic<br />
              of <em>chemical bonds.</em>
            </h3>
            <p>From atoms to molecules: explore the invisible relationships that shape everything around us.</p>
            <div className="continue-progress">
              <div>
                <span>Lesson progress</span>
                <strong>68%</strong>
              </div>
              <Progress value={68} />
            </div>
            <button className="primary-button" onClick={() => setPage("reader")}>
              Continue lesson <ChevronRight size={17} />
            </button>
          </div>
          <BondIllustration />
        </article>

        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Personal collection</p>
            <h2>My chemistry library</h2>
          </div>
          <button className="text-button" onClick={() => setPage("library")}>
            See all <ChevronRight size={16} />
          </button>
        </div>
        <div className="book-row">
          {books.map((book) => (
            <BookCard key={book.title} {...book} onOpen={() => setPage("reader")} />
          ))}
        </div>

        <div className="section-heading compact-heading">
          <div>
            <p className="eyebrow">Curated for you</p>
            <h2>Recommended next lessons</h2>
          </div>
        </div>
        <div className="lesson-grid">
          {[
            ["01", "Atomic structure", "18 min", "Atom"],
            ["02", "Chemical bonding", "24 min", "Bond"],
            ["03", "Acids & bases", "16 min", "pH"],
            ["04", "Stoichiometry", "28 min", "mol"],
          ].map(([n, title, time, symbol]) => (
            <button className="lesson-card" key={title} onClick={() => setPage("reader")}>
              <span className="lesson-number">{n}</span>
              <span className="lesson-symbol">{symbol}</span>
              <strong>{title}</strong>
              <small>{time} · Guided lesson</small>
              <span className="round-arrow">
                <ChevronRight size={16} />
              </span>
            </button>
          ))}
        </div>
      </section>
      <aside className="dashboard-aside">
        <article className="panel study-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">This week</p>
              <h3>Study overview</h3>
            </div>
            <MoreHorizontal size={20} />
          </div>
          <div className="study-ring">
            <span>
              <strong>4h 25m</strong>
              <small>learning time</small>
            </span>
          </div>
          <div className="stats-grid">
            <div>
              <BookOpen size={17} />
              <strong>12</strong>
              <span>Lessons</span>
            </div>
            <div>
              <Target size={17} />
              <strong>86%</strong>
              <span>Accuracy</span>
            </div>
            <div>
              <Zap size={17} />
              <strong>7 days</strong>
              <span>Streak</span>
            </div>
          </div>
        </article>
        <article className="panel quick-tutor">
          <div className="ai-orb">
            <MessageCircle size={20} />
          </div>
          <div>
            <p className="eyebrow">Quick AI tutor · Demo</p>
            <h3>Every question matters.</h3>
          </div>
          <p>Ask about the concept you are studying and receive a structured explanation.</p>
          <button onClick={() => setPage("tutor")}>
            Open the tutor <ArrowUpRight size={16} />
          </button>
        </article>
        <article className="panel challenge-card">
          <div className="challenge-head">
            <span>
              <FlaskConical size={18} />
            </span>
            <Badge variant="gold">Daily challenge</Badge>
          </div>
          <h3>Why does salt dissolve in water?</h3>
          <p>Use polarity and ionic attraction to form your answer.</p>
          <button className="secondary-button" onClick={() => setPage("practice")}>
            Start challenge <ChevronRight size={16} />
          </button>
        </article>
      </aside>
    </main>
  );
}

function BondIllustration() {
  return (
    <div className="bond-visual" aria-label="Illustration of a bent water molecule, H₂O">
      <div className="molecule-plate-top"><span>FIG. 01</span><span>MOLECULAR GEOMETRY</span></div>
      <svg className="water-diagram" viewBox="0 0 360 290" role="img" aria-label="Water molecule: oxygen bonded to two hydrogen atoms">
        <defs>
          <linearGradient id="oxygenShade" x1="0" x2="1"><stop offset="0" stopColor="#25465b"/><stop offset="1" stopColor="#55798a"/></linearGradient>
        </defs>
        <path d="M179 132 L91 212" stroke="#a4b6b9" strokeWidth="15" strokeLinecap="round"/>
        <path d="M181 132 L267 212" stroke="#a4b6b9" strokeWidth="15" strokeLinecap="round"/>
        <path d="M179 132 L91 212" stroke="#fbfaf6" strokeWidth="5" strokeLinecap="round"/>
        <path d="M181 132 L267 212" stroke="#fbfaf6" strokeWidth="5" strokeLinecap="round"/>
        <circle cx="180" cy="128" r="59" fill="url(#oxygenShade)"/>
        <circle cx="89" cy="216" r="38" fill="#cbd6d7"/>
        <circle cx="271" cy="216" r="38" fill="#cbd6d7"/>
        <text x="180" y="139" textAnchor="middle" fill="#fff" fontSize="37" fontWeight="650">O</text>
        <text x="89" y="227" textAnchor="middle" fill="#293b4e" fontSize="30" fontWeight="650">H</text>
        <text x="271" y="227" textAnchor="middle" fill="#293b4e" fontSize="30" fontWeight="650">H</text>
        <path d="M126 165 A75 75 0 0 1 234 165" fill="none" stroke="#b6a17e" strokeDasharray="3 6" strokeWidth="1.5"/>
      </svg>
      <div className="molecule-plate-bottom"><div><strong>H₂O</strong><span>Water / Polar covalent bonds</span></div><span className="molecule-angle">104.5° <small>BOND ANGLE</small></span></div>
    </div>
  );
}

function BookCard({
  title,
  meta,
  progress,
  tone,
  symbol,
  onOpen,
}: (typeof books)[0] & { onOpen: () => void }) {
  return (
    <button className="book-card" onClick={onOpen}>
      <span className={`book-cover cover-${tone}`}>
        <small>EL-KĪMIYĀ STUDY SERIES</small>
        <b>{symbol}</b>
        <span>
          DEMO
          <br />
          MATERIAL
        </span>
      </span>
      <span className="book-details">
        <strong>{title}</strong>
        <small>{meta}</small>
        <span className="book-progress">
          <Progress value={progress} />
          <i>{progress}%</i>
        </span>
      </span>
    </button>
  );
}

function LibraryPage({ setPage }: { setPage: (page: Page) => void }) {
  const [filter, setFilter] = useState("All resources");
  const [grid, setGrid] = useState(true);
  return (
    <main className="page standard-page">
      <section className="library-hero">
        <div>
          <Badge variant="gold">Private learning collection</Badge>
          <h2>
            A quiet place for every
            <br />
            idea you’re exploring.
          </h2>
          <p>
            Your uploaded materials remain personal. All examples shown here are clearly marked
            demonstration content.
          </p>
        </div>
        <button className="primary-button">
          <Upload size={17} /> Upload material
        </button>
      </section>
      <div className="toolbar">
        <label>
          <Search size={18} />
          <input placeholder="Search your library" />
        </label>
        <div className="filter-tabs">
          {["All resources", "Recently opened", "Downloaded", "Bookmarked"].map((item) => (
            <button
              key={item}
              className={filter === item ? "active" : ""}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button className={grid ? "active" : ""} onClick={() => setGrid(true)}>
            <Grid2X2 size={17} />
          </button>
          <button className={!grid ? "active" : ""} onClick={() => setGrid(false)}>
            <List size={18} />
          </button>
        </div>
      </div>
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">{filter}</p>
          <h2>Continue reading</h2>
        </div>
        <span className="muted">3 resources</span>
      </div>
      <div className={grid ? "library-grid" : "library-list"}>
        {books.map((book, index) => (
          <article className="library-book" key={book.title}>
            <button className={`large-cover cover-${book.tone}`} onClick={() => setPage("reader")}>
              <small>EL-KĪMIYĀ · DEMO</small>
              <strong>{book.symbol}</strong>
              <span>{book.title}</span>
              <i>STUDY EDITION · 2026</i>
            </button>
            <div className="library-book-info">
              <div>
                <Badge>{index === 0 ? "Offline ready" : "Demo resource"}</Badge>
                <button className="icon-button">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <h3>{book.title}</h3>
              <p>{book.meta}</p>
              <Progress value={book.progress} />
              <button className="text-button" onClick={() => setPage("reader")}>
                Continue reading <ChevronRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}

function ReaderPage({
  setPage,
  saveNote,
  dark,
}: {
  setPage: (page: Page) => void;
  saveNote: () => void;
  dark: boolean;
}) {
  const [selected, setSelected] = useState(false);
  const [explained, setExplained] = useState(true);
  return (
    <main className="reader-page">
      <aside className="reader-toc">
        <button className="back-button" onClick={() => setPage("library")}>
          <ChevronLeft size={17} /> My library
        </button>
        <div className="mini-book">
          <span className="cover-blue">H₂O</span>
          <div>
            <Badge>Demo material</Badge>
            <strong>Foundations of Chemistry</strong>
            <small>Chapter 03 of 12</small>
          </div>
        </div>
        <p className="eyebrow">Table of contents</p>
        {[
          "3.1 Why atoms connect",
          "3.2 Valence electrons",
          "3.3 Covalent bonds",
          "3.4 Ionic bonds",
          "3.5 Review",
        ].map((item, i) => (
          <button key={item} className={i === 2 ? "active" : ""}>
            <span>{i + 1}</span>
            {item}
          </button>
        ))}
        <div className="reader-progress">
          <div>
            <span>Chapter progress</span>
            <b>68%</b>
          </div>
          <Progress value={68} />
        </div>
      </aside>
      <article className="reader-content">
        <div className="reader-toolbar">
          <div>
            <BrandMark compact inverted={dark} size="sm" />
            <Badge variant="gold">Demonstration content</Badge>
            <span>7 min read</span>
          </div>
          <div>
            <button className="icon-button">
              <span className="font-small">Aa</span>
            </button>
            <button className="icon-button">
              <Bookmark size={17} />
            </button>
            <button className="icon-button">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>
        <div className="article-copy">
          <p className="chapter-kicker">Chapter 3 · Section 3</p>
          <h1>
            How atoms share:
            <br />
            covalent bonding
          </h1>
          <p className="article-lead">
            Atoms often become more stable by sharing electrons. This shared relationship creates
            some of the most familiar substances in our world.
          </p>
          <div className="editorial-rule">
            <span>03</span>
            <i />
          </div>
          <h2>A shared pair of electrons</h2>
          <p>
            Imagine two atoms approaching one another. Each has an outer shell that is not quite
            complete. Rather than transferring an electron entirely, the atoms can share access to a
            pair.
          </p>
          <div className="selectable-copy">
            <p onClick={() => setSelected(!selected)}>
              A <mark className={selected ? "selected" : ""}>covalent bond</mark> is formed when
              atoms share one or more pairs of electrons. The shared electrons are attracted to the
              nuclei of both atoms, helping hold the atoms together.
            </p>
            {selected && (
              <div className="selection-menu">
                <button onClick={() => setExplained(true)}>
                  <Sparkles size={15} /> Explain simply
                </button>
                <button onClick={saveNote}>
                  <NotebookPen size={15} /> Save note
                </button>
                <button>
                  <Layers3 size={15} /> Flashcard
                </button>
              </div>
            )}
          </div>
          <div className="concept-figure">
            <div>
              <span className="mini-atom">H</span>
              <i>••</i>
              <span className="mini-atom">H</span>
            </div>
            <p>
              <strong>H₂ — a single covalent bond</strong>
              <span>One shared pair of electrons connects the hydrogen atoms.</span>
            </p>
          </div>
          <h2>Why sharing creates stability</h2>
          <p>
            Shared electrons count toward the outer electron arrangement of both participating
            atoms. This simplified model helps us begin to predict molecular structure.
          </p>
          <p className="demo-disclaimer">
            This original passage is demonstration material and is not extracted from an uploaded or
            published textbook.
          </p>
        </div>
      </article>
      <aside className={`reader-ai ${explained ? "open" : ""}`}>
        <div className="ai-panel-head">
          <div>
            <span className="ai-orb">
              <Sparkles size={17} />
            </span>
            <div>
              <strong>Contextual tutor</strong>
              <small>Simulated explanation · Demo</small>
            </div>
          </div>
          <button className="icon-button" onClick={() => setExplained(false)}>
            <X size={17} />
          </button>
        </div>
        <div className="context-chip">
          <BookOpen size={15} />
          <span>Using selected passage</span>
          <Check size={15} />
        </div>
        <h3>Covalent bond, simply</h3>
        <p>
          Think of two atoms holding the same handle. The “handle” is a pair of electrons, and both
          atoms are attracted to it.
        </p>
        <div className="analogy-card">
          <Lightbulb size={19} />
          <div>
            <strong>A helpful analogy</strong>
            <p>
              It is like two neighbors sharing one lamp placed between their desks. Both benefit
              from the same light.
            </p>
          </div>
        </div>
        <div className="key-concept">
          <p className="eyebrow">Key concept</p>
          <strong>Sharing electrons can make each atom’s outer arrangement more stable.</strong>
        </div>
        <div className="source-box">
          <div>
            <strong>Source & evidence</strong>
            <Badge variant="neutral">Textbook context</Badge>
          </div>
          <p>Foundations of Chemistry · Demo section 3.3</p>
          <span>Source page not yet verified.</span>
        </div>
        <div className="reader-ai-actions">
          <button onClick={saveNote}>
            <Bookmark size={16} /> Save explanation
          </button>
          <button onClick={() => setPage("practice")} className="primary-button">
            Practice this <ChevronRight size={16} />
          </button>
        </div>
      </aside>
    </main>
  );
}

function TutorPage({ setPage }: { setPage: (page: Page) => void }) {
  const [asked, setAsked] = useState(false);
  const [input, setInput] = useState("");
  const submit = () => {
    if (input.trim() || !asked) setAsked(true);
  };
  return (
    <main className="tutor-page">
      <aside className="tutor-context">
        <p className="eyebrow">Learning context</p>
        <div className="current-book">
          <span className="cover-blue">H₂O</span>
          <div>
            <strong>Foundations of Chemistry</strong>
            <small>Chapter 3 · Chemical bonds</small>
          </div>
        </div>
        <button>
          <BookOpen size={17} /> Change study source <ChevronRight size={16} />
        </button>
        <div className="context-setting">
          <span>
            <Bookmark size={16} /> Ground in textbook
          </span>
          <i className="toggle on" />
        </div>
        <div className="privacy-note">
          <BrainCircuit size={18} />
          <p>
            <strong>Transparent by design</strong>Each explanation shows whether it uses textbook
            context, general AI knowledge, or an external reference.
          </p>
        </div>
      </aside>
      <section className="conversation">
        {!asked ? (
          <div className="tutor-welcome">
            <div className="large-ai-orb">
              <Sparkles size={28} />
            </div>
            <Badge>AI tutor · Interactive demo</Badge>
            <h2>
              What would you like to
              <br />
              understand today?
            </h2>
            <p>Ask about a chemical concept, explore a formula, or get help with a problem.</p>
            <div className="prompt-grid">
              {[
                "Explain ionic and covalent bonds.",
                "Why does salt dissolve in water?",
                "Help me balance an equation.",
                "Explain pH with an everyday example.",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    setAsked(true);
                  }}
                >
                  <span>{prompt}</span>
                  <ChevronRight size={17} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="answer-thread">
            <div className="user-message">Why does salt dissolve in water?</div>
            <div className="ai-answer">
              <div className="answer-intro">
                <span className="ai-orb">
                  <Sparkles size={17} />
                </span>
                <div>
                  <strong>El-Kīmiyā Tutor</strong>
                  <small>Simulated response · Cloud path demo</small>
                </div>
              </div>
              <div className="answer-section">
                <p className="eyebrow">01 · Short explanation</p>
                <h3>Water pulls salt’s ions apart.</h3>
                <p>
                  Water molecules are <strong>polar</strong>: one region is slightly negative and
                  another is slightly positive. These regions attract the charged sodium and
                  chloride ions in salt.
                </p>
              </div>
              <div className="answer-section steps">
                <p className="eyebrow">02 · Step by step</p>
                {[
                  "A salt crystal contains Na⁺ and Cl⁻ ions.",
                  "Water molecules orient around those charges.",
                  "The attraction helps separate ions from the crystal.",
                  "Hydrated ions spread through the water.",
                ].map((step, i) => (
                  <div key={step}>
                    <span>{i + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
              <div className="formula-card">
                <span>
                  NaCl<sub>(s)</sub>
                </span>
                <ChevronRight />
                <span>
                  Na<sup>+</sup>
                  <sub>(aq)</sub> + Cl<sup>−</sup>
                  <sub>(aq)</sub>
                </span>
              </div>
              <div className="source-box">
                <div>
                  <strong>Sources to inspect</strong>
                  <Badge variant="neutral">General AI explanation</Badge>
                </div>
                <p>Textbook context: topic alignment only</p>
                <span>No verified page citation available.</span>
              </div>
              <div className="answer-actions">
                <button>
                  <Lightbulb size={16} /> Give an analogy
                </button>
                <button>
                  <Layers3 size={16} /> Create flashcards
                </button>
                <button onClick={() => setPage("practice")}>
                  <Target size={16} /> Practice this
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a chemistry question..."
          />
          <div>
            <span>
              <Sparkles size={14} /> Answers may require verification
            </span>
            <button onClick={submit}>
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </section>
      <aside className="tutor-references">
        <div className="panel-title">
          <div>
            <p className="eyebrow">Supporting material</p>
            <h3>References</h3>
          </div>
          <SlidersHorizontal size={18} />
        </div>
        <div className="reference-card">
          <span>
            <BookOpen size={18} />
          </span>
          <div>
            <Badge variant="neutral">Textbook context</Badge>
            <strong>Chemical bonding</strong>
            <p>Demo material · Chapter 3</p>
          </div>
        </div>
        <div className="reference-card">
          <span>
            <Atom size={18} />
          </span>
          <div>
            <Badge variant="neutral">Related concept</Badge>
            <strong>Molecular polarity</strong>
            <p>Open in Chemistry Explorer</p>
          </div>
        </div>
        <div className="engine-mini" onClick={() => setPage("hybrid")}>
          <div>
            <span className="status-dot" />
            <div>
              <strong>Cloud path · Demo</strong>
              <small>Actual simulated provider</small>
            </div>
          </div>
          <ChevronRight size={17} />
        </div>
      </aside>
    </main>
  );
}

type Scenario = "local-online" | "local-offline" | "cloud-online" | "none";
function HybridPage({
  offline,
  setOffline,
}: {
  offline: boolean;
  setOffline: (v: boolean) => void;
}) {
  const [scenario, setScenario] = useState<Scenario>("local-online");
  const [preference, setPreference] = useState("Prefer on-device");
  const scenarios: { id: Scenario; title: string; note: string }[] = [
    {
      id: "local-online",
      title: "Supported local device, online",
      note: "On-device path selected",
    },
    {
      id: "local-offline",
      title: "Supported local device, offline",
      note: "Local supported tasks only",
    },
    { id: "cloud-online", title: "Unsupported local device, online", note: "Cloud path selected" },
    { id: "none", title: "No available inference", note: "Clear limitation shown" },
  ];
  const isLocal = scenario.startsWith("local");
  const unavailable = scenario === "none";
  const selectScenario = (id: Scenario) => {
    setScenario(id);
    setOffline(id === "local-offline" || id === "none");
  };
  return (
    <main className="page hybrid-page">
      <section className="hybrid-intro">
        <Badge variant="gold">Hybrid intelligence · Interactive demo</Badge>
        <h2>
          Intelligence that adapts
          <br />
          to your device.
        </h2>
        <p>
          El-Kīmiyā chooses a suitable available path while keeping you informed. This prototype
          simulates routing and does not execute a real model.
        </p>
      </section>
      <section className="engine-map">
        <article className={`engine-node local ${isLocal && !unavailable ? "active" : ""}`}>
          <span className="node-icon">
            <BrainCircuit size={25} />
          </span>
          <Badge>On-device</Badge>
          <h3>Fast, private assistance</h3>
          <p>Compatible local models can support short explanations and selected offline tasks.</p>
          <ul>
            <li>
              <Check /> Local processing
            </li>
            <li>
              <Check /> Supported offline tasks
            </li>
            <li>
              <Check /> Lower cloud dependency
            </li>
          </ul>
        </article>
        <div className="path-core">
          <span className={`path-line left ${isLocal && !unavailable ? "flow" : ""}`} />
          <div className="router-core">
            <BrandMark compact inverted size="sm" />
            <small>
              SMART
              <br />
              ROUTING
            </small>
          </div>
          <span className={`path-line right ${!isLocal && !unavailable ? "flow" : ""}`} />
          <div className="request-pill">
            <Sparkles size={15} /> Explain covalent bonding
          </div>
        </div>
        <article className={`engine-node cloud ${!isLocal && !unavailable ? "active" : ""}`}>
          <span className="node-icon">
            <Cloud size={25} />
          </span>
          <Badge>Cloud</Badge>
          <h3>Extended capabilities</h3>
          <p>Connected processing supports longer context and more complex learning workflows.</p>
          <ul>
            <li>
              <Check /> Advanced explanations
            </li>
            <li>
              <Check /> Connected references
            </li>
            <li>
              <Check /> Longer context
            </li>
          </ul>
        </article>
      </section>
      <section className="engine-controls">
        <article className="scenario-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Try the routing logic</p>
              <h3>Demo scenario</h3>
            </div>
            <Badge variant="gold">Simulation</Badge>
          </div>
          <div className="scenario-list">
            {scenarios.map((item) => (
              <button
                key={item.id}
                className={scenario === item.id ? "active" : ""}
                onClick={() => selectScenario(item.id)}
              >
                <span className="radio" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.note}</small>
                </span>
              </button>
            ))}
          </div>
        </article>
        <article className="status-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Current execution</p>
              <h3>Actual simulated status</h3>
            </div>
            <span className={`status-icon ${unavailable ? "error" : ""}`}>
              {unavailable ? <X /> : <Check />}
            </span>
          </div>
          <div className="status-rows">
            <div>
              <span>Internet connectivity</span>
              <strong>
                {offline ? (
                  <>
                    <WifiOff /> Offline
                  </>
                ) : (
                  <>
                    <Wifi /> Connected
                  </>
                )}
              </strong>
            </div>
            <div>
              <span>Local model availability</span>
              <strong>{isLocal ? "Available" : "Unavailable"}</strong>
            </div>
            <div>
              <span>Model preparation</span>
              <strong>{isLocal ? "Ready for supported tasks" : "Not available"}</strong>
            </div>
            <div>
              <span>Offline-ready content</span>
              <strong>3 books · 12 flashcards</strong>
            </div>
            <div>
              <span>Preferred inference</span>
              <strong>{preference}</strong>
            </div>
            <div>
              <span>Actual provider used</span>
              <strong className={unavailable ? "error-text" : ""}>
                {unavailable ? "Unavailable" : isLocal ? "On-device · Demo" : "Cloud · Demo"}
              </strong>
            </div>
          </div>
          <div className={`result-log ${unavailable ? "error" : ""}`}>
            <span />{" "}
            <p>
              <strong>{unavailable ? "Request not run" : "Simulated request completed"}</strong>
              {unavailable
                ? "No compatible inference path is available. Connect to the internet or enable a supported local model."
                : `The ${isLocal ? "local" : "cloud"} route was selected based on this scenario.`}
            </p>
          </div>
        </article>
        <article className="preference-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Your control</p>
              <h3>Inference preference</h3>
            </div>
          </div>
          <div className="segmented-stack">
            {["Prefer on-device", "On-device only", "Prefer cloud", "Cloud only"].map((mode) => (
              <button
                key={mode}
                className={preference === mode ? "active" : ""}
                onClick={() => setPreference(mode)}
              >
                <span>{mode}</span>
                {preference === mode && <Check size={16} />}
              </button>
            ))}
          </div>
          <p>
            Preferences guide routing but never override actual availability. Unsupported tasks show
            a limitation instead of fake success.
          </p>
        </article>
      </section>
    </main>
  );
}

function PracticePage() {
  const [answer, setAnswer] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [ph, setPh] = useState(7);
  return (
    <main className="page standard-page">
      <section className="page-intro">
        <Badge variant="gold">Safe educational simulation</Badge>
        <h2>
          Practice ideas.
          <br />
          Build understanding.
        </h2>
        <p>
          Conceptual activities reinforce chemistry thinking. They do not replace supervised
          laboratory instruction.
        </p>
      </section>
      <div className="practice-layout">
        <article className="quiz-card">
          <div className="quiz-top">
            <div>
              <p className="eyebrow">Challenge 1 of 5</p>
              <h3>Balance the equation</h3>
            </div>
            <Badge>Atomic structure</Badge>
          </div>
          <p className="quiz-question">Which coefficients correctly balance this reaction?</p>
          <div className="equation-large">
            <span>H₂</span>
            <b>+</b>
            <span>O₂</span>
            <b>→</b>
            <span>H₂O</span>
          </div>
          <div className="answer-grid">
            {["1, 1, 1", "2, 1, 2", "2, 2, 1", "1, 2, 2"].map((item, i) => (
              <button
                key={item}
                className={`${answer === i ? "selected" : ""} ${checked && i === 1 ? "correct" : ""}`}
                onClick={() => {
                  setAnswer(i);
                  setChecked(false);
                }}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {item}
                {checked && i === 1 && <Check size={18} />}
              </button>
            ))}
          </div>
          {checked && (
            <div className="feedback">
              <Check size={18} />
              <p>
                <strong>Exactly right.</strong> Two H₂ molecules provide four hydrogen atoms,
                matching two H₂O molecules. One O₂ provides both oxygen atoms.
              </p>
            </div>
          )}
          <div className="quiz-actions">
            <button className="secondary-button">
              <Lightbulb size={16} /> Reveal hint
            </button>
            <button
              className="primary-button"
              disabled={answer === null}
              onClick={() => setChecked(true)}
            >
              Check answer <ChevronRight size={16} />
            </button>
          </div>
        </article>
        <aside className="lab-modules">
          <article className="ph-card">
            <div>
              <span>
                <FlaskConical size={19} />
              </span>
              <Badge>Interactive</Badge>
            </div>
            <h3>Explore the pH scale</h3>
            <p>Move the control to see how common labels change.</p>
            <div className="ph-value">
              <strong>{ph}</strong>
              <span>{ph < 7 ? "Acidic" : ph > 7 ? "Basic" : "Neutral"}</span>
            </div>
            <input
              type="range"
              min="0"
              max="14"
              value={ph}
              onChange={(e) => setPh(Number(e.target.value))}
            />
            <div className="range-labels">
              <span>0 · Acidic</span>
              <span>7 · Neutral</span>
              <span>14 · Basic</span>
            </div>
          </article>
          <article className="module-link">
            <span>
              <Atom size={21} />
            </span>
            <div>
              <strong>Understand bonding</strong>
              <p>Compare ionic and covalent bonds visually.</p>
            </div>
            <ChevronRight size={18} />
          </article>
          <article className="module-link">
            <span>
              <RotateCcw size={21} />
            </span>
            <div>
              <strong>Reaction concepts</strong>
              <p>Explore safe conceptual demonstrations.</p>
            </div>
            <ChevronRight size={18} />
          </article>
        </aside>
      </div>
    </main>
  );
}

function ExplorerPage() {
  const [element, setElement] = useState("O");
  const elements = [
    ["H", "1"],
    ["C", "6"],
    ["N", "7"],
    ["O", "8"],
    ["Na", "11"],
    ["Cl", "17"],
  ];
  return (
    <main className="page standard-page">
      <section className="page-intro">
        <Badge variant="gold">Visual learning tool</Badge>
        <h2>
          See the structure
          <br />
          behind the substance.
        </h2>
        <p>Explore simplified educational models—not validated molecular simulations.</p>
      </section>
      <div className="explorer-layout">
        <article className="molecule-stage">
          <div className="stage-top">
            <div>
              <p className="eyebrow">Selected compound</p>
              <h3>
                Water · H<sub>2</sub>O
              </h3>
            </div>
            <button className="secondary-button">
              <Bookmark size={16} /> Save molecule
            </button>
          </div>
          <div className="water-model">
            <span className="water-o">O</span>
            <i className="water-bond left" />
            <i className="water-bond right" />
            <span className="water-h left">H</span>
            <span className="water-h right">H</span>
            <div className="rotate-hint">
              <RotateCcw size={15} /> Drag to inspect
            </div>
          </div>
          <div className="compound-stats">
            <div>
              <span>Formula</span>
              <strong>H₂O</strong>
            </div>
            <div>
              <span>Molar mass</span>
              <strong>≈ 18.015 g/mol</strong>
            </div>
            <div>
              <span>Bond type</span>
              <strong>Polar covalent</strong>
            </div>
          </div>
        </article>
        <aside className="element-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Mini periodic explorer</p>
              <h3>Select an element</h3>
            </div>
            <Search size={18} />
          </div>
          <div className="elements-grid">
            {elements.map(([symbol, number]) => (
              <button
                key={symbol}
                className={element === symbol ? "active" : ""}
                onClick={() => setElement(symbol)}
              >
                <small>{number}</small>
                <strong>{symbol}</strong>
              </button>
            ))}
          </div>
          <div className="element-detail">
            <span className="element-big">{element}</span>
            <div>
              <Badge>Element detail</Badge>
              <h3>
                {element === "O"
                  ? "Oxygen"
                  : element === "H"
                    ? "Hydrogen"
                    : element === "C"
                      ? "Carbon"
                      : "Selected element"}
              </h3>
              <p>Explore basic properties, bonding behavior, and related compounds.</p>
            </div>
          </div>
          <button className="primary-button">
            <Sparkles size={16} /> Ask AI about this compound
          </button>
        </aside>
      </div>
    </main>
  );
}

function FlashcardsPage() {
  const [flipped, setFlipped] = useState(false);
  const [index, setIndex] = useState(3);
  return (
    <main className="page flashcard-page">
      <section className="page-intro centered">
        <Badge variant="gold">Daily review · 12 cards</Badge>
        <h2>
          Make the important ideas
          <br />
          easy to remember.
        </h2>
      </section>
      <div className="deck-progress">
        <span>{index} of 12</span>
        <Progress value={(index / 12) * 100} />
        <span>9 remaining</span>
      </div>
      <button
        className={`flashcard ${flipped ? "flipped" : ""}`}
        onClick={() => setFlipped(!flipped)}
      >
        <div className="flashcard-face front">
          <Badge>Chemical bonding</Badge>
          <p className="eyebrow">Tap to reveal</p>
          <h3>What is an ionic bond?</h3>
          <span>
            <RotateCcw size={17} /> Flip card
          </span>
        </div>
        <div className="flashcard-face back">
          <Badge variant="gold">Answer</Badge>
          <h3>An electrostatic attraction between oppositely charged ions.</h3>
          <p>It usually forms after one atom transfers one or more electrons to another.</p>
          <span>
            <RotateCcw size={17} /> Show question
          </span>
        </div>
      </button>
      <div className="card-rating">
        <button onClick={() => setIndex(Math.min(index + 1, 12))}>
          <RotateCcw size={17} />
          <span>
            <strong>Review again</strong>
            <small>Under 1 minute</small>
          </span>
        </button>
        <button onClick={() => setIndex(Math.min(index + 1, 12))}>
          <CircleHelp size={17} />
          <span>
            <strong>Difficult</strong>
            <small>Tomorrow</small>
          </span>
        </button>
        <button onClick={() => setIndex(Math.min(index + 1, 12))}>
          <Check size={17} />
          <span>
            <strong>Easy</strong>
            <small>In 4 days</small>
          </span>
        </button>
      </div>
    </main>
  );
}

function ProgressPage() {
  return (
    <main className="page standard-page">
      <section className="page-intro">
        <Badge variant="gold">Learning, not scoring</Badge>
        <h2>
          Your progress,
          <br />
          made meaningful.
        </h2>
        <p>These estimates help guide review; they are not precise measurements of knowledge.</p>
      </section>
      <div className="analytics-grid">
        <article className="panel consistency">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Last 7 days</p>
              <h3>Learning consistency</h3>
            </div>
            <strong>5 days</strong>
          </div>
          <div className="week-bars">
            {[42, 80, 54, 92, 72, 18, 12].map((height, i) => (
              <div key={i}>
                <span style={{ height: `${height}%` }} />
                <small>{["M", "T", "W", "T", "F", "S", "S"][i]}</small>
              </div>
            ))}
          </div>
        </article>
        <article className="panel mastery">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Topic confidence</p>
              <h3>Suggested focus</h3>
            </div>
          </div>
          {[
            ["Atomic structure", 82],
            ["Chemical bonding", 68],
            ["Acids & bases", 51],
            ["Stoichiometry", 36],
          ].map(([name, value]) => (
            <div className="mastery-row" key={name}>
              <span>{name}</span>
              <Progress value={Number(value)} />
              <strong>{value}%</strong>
            </div>
          ))}
        </article>
        <article className="panel recommendation">
          <span>
            <Target size={22} />
          </span>
          <Badge>Recommended goal</Badge>
          <h3>Strengthen stoichiometry foundations</h3>
          <p>Complete two guided examples and a short five-question review this week.</p>
          <button className="primary-button">
            Start recommended review <ChevronRight size={16} />
          </button>
        </article>
      </div>
    </main>
  );
}

function SettingsPage({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const [language, setLanguage] = useState("English");
  return (
    <main className="page settings-page">
      <div className="settings-nav">
        <p className="eyebrow">Preferences</p>
        {[
          "Profile",
          "Learning preferences",
          "Language & region",
          "Appearance",
          "AI inference",
          "Offline downloads",
          "Privacy & data",
          "Accessibility",
        ].map((item, i) => (
          <button className={i === 3 ? "active" : ""} key={item}>
            {item}
            <ChevronRight size={16} />
          </button>
        ))}
      </div>
      <section className="settings-content">
        <Badge variant="gold">Personal workspace</Badge>
        <h2>Appearance & language</h2>
        <p>Shape your learning environment without changing the content itself.</p>
        <div className="settings-section">
          <h3>Color theme</h3>
          <div className="theme-options">
            <button className={!dark ? "active" : ""} onClick={() => setDark(false)}>
              <span className="theme-preview light">
                <i />
                <b />
              </span>
              <strong>Light</strong>
              <small>Warm, focused surfaces</small>
            </button>
            <button className={dark ? "active" : ""} onClick={() => setDark(true)}>
              <span className="theme-preview dark">
                <i />
                <b />
              </span>
              <strong>Deep navy</strong>
              <small>Lower-light learning</small>
            </button>
          </div>
        </div>
        <div className="settings-section">
          <h3>Preferred language</h3>
          <div className="language-options">
            {["English", "Bahasa Indonesia"].map((item) => (
              <button
                key={item}
                onClick={() => setLanguage(item)}
                className={language === item ? "active" : ""}
              >
                <span>
                  <strong>{item}</strong>
                  <small>
                    {item === "English" ? "Primary interface language" : "Bahasa antarmuka"}
                  </small>
                </span>
                {language === item && <Check size={18} />}
              </button>
            ))}
          </div>
          <p className="setting-note">
            Arabic terminology may appear in explanations; full Arabic AI support is not promised in
            this prototype.
          </p>
        </div>
        <div className="settings-brand-panel">
          <BrandMark size="md" showTagline />
          <div>
            <Badge>About El-Kīmiyā</Badge>
            <p>
              Hybrid AI Chemistry Learning Platform · Web prototype for educational demonstration.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScanPage({ setPage }: { setPage: (page: Page) => void }) {
  const [step, setStep] = useState<"camera" | "review" | "result">("camera");
  return (
    <main className="scan-page">
      {step === "camera" && (
        <div className="camera-view">
          <div className="camera-noise" />
          <div className="scan-header">
            <button className="icon-button" onClick={() => setPage("dashboard")}>
              <X />
            </button>
            <div>
              <BrandMark compact inverted size="sm" />
              <strong>Scan textbook page</strong>
              <small>Camera simulation · Demo</small>
            </div>
            <button className="icon-button">
              <Zap />
            </button>
          </div>
          <div className="scan-frame">
            <i />
            <i />
            <i />
            <i />
            <div className="sample-page">
              <small>DEMONSTRATION MATERIAL</small>
              <h3>Covalent Bonds</h3>
              <p>
                Atoms can achieve a more stable electron arrangement by sharing pairs of
                electrons...
              </p>
              <p>The shared pair is attracted to both nuclei.</p>
            </div>
          </div>
          <p className="scan-hint">Keep the page flat and inside the frame</p>
          <div className="camera-actions">
            <button>
              <Upload size={20} />
              <small>Gallery</small>
            </button>
            <button className="capture" onClick={() => setStep("review")}>
              <span />
            </button>
            <button>
              <MoreHorizontal size={20} />
              <small>Options</small>
            </button>
          </div>
        </div>
      )}
      {step === "review" && (
        <div className="scan-review">
          <div className="scan-review-head">
            <button className="icon-button" onClick={() => setStep("camera")}>
              <ChevronLeft />
            </button>
            <div>
              <BrandMark compact size="sm" />
              <strong>Review detected text</strong>
              <small>Simulated OCR · verify before use</small>
            </div>
            <Badge>Demo</Badge>
          </div>
          <div className="captured-page">
            <small>DEMONSTRATION MATERIAL</small>
            <h2>Covalent Bonds</h2>
            <p className="detected">
              Atoms can achieve a more stable electron arrangement by sharing pairs of electrons.
            </p>
            <p>The shared pair is attracted to both nuclei, helping hold the atoms together.</p>
          </div>
          <div className="scan-bottom">
            <p>
              <Check size={16} /> Text detected. Select a passage to continue.
            </p>
            <button className="primary-button" onClick={() => setStep("result")}>
              Explain selected text <Sparkles size={16} />
            </button>
          </div>
        </div>
      )}
      {step === "result" && (
        <div className="scan-result">
          <div className="scan-review-head">
            <button className="icon-button" onClick={() => setStep("review")}>
              <ChevronLeft />
            </button>
            <div>
              <BrandMark compact size="sm" />
              <strong>Grounded explanation</strong>
              <small>Based on selected demo text</small>
            </div>
            <Badge>Demo</Badge>
          </div>
          <div className="scan-answer-orb">
            <Sparkles />
          </div>
          <Badge variant="gold">Simple explanation</Badge>
          <h2>
            Atoms can share electrons
            <br />
            to become more stable.
          </h2>
          <p>
            Think of two atoms using the same pair of electrons. Both nuclei attract that shared
            pair, which helps keep the atoms connected.
          </p>
          <div className="source-box">
            <div>
              <strong>Source</strong>
              <Badge variant="neutral">Captured text</Badge>
            </div>
            <p>Personal scan · Demonstration page</p>
            <span>No published page metadata available.</span>
          </div>
          <div className="mobile-action-grid">
            <button onClick={() => setPage("notes")}>
              <NotebookPen />
              Save note
            </button>
            <button onClick={() => setPage("flashcards")}>
              <Layers3 />
              Create card
            </button>
          </div>
          <button className="primary-button full" onClick={() => setPage("practice")}>
            Practice this concept <ChevronRight />
          </button>
        </div>
      )}
    </main>
  );
}

function MobileBottomNav({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const items: { id: Page; label: string; icon: typeof Home }[] = [
    { id: "dashboard", label: "Home", icon: Home },
    { id: "library", label: "Library", icon: Library },
    { id: "scan", label: "Scan", icon: Camera },
    { id: "practice", label: "Practice", icon: FlaskConical },
    { id: "profile", label: "Profile", icon: User },
  ];
  return (
    <nav className="mobile-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={page === item.id ? "active" : ""}
            onClick={() => setPage(item.id)}
          >
            <span className={item.id === "scan" ? "scan-nav-icon" : ""}>
              <Icon size={20} />
            </span>
            <small>{item.label}</small>
          </button>
        );
      })}
    </nav>
  );
}

function SimplePage({ type, setPage }: { type: "notes" | "profile"; setPage: (p: Page) => void }) {
  return (
    <main className="page standard-page">
      <section className="page-intro">
        <Badge variant="gold">
          {type === "notes" ? "Personal knowledge" : "Account & preferences"}
        </Badge>
        <h2>
          {type === "notes"
            ? "Your saved ideas, kept close."
            : "A learning space that feels like yours."}
        </h2>
        <p>
          {type === "notes"
            ? "Notes and explanations saved from your study sessions appear here."
            : "Manage your profile, language, offline content, accessibility, and AI preferences."}
        </p>
      </section>
      <div className="empty-state">
        <span>{type === "notes" ? <NotebookPen /> : <User />}</span>
        <h3>
          {type === "notes" ? "Your first saved note is ready to happen." : "Scholar profile"}
        </h3>
        <p>
          {type === "notes"
            ? "Open a textbook, select a passage, and save an explanation to build your collection."
            : "Secondary School learner · English · 7 day learning streak"}
        </p>
        <button
          className="primary-button"
          onClick={() => setPage(type === "notes" ? "reader" : "settings")}
        >
          {type === "notes" ? "Open textbook" : "Manage settings"}
          <ChevronRight size={16} />
        </button>
      </div>
    </main>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [offline, setOffline] = useState(false);
  const [toast, setToast] = useState("");
  const saveNote = () => {
    setToast("Explanation saved to your notes");
    window.setTimeout(() => setToast(""), 2500);
  };
  const content = useMemo(() => {
    if (page === "landing") return <LandingPage enterApp={() => setPage("dashboard")} />;
    if (page === "dashboard") return <Dashboard setPage={setPage} />;
    if (page === "library") return <LibraryPage setPage={setPage} />;
    if (page === "reader") return <ReaderPage setPage={setPage} saveNote={saveNote} dark={dark} />;
    if (page === "tutor") return <TutorPage setPage={setPage} />;
    if (page === "hybrid") return <HybridPage offline={offline} setOffline={setOffline} />;
    if (page === "practice") return <PracticePage />;
    if (page === "explorer") return <ExplorerPage />;
    if (page === "flashcards") return <FlashcardsPage />;
    if (page === "progress") return <ProgressPage />;
    if (page === "settings") return <SettingsPage dark={dark} setDark={setDark} />;
    if (page === "scan") return <ScanPage setPage={setPage} />;
    if (page === "notes" || page === "profile") return <SimplePage type={page} setPage={setPage} />;
    return <Dashboard setPage={setPage} />;
  }, [page, offline, dark]);
  if (page === "landing") {
    return <div className={dark ? "app dark" : "app"}>{content}</div>;
  }
  return (
    <div className={dark ? "app dark" : "app"}>
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="app-shell">
        {page !== "reader" && page !== "scan" && (
          <Header page={page} setPage={setPage} dark={dark} setDark={setDark} offline={offline} />
        )}
        {content}
      </div>
      <button
        className="mobile-tutor-fab"
        onClick={() => setPage("tutor")}
        aria-label="Ask AI tutor"
      >
        <Sparkles size={19} />
      </button>
      <MobileBottomNav page={page} setPage={setPage} />
      {toast && (
        <div className="toast">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
