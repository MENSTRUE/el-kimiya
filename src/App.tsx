import { useEffect, useState, type ReactNode } from "react";
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
import { BookResearchPanel } from "./components/BookResearchPanel";
import { ChemistryFaithPage } from "./components/ChemistryFaithPage";
import { getDemoAnswer, starterCards, quizzes, elements, type StudyCard } from "./data/learning";
import { useStoredState, createNote, type SavedNote, type StudyProgress } from "./lib/storage";
import { firebaseConfigured, runHybridInference, type InferencePreference } from "./lib/hybrid";

type Page =
  | "landing"
  | "dashboard"
  | "library"
  | "faith"
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
  { id: "faith", label: "Kimia & Keimanan", icon: Sparkles },
  { id: "tutor", label: "AI Chemistry Tutor", icon: BrainCircuit },
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
    {label:"QS. Luqman ayat 20",meta:"Kimia & Keimanan",to:"faith"},
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
    faith: "Kimia & Keimanan",
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
          <span>{offline ? "Offline scenario" : firebaseConfigured ? "Firebase configured" : "Curated demo"}</span>
          <Badge>{firebaseConfigured?'SDK':'Demo'}</Badge>
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

function LandingPage({ enterApp, openFaith }: { enterApp: () => void; openFaith: () => void }) {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <button aria-label="El-Kīmiyā home" onClick={enterApp}>
          <BrandMark size="sm" showTagline />
        </button>
        <nav aria-label="Public website navigation">
          <a href="#product">Product</a>
          <a href="#experience">How it works</a>
          <a href="#hybrid">Hybrid AI</a>
          <a href="#tools">Learning tools</a>
          <button className="landing-faith-link" onClick={openFaith}>Sains & Iman</button>
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

      <section className="faith-landing-teaser" aria-label="Kimia dan keimanan">
        <div><span className="faith-eyebrow">TAFAKKUR · QS. LUQMAN 31:20</span><h2>Belajar kimia. Menemukan manfaat. Mensyukuri ciptaan.</h2><p>Temukan bagaimana ilmu kimia dapat mengajak kita berpikir kritis, berbuat manfaat, dan menjaga lingkungan—dengan ayat serta sumber yang jelas.</p></div>
        <button onClick={openFaith}>Jelajahi Kimia & Keimanan <ArrowRight size={17}/></button>
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

        <article className="faith-teaser" aria-label="Kimia dan keimanan">
          <div><span className="faith-eyebrow"><Sparkles size={14}/> TAFAKKUR · QS. LUQMAN [31]: 20</span><h3>Mengapa kita mempelajari ilmu kimia?</h3><p>Kenali manfaat ilmu, renungkan nikmat Allah, dan pelajari cara menjaga alam secara bertanggung jawab.</p></div>
          <button onClick={() => setPage("faith")}>Jelajahi hikmah <ArrowRight size={16}/></button>
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
              <p className="eyebrow">Sample progress · Demo</p>
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

function LibraryPage({ setPage, addNote, notify, askAbout }: { setPage:(page:Page)=>void; addNote:(title:string,content:string,source:string)=>void; notify:(message:string)=>void; askAbout:(prompt:string)=>void }) {
  const [filter, setFilter] = useState("All resources");
  const [grid, setGrid] = useState(true);
  const [query,setQuery] = useState('');
  const [bookmarked] = useStoredState('elk.reader.bookmarked',false);
  type UploadedText = {id:string;name:string;content:string;createdAt:string};
  const [uploaded,setUploaded] = useStoredState<UploadedText[]>('elk.uploadedTexts',[]);
  const [openUpload,setOpenUpload] = useState<UploadedText|null>(null);
  const [uploadError,setUploadError] = useState('');
  useEffect(()=>{if(!openUpload)return;const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpenUpload(null)};document.addEventListener('keydown',close);return()=>document.removeEventListener('keydown',close)},[openUpload]);
  const handleUpload = async (file?:File) => {
    if(!file)return;
    if(!/\.(txt|md)$/i.test(file.name)){setUploadError('Only .txt and .md are supported here. PDF and photo OCR are not implemented.');return}
    if(file.size>80_000){setUploadError('Text files must be under 80 KB for this local demo.');return}
    try {const content=await file.text();setUploaded(prev=>[{id:String(Date.now()),name:file.name,content:content.slice(0,80000),createdAt:new Date().toISOString()},...prev]);setUploadError('');notify('Text imported to this browser');}
    catch {setUploadError('Could not read this text file.');}
  };
  const visibleBooks=books.filter(book=> (filter==='All resources'||filter==='Demo materials'||(filter==='Bookmarked'&&bookmarked))&&`${book.title} ${book.meta}`.toLowerCase().includes(query.toLowerCase()));
  const visibleUploads=uploaded.filter(file=> (filter==='All resources'||filter==='Your uploads')&&`${file.name} ${file.content}`.toLowerCase().includes(query.toLowerCase()));
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
        <label className="primary-button upload-text-label"><Upload size={17}/> Upload .txt / .md <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={e=>{void handleUpload(e.target.files?.[0]);e.target.value=''}}/></label>
      </section>
      <article className="faith-teaser" aria-label="Landasan belajar kimia">
        <div><span className="faith-eyebrow"><Sparkles size={14}/> SAINS & KEIMANAN</span><h3>Ilmu kimia sebagai jalan untuk memberi manfaat.</h3><p>QS. Luqman: 20 mengajak kita memperhatikan nikmat Allah di langit dan bumi.</p></div>
        <button onClick={() => setPage("faith")}>Baca refleksi <ArrowRight size={16}/></button>
      </article>
      <BookResearchPanel askAbout={askAbout} notify={notify}/>
      <div className="toolbar">
        <label>
          <Search size={18} />
          <input placeholder="Search your library" value={query} onChange={e=>setQuery(e.target.value)} aria-label="Search your library"/>
        </label>
        <div className="filter-tabs">
          {["All resources", "Demo materials", "Your uploads", "Bookmarked"].map((item) => (
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
        <span className="muted">{visibleBooks.length+visibleUploads.length} resources</span>
      </div>
      <div className={grid ? "library-grid" : "library-list"}>
        {visibleBooks.map((book, index) => (
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
                <button className="icon-button" title="Open demo textbook" aria-label={`Open ${book.title}`} onClick={()=>setPage('reader')}>
                  <BookOpen size={18}/>
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
      {uploadError&&<p className="inline-alert" role="alert">{uploadError}</p>}
      {visibleUploads.length>0&&<section className="uploaded-library"><div className="section-heading compact-heading"><div><p className="eyebrow">PERSONAL DOCUMENTS · BROWSER-LOCAL</p><h2>Your imported text</h2></div></div>
        <div className="uploaded-grid">{visibleUploads.map(file=><article className="uploaded-item" key={file.id}><FileText size={25}/><h3>{file.name}</h3><p>{file.content.slice(0,140)}{file.content.length>140?'…':''}</p><small>Local file · Not AI-indexed · {new Date(file.createdAt).toLocaleDateString()}</small><div><button className="secondary-button" onClick={()=>setOpenUpload(file)}>Read text</button><button className="icon-button" title={`Remove ${file.name}`} aria-label={`Remove ${file.name}`} onClick={()=>setUploaded(prev=>prev.filter(item=>item.id!==file.id))}><X size={17}/></button></div></article>)}</div>
      </section>}
      {visibleBooks.length===0&&visibleUploads.length===0&&<div className="empty-state"><BookOpen size={30}/><h3>No matching learning materials</h3><p>Try another search or import your own text.</p></div>}
      {openUpload&&<div className="modal-backdrop" role="presentation" onClick={()=>setOpenUpload(null)}><section className="import-modal" role="dialog" aria-modal="true" aria-label={`Read ${openUpload.name}`} onClick={event=>event.stopPropagation()}><div className="modal-head"><div><Badge>Your private document</Badge><h2>{openUpload.name}</h2></div><button className="icon-button" onClick={()=>setOpenUpload(null)} aria-label="Close text preview"><X size={18}/></button></div><pre>{openUpload.content}</pre><div className="modal-actions"><button className="primary-button" onClick={()=>{addNote(openUpload.name,openUpload.content.slice(0,1800),`Personal upload: ${openUpload.name}`);setOpenUpload(null)}}><NotebookPen size={17}/> Save excerpt as note</button></div></section></div>}
    </main>
  );
}

function ReaderPage({ setPage, addNote, addCard, dark, notify }: {
  setPage: (page: Page) => void;
  addNote: (title:string, content:string, source:string)=>void;
  addCard: (card:StudyCard)=>void;
  dark:boolean;
  notify:(message:string)=>void;
}) {
  const chapters = [
    { title:'Why atoms connect', detail:'Atoms interact because electrostatic forces can favor more stable arrangements.', explain:'Atoms can form stable groups when the balance of attraction and repulsion lowers their energy.' },
    { title:'Valence electrons', detail:'Valence electrons occupy the outermost occupied electron shell in the simplest models. They strongly influence bonding.', explain:'Think of valence electrons as the electrons most involved when atoms bond.' },
    { title:'Covalent bonds', detail:'A covalent bond forms when atoms share one or more electron pairs. The shared electrons are attracted by both nuclei.', explain:'A covalent bond is a shared electron pair that helps hold atoms together.' },
    { title:'Ionic bonds', detail:'Ionic bonding involves electrostatic attraction between oppositely charged ions, often formed after electron transfer.', explain:'Positive and negative ions attract each other, like opposite electrical charges.' },
    { title:'Review', detail:'Covalent bonds involve shared electrons; ionic bonds involve attractive forces between ions. Many real bonds show mixed characteristics.', explain:'Ask what happens to the electrons and what attracts the particles.' },
  ];
  const [chapter,setChapter] = useState(2);
  const [selected,setSelected] = useState(false);
  const [explained,setExplained] = useState(true);
  const [large,setLarge] = useStoredState('elk.reader.large', false);
  const [bookmarked,setBookmarked] = useStoredState('elk.reader.bookmarked', false);
  const current = chapters[chapter];
  const source = `El-Kīmiyā original demo lesson · Chapter 3 · ${chapter + 1} (not from Gontor book)`;
  const save = () => addNote(current.title, current.detail, source);
  const makeCard = () => { addCard({ id:`custom-${Date.now()}`, topic:'Textbook review', question:`Explain: ${current.title}`, answer:current.explain, detail:current.detail }); notify('Flashcard added to your deck'); };
  return (
    <main className="reader-page">
      <aside className="reader-toc">
        <button className="back-button" onClick={() => setPage('library')}><ChevronLeft size={17}/> My library</button>
        <div className="mini-book"><span className="cover-blue">H₂O</span><div><Badge>Demo lesson</Badge><strong>Foundations of Chemistry</strong><small>Chapter 03 of 12</small></div></div>
        <p className="eyebrow">Table of contents</p>
        {chapters.map((section,i) => <button key={section.title} className={i===chapter?'active':''} aria-current={i===chapter?'page':undefined} onClick={()=>{setChapter(i);setSelected(false);setExplained(true)}}><span>{i+1}</span>{`3.${i+1} ${section.title}`}</button>)}
        <div className="reader-progress"><div><span>Demo chapter</span><b>{chapter+1} / 5</b></div><Progress value={(chapter+1)*20}/></div>
      </aside>
      <article className="reader-content">
        <div className="reader-toolbar"><div><BrandMark compact inverted={dark} size="sm"/><Badge variant="gold">Original demo content</Badge></div>
          <div><button className="icon-button" title="Toggle larger text" aria-label="Toggle larger text" aria-pressed={large} onClick={()=>setLarge(!large)}><span className="font-small">Aa</span></button>
          <button className="icon-button" title="Bookmark section" aria-label="Bookmark section" aria-pressed={bookmarked} onClick={()=>{setBookmarked(!bookmarked);notify(!bookmarked?'Lesson bookmarked':'Bookmark removed')}}><Bookmark size={17} fill={bookmarked?'currentColor':'none'}/></button>
          <button className="icon-button" title="Save a note" aria-label="Save lesson note" onClick={save}><NotebookPen size={18}/></button></div>
        </div>
        <div className={`article-copy ${large?'reader-large-text':''}`}>
          <p className="chapter-kicker">Chapter 3 · Section {chapter+1}</p><h1>{current.title}</h1>
          <p className="article-lead">Explore the forces and electrons that give molecules their structure.</p>
          <div className="editorial-rule"><span>03</span><i/></div>
          <h2>A concept worth understanding</h2>
          <p>In chemistry, the behavior of electrons provides a useful starting point for understanding why atoms interact. The models are simplifications that help us explain what we observe.</p>
          <div className="selectable-copy">
            <button className="passage-select" aria-pressed={selected} onClick={()=>setSelected(!selected)}><span className={selected?'selected':''}>{current.detail}</span><small>Click this passage to {selected?'close':'open'} study actions</small></button>
            {selected&&<div className="selection-menu"><button onClick={()=>setExplained(true)}><Lightbulb size={15}/> Explain simply</button><button onClick={save}><NotebookPen size={15}/> Save note</button><button onClick={makeCard}><Layers3 size={15}/> Make flashcard</button></div>}
          </div>
          <div className="concept-figure"><div><span className="mini-atom">H</span><i>••</i><span className="mini-atom">H</span></div><p><strong>H₂ — a simple covalent model</strong><span>One shared electron pair connects two hydrogen atoms. Illustrative model, not to scale.</span></p></div>
          <h2>Check your understanding</h2><p>Can you describe the role of electrons and identify the forces involved? Try summarizing the idea in your own words before opening the explanation.</p>
          <button className="secondary-button" onClick={()=>setExplained(true)}><BrainCircuit size={17}/> Open contextual explanation</button>
          <p className="demo-disclaimer">This is original demonstration material. No photographed Gontor textbook pages have been processed. Book title and page reference are not verified.</p>
        </div>
      </article>
      <aside className={`reader-ai ${explained?'open':''}`}>
        <div className="ai-panel-head"><div><span className="ai-orb"><Lightbulb size={17}/></span><div><strong>Contextual study guide</strong><small>Static demonstration, not AI-generated</small></div></div><button className="icon-button" aria-label="Hide explanation" onClick={()=>setExplained(false)}><X size={17}/></button></div>
        {explained&&<><div className="context-chip"><BookOpen size={15}/><span>Based on displayed demo passage</span><Check size={15}/></div><h3>{current.title}, simply</h3><p>{current.explain}</p>
          <div className="analogy-card"><Lightbulb size={19}/><div><strong>Think it through</strong><p>Identify the particles, then explain which forces attract them.</p></div></div>
          <div className="source-box"><div><strong>Source & evidence</strong><Badge variant="neutral">Demo passage</Badge></div><p>{source}</p><span>No external book/page citation claimed.</span></div>
          <div className="reader-ai-actions"><button onClick={save}><Bookmark size={16}/> Save explanation</button><button onClick={()=>setPage('practice')} className="primary-button">Practice <ChevronRight size={16}/></button></div>
        </>}
        {!explained&&<button className="secondary-button" onClick={()=>setExplained(true)}>Show explanation</button>}
      </aside>
    </main>
  );
}

function TutorPage({ setPage, addNote, addCard, preference, initialPrompt, clearInitialPrompt }: {
  setPage:(page:Page)=>void;
  addNote:(title:string,content:string,source:string)=>void;
  addCard:(card:StudyCard)=>void;
  preference:InferencePreference;
  initialPrompt:string;
  clearInitialPrompt:()=>void;
}) {
  type Entry = { id:number; prompt:string; text:string; topic:string; example?:string; steps?:string[]; provider:string; error?:string; live:boolean; inputSources?:string[] };
  const [messages,setMessages] = useState<Entry[]>([]);
  const [input,setInput] = useState(initialPrompt);
  const [running,setRunning] = useState(false);
  const [download,setDownload] = useState<number|null>(null);
  const [grounded,setGrounded] = useState(true);
  useEffect(()=>{if(initialPrompt){setInput(initialPrompt);clearInitialPrompt()}},[initialPrompt,clearInitialPrompt]);
  const last = messages[messages.length-1];
  const ask = async (raw?:string) => {
    const prompt=(raw ?? input).trim();
    if(!prompt || running) return;
    const privateSourceQuestion=prompt.includes('PRIVATE USER-SELECTED PDF EXCERPTS:');
    const visibleQuestion=privateSourceQuestion?(prompt.match(/QUESTION: ([^\n]+)/)?.[1]||'Question about private PDF excerpts'):prompt;
    const sourceCitations=[...prompt.matchAll(/\[SOURCE: (.*?), PDF page (\d+)\]/g)].slice(0,3).map(match=>`${match[1]} · PDF p. ${match[2]}`);
    setInput(''); setRunning(true); setDownload(null);
    try {
      if(firebaseConfigured){
        const result=await runHybridInference(`You are El-Kīmiyā, a careful chemistry learning tutor. Explain accurately and concisely, with a small example. Do not invent textbook citations. Student question: ${prompt}`,preference,setDownload);
        setMessages(prev=>[...prev,{id:Date.now(),prompt:visibleQuestion,text:result.text,inputSources:sourceCitations,provider:result.provider==='ON_DEVICE'?'On-device · Firebase verified':'Cloud · Firebase verified',topic:'Chemistry explanation',live:true}]);
      } else {
        if(privateSourceQuestion){
          setMessages(prev=>[...prev,{id:Date.now(),prompt:visibleQuestion,text:'No AI response was generated from the private PDF excerpts because Firebase AI Logic is not yet configured. Connect Firebase and run real inference to use this feature.',topic:'Private sources · Firebase required',provider:'No model executed',live:false,inputSources:sourceCitations,error:'Configure Firebase and App Check before asking the model to use imported sources.'}]);
          return;
        }
        const answer=getDemoAnswer(prompt);
        if(!answer){setMessages(prev=>[...prev,{id:Date.now(),prompt,text:'This offline demonstration includes curated examples only. Try asking about covalent bonds, salt dissolving in water, balancing equations, pH, or atoms. Add Firebase credentials to generate original answers.',topic:'Not in demo library',provider:'No model executed',live:false,error:'No live AI configured'}]);}
        else setMessages(prev=>[...prev,{id:Date.now(),prompt,text:answer.summary,steps:answer.steps,example:answer.example,topic:answer.title,provider:'Curated demo content · No model executed',live:false}]);
      }
    } catch(error){setMessages(prev=>[...prev,{id:Date.now(),prompt,text:'No answer was generated. Your prompt was not silently replaced with a sample.',topic:'Request failed',provider:'Firebase attempted · No provider confirmed',live:false,error:error instanceof Error?error.message:String(error)}]);}
    finally {setRunning(false)}
  };
  const saveLast = () => {if(last&&!last.error)addNote(last.topic,last.text+(last.example?`\nExample: ${last.example}`:''),last.provider)};
  const createLastCard = () => {if(last&&!last.error)addCard({id:`tutor-${Date.now()}`,topic:last.topic,question:last.prompt,answer:last.text,detail:last.example||last.provider})};
  return <main className="tutor-page">
    <aside className="tutor-context"><p className="eyebrow">Learning context</p><div className="current-book"><span className="cover-blue">H₂O</span><div><strong>Foundations of Chemistry</strong><small>Original demonstration lesson</small></div></div>
      <button onClick={()=>setPage('library')}><BookOpen size={17}/> Open study source <ChevronRight size={16}/></button>
      <button className="context-setting" onClick={()=>setGrounded(!grounded)} aria-pressed={grounded}><span><Bookmark size={16}/> Show source reminders</span><i className={`toggle ${grounded?'on':''}`}/></button>
      {grounded&&<div className="privacy-note"><BrainCircuit size={18}/><p><strong>Sources are labeled</strong>Live AI answers are not textbook citations. Verify chemistry against reputable references.</p></div>}
    </aside>
    <section className="conversation">
      {messages.length===0?<div className="tutor-welcome"><div className="large-ai-orb"><BrainCircuit size={28}/></div><Badge>{firebaseConfigured?'Firebase AI Logic configured':'Interactive curated demo'}</Badge><h2>What would you like to<br/>understand today?</h2><p>{firebaseConfigured?'Ask a question. Each response shows which inference provider actually responded.':'Try one of the supported questions. Live generation requires Firebase configuration.'}</p>
        <div className="prompt-grid">{['Explain ionic and covalent bonds.','Why does salt dissolve in water?','Help me balance an equation.','Explain pH with an everyday example.'].map(prompt=><button key={prompt} onClick={()=>void ask(prompt)}><span>{prompt}</span><ChevronRight size={17}/></button>)}</div></div>
      :<div className="answer-thread" aria-live="polite">{messages.map(message=><div className="thread-pair" key={message.id}><div className="user-message">{message.prompt}</div><div className="ai-answer">
        <div className="answer-intro"><span className="ai-orb"><BrainCircuit size={17}/></span><div><strong>El-Kīmiyā tutor</strong><small>{message.provider}</small></div></div>
        <div className="answer-section"><p className="eyebrow">{message.live?'LIVE INFERENCE':'LEARNING RESPONSE'}</p><h3>{message.topic}</h3><p>{message.text}</p></div>
        {message.steps&&<div className="answer-section steps"><p className="eyebrow">STEP BY STEP</p>{message.steps.map((step,i)=><div key={i}><span>{i+1}</span><p>{step}</p></div>)}</div>}
        {message.example&&<div className="formula-card"><span>{message.example}</span></div>}
        {message.error&&<p className="inline-alert" role="alert"><CircleHelp size={16}/>{message.error}</p>}
        <div className="source-box"><div><strong>Transparency</strong><Badge variant="neutral">{message.live?'Firebase response':'Demo content'}</Badge></div><p>{message.provider}</p>{message.inputSources?.length?<div className="input-source-citations"><small>Source excerpts supplied by this user (PDF pages, not externally fact-checked):</small>{message.inputSources.map((citation,index)=><small key={index}>{citation}</small>)}</div>:<span>No verified book/page citation provided.</span>}</div>
        {!message.error&&<div className="answer-actions"><button onClick={()=>addNote(message.topic,message.text,message.provider)}><NotebookPen size={16}/> Save explanation</button><button onClick={()=>addCard({id:`generated-${Date.now()}`,question:message.prompt,answer:message.text,detail:message.example||message.provider,topic:message.topic})}><Layers3 size={16}/> Make flashcard</button><button onClick={()=>setPage('practice')}><Target size={16}/> Practice</button></div>}
      </div></div>)}</div>}
      {running&&<div className="tutor-running" role="status"><span className="loading-dots"/> {download===null?'Requesting a model response...':`Preparing local model: ${Math.round(download*100)}%`}</div>}
      <div className="composer"><textarea value={input} onChange={event=>setInput(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();void ask()}}} placeholder="Ask a chemistry question..." aria-label="Chemistry question" rows={2}/><div><span><BrainCircuit size={14}/>{firebaseConfigured?`Firebase · ${preference}`:'Curated samples · Demo mode'}</span><button disabled={!input.trim()||running} onClick={()=>void ask()} aria-label="Send question"><ChevronRight size={19}/></button></div></div>
      {last&&!last.error&&<div className="tutor-inline-actions"><button onClick={saveLast}>Save last response</button><button onClick={createLastCard}>Review as flashcard</button></div>}
    </section>
    <aside className="tutor-references"><div className="panel-title"><div><p className="eyebrow">Source transparency</p><h3>Reference status</h3></div><BookMarked size={18}/></div>
      <div className="reference-card"><span><BookOpen size={18}/></span><div><Badge variant="neutral">Original demo</Badge><strong>Chemical bonding</strong><p>No copyrighted textbook excerpts included.</p></div></div>
      <div className="reference-card"><span><Atom size={18}/></span><div><Badge variant="neutral">Related concept</Badge><strong>Molecular polarity</strong><p>Explore in Chemistry Explorer</p></div></div>
      <button className="engine-mini" onClick={()=>setPage('hybrid')}><div><span className="status-dot"/><div><strong>{firebaseConfigured?'Firebase configured':'Demo mode'}</strong><small>Open inference settings</small></div></div><ChevronRight size={17}/></button>
    </aside>
  </main>;
}

type Scenario = "local-online" | "local-offline" | "cloud-online" | "none";
function HybridPage({ offline, setOffline, preference, setPreference }: {
  offline:boolean; setOffline:(v:boolean)=>void;
  preference:InferencePreference; setPreference:(v:InferencePreference)=>void;
}) {
  const [scenario,setScenario] = useState<Scenario>('local-online');
  const [liveResult,setLiveResult] = useState('');
  const [liveProvider,setLiveProvider] = useState('');
  const [liveError,setLiveError] = useState('');
  const [running,setRunning] = useState(false);
  const [progress,setProgress] = useState<number|null>(null);
  const runLive = async () => {
    if(!firebaseConfigured || running) return;
    setRunning(true);setLiveResult('');setLiveProvider('');setLiveError('');setProgress(null);
    try {
      const result = await runHybridInference('Explain in two sentences why H2O has polar covalent bonds.',preference,setProgress);
      setLiveResult(result.text); setLiveProvider(`${result.provider} · ${result.model}`);
    } catch(error) {setLiveError(error instanceof Error?error.message:String(error))}
    finally {setRunning(false)}
  };
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
          The cards below simulate routing for learning. Scroll to LIVE SDK VERIFICATION
          for real Firebase requests and verified cloud/on-device inference results.
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
              <h3>Scenario illustration (not live)</h3>
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
                {unavailable ? "Unavailable in scenario" : isLocal ? "Local · Simulated" : "Cloud · Simulated"}
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
            {(["Prefer on-device", "On-device only", "Prefer cloud", "Cloud only"] as InferencePreference[]).map((mode) => (
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
      <section className="live-hybrid-check" aria-label="Firebase live inference test">
        <div><Badge variant="gold">LIVE SDK VERIFICATION</Badge><h3>Verify the real inference provider</h3><p>{firebaseConfigured?'Firebase settings detected. Run this short request to see the provider reported by the SDK.':'No Firebase configuration detected. The scenario cards above are visual simulations, not actual AI responses.'}</p></div>
        <button className="primary-button" disabled={!firebaseConfigured||running} onClick={()=>void runLive()}><BrainCircuit size={17}/>{running?'Running on Firebase...':'Run real inference test'}</button>
        {preference === 'On-device only' && <p>On-device mode needs compatible Chrome Desktop (139+), Prompt API enabled, and local model download. This mode never claims cloud fallback as local success.</p>}
        {running&&<p role="status">{progress===null?'Preparing or requesting a response...':`Local model download: ${Math.round(progress*100)}%`}</p>}
        {liveResult&&<div className="live-result" role="status"><strong>Verified provider: {liveProvider}</strong><p>{liveResult}</p></div>}
        {liveError&&<div className="inline-alert" role="alert"><CircleHelp size={17}/>{liveError}</div>}
      </section>
    </main>
  );
}

function PracticePage({ setPage, onAnswer }: {setPage:(page:Page)=>void; onAnswer:(correct:boolean)=>void}) {
  const [index,setIndex] = useState(0);
  const [answer,setAnswer] = useState<number|null>(null);
  const [checked,setChecked] = useState(false);
  const [hint,setHint] = useState(false);
  const [ph,setPh] = useState(7);
  const [coeff,setCoeff] = useState<[number,number,number]>([1,1,1]);
  const [completed,setCompleted] = useState(0);
  const current = quizzes[index];
  const atomLeft = {H:coeff[0]*2,O:coeff[1]*2};
  const atomRight = {H:coeff[2]*2,O:coeff[2]};
  const equationCorrect = atomLeft.H===atomRight.H && atomLeft.O===atomRight.O;
  const validate = () => {if(answer===null||checked)return; setChecked(true);onAnswer(answer===current.correct);setCompleted(prev=>prev+1)};
  const next = () => {setIndex(prev=>(prev+1)%quizzes.length);setAnswer(null);setChecked(false);setHint(false)};
  const changeCoefficient = (i:number,delta:number) => setCoeff(prev=>prev.map((value,n)=>n===i?Math.max(1,Math.min(6,value+delta)):value) as [number,number,number]);
  return <main className="page standard-page">
    <section className="page-intro"><Badge variant="gold">Safe educational simulation</Badge><h2>Try it. Check it.<br/>Understand why.</h2><p>Interactive chemistry practice with real answer validation and conservation-of-atoms feedback. No unsafe laboratory procedures.</p></section>
    <div className="practice-layout"><article className="quiz-card">
      <div className="quiz-top"><div><p className="eyebrow">CHALLENGE {index+1} OF {quizzes.length}</p><h3>Balance the equation</h3></div><Badge>{completed} answers checked</Badge></div>
      <p className="quiz-question">{current.question}</p><div className="equation-large"><span>{current.equation}</span></div>
      <div className="answer-grid">{current.choices.map((choice,i)=><button key={choice} aria-pressed={answer===i} className={`${answer===i?'selected':''} ${checked&&i===current.correct?'correct':''} ${checked&&i===answer&&i!==current.correct?'incorrect':''}`} onClick={()=>{if(!checked)setAnswer(i)}}><span>{String.fromCharCode(65+i)}</span>{choice}{checked&&i===current.correct&&<Check size={18}/>}</button>)}</div>
      {hint&&!checked&&<div className="inline-hint"><Lightbulb size={17}/>{current.hint}</div>}
      {checked&&<div className={`feedback ${answer===current.correct?'':'feedback-wrong'}`} role="status">{answer===current.correct?<Check size={20}/>:<CircleHelp size={20}/>}<p><strong>{answer===current.correct?'Correct — well done!':'Not quite — review the atoms.'}</strong> {current.explanation}</p></div>}
      <div className="quiz-actions"><button className="secondary-button" onClick={()=>setHint(!hint)} disabled={checked}><Lightbulb size={16}/>{hint?'Hide hint':'Reveal hint'}</button>{!checked?<button className="primary-button" disabled={answer===null} onClick={validate}>Check answer <ChevronRight size={16}/></button>:<button className="primary-button" onClick={next}>Next challenge <ArrowRight size={16}/></button>}</div>
    </article>
    <aside className="lab-modules"><article className="ph-card"><div><span><FlaskConical size={19}/></span><Badge>Interactive</Badge></div><h3>Explore the pH scale</h3><p>Adjust pH for a simplified aqueous-solution example at 25°C.</p><div className="ph-value"><strong>{ph}</strong><span>{ph<7?'Acidic':ph>7?'Basic':'Neutral'}</span></div>
      <label className="sr-only" htmlFor="ph-slider">pH value</label><input id="ph-slider" aria-label="pH scale" type="range" min="0" max="14" value={ph} onChange={event=>setPh(Number(event.target.value))}/><div className="range-labels"><span>0 · Acid</span><span>7 · Neutral</span><span>14 · Base</span></div><p className="ph-explanation">{ph<7?'Acidic solution: higher hydrogen-ion activity than neutral water.':ph>7?'Basic solution: lower hydrogen-ion activity than neutral water.':'Neutral pure water at 25°C is approximately pH 7.'}</p></article>
      <button className="module-link" onClick={()=>setPage('explorer')}><span><Atom size={21}/></span><div><strong>Explore chemical bonding</strong><p>Compare elements and molecular models.</p></div><ChevronRight size={18}/></button>
    </aside></div>
    <section className="coefficient-lab" aria-label="Interactive equation balancing laboratory">
      <div><p className="eyebrow">HANDS-ON LAB</p><h3>Balance it yourself</h3><p>Use + and − to change coefficients. The atom counts update immediately.</p></div>
      <div className="coefficient-equation">{['H₂','O₂','H₂O'].map((formula,i)=><div className="coefficient-term" key={formula}><div className="coefficient-stepper"><button onClick={()=>changeCoefficient(i,-1)} aria-label={`Decrease coefficient for ${formula}`} disabled={coeff[i]===1}>−</button><strong>{coeff[i]}</strong><button onClick={()=>changeCoefficient(i,1)} aria-label={`Increase coefficient for ${formula}`} disabled={coeff[i]===6}>+</button></div><b>{formula}</b>{i!==2&&<span>{i===0?'+':'→'}</span>}</div>)}</div>
      <div className="atom-count-grid"><div><strong>Reactants</strong><span>Hydrogen: {atomLeft.H} atoms</span><span>Oxygen: {atomLeft.O} atoms</span></div><div><strong>Products</strong><span>Hydrogen: {atomRight.H} atoms</span><span>Oxygen: {atomRight.O} atoms</span></div></div>
      <div className={`balance-result ${equationCorrect?'is-balanced':''}`} aria-live="polite">{equationCorrect?<Check size={18}/>:<Target size={18}/>} {equationCorrect?'Balanced! Both sides conserve H and O atoms.':'Not balanced yet. Match both hydrogen and oxygen atom counts.'}</div>
      <button className="text-button" onClick={()=>setCoeff([1,1,1])}><RotateCcw size={16}/> Reset coefficients</button>
    </section>
  </main>;
}

function ExplorerPage({ setPage, addNote, askAbout }: {setPage:(page:Page)=>void; addNote:(title:string,content:string,source:string)=>void; askAbout:(prompt:string)=>void}) {
  const [element,setElement] = useState('O');
  const [compound,setCompound] = useState<'water'|'carbon'|'salt'>('water');
  const active = elements.find(e=>e.symbol===element)!;
  const compounds = {
    water:{name:'Water',formula:'H₂O',mass:'18.015 g/mol',bond:'Polar covalent',note:'Bent H₂O molecule, bond angle approximately 104.5°.'},
    carbon:{name:'Carbon dioxide',formula:'CO₂',mass:'44.01 g/mol',bond:'Covalent',note:'Linear O=C=O molecule; individual polar bonds cancel overall.'},
    salt:{name:'Sodium chloride',formula:'NaCl',mass:'58.44 g/mol',bond:'Ionic lattice',note:'NaCl is best represented as an extended ionic lattice, not a discrete molecule.'},
  };
  const selected=compounds[compound];
  return <main className="page standard-page"><section className="page-intro"><Badge variant="gold">Visual learning tool</Badge><h2>See the structure<br/>behind the substance.</h2><p>Interactive 2D learning models, not 3D simulations or experimentally validated calculations.</p></section>
    <div className="explorer-layout"><article className="molecule-stage">
      <div className="stage-top"><div><p className="eyebrow">SELECTED COMPOUND</p><h3>{selected.name} · {selected.formula}</h3></div><button className="secondary-button" onClick={()=>addNote(selected.name,`${selected.note} Bond type: ${selected.bond}. Molar mass: ${selected.mass}.`,'El-Kīmiyā educational reference · approximate values')}><Bookmark size={16}/> Save molecule</button></div>
      <div className="compound-tabs" role="group" aria-label="Choose compound">{(Object.keys(compounds) as (keyof typeof compounds)[]).map(id=><button key={id} onClick={()=>setCompound(id)} className={compound===id?'active':''} aria-pressed={compound===id}>{compounds[id].name}</button>)}</div>
      <div className="water-model compound-model">{compound==='water'?<><span className="water-o">O</span><i className="water-bond left"/><i className="water-bond right"/><span className="water-h left">H</span><span className="water-h right">H</span></>:<div className="compound-formula-illustration" role="img" aria-label={selected.note}>{compound==='carbon'?<><span>O</span><i className="double-bond">═</i><span>C</span><i className="double-bond">═</i><span>O</span></>:<><span>Na⁺</span><i>⋯</i><span>Cl⁻</span></>}</div>}<div className="rotate-hint"><BookOpen size={15}/> 2D concept illustration · not to scale</div></div>
      <p className="compound-note">{selected.note}</p><div className="compound-stats"><div><span>Formula</span><strong>{selected.formula}</strong></div><div><span>Molar mass</span><strong>{selected.mass}</strong></div><div><span>Bond type</span><strong>{selected.bond}</strong></div></div>
    </article><aside className="element-panel"><div className="panel-title"><div><p className="eyebrow">MINI PERIODIC EXPLORER</p><h3>Select an element</h3></div><Atom size={18}/></div>
      <div className="elements-grid">{elements.map(entry=><button key={entry.symbol} className={element===entry.symbol?'active':''} aria-pressed={element===entry.symbol} onClick={()=>setElement(entry.symbol)}><small>{entry.number}</small><strong>{entry.symbol}</strong></button>)}</div>
      <div className="element-detail"><span className="element-big">{active.symbol}</span><div><Badge>{active.kind}</Badge><h3>{active.name}</h3><p>Atomic number {active.number} · Atomic mass ≈ {active.mass} u</p><p>{active.fact}</p></div></div>
      <button className="primary-button" onClick={()=>askAbout(`Explain ${active.name} (${active.symbol}) and its role in ${selected.name}.`)}><BrainCircuit size={16}/> Ask tutor about this</button>
    </aside></div>
  </main>;
}

function FlashcardsPage({ cards, onReview }: {cards:StudyCard[]; onReview:()=>void}) {
  const [flipped,setFlipped] = useState(false);
  const [index,setIndex] = useState(0);
  const [ratings,setRatings] = useStoredState<Record<string,'again'|'difficult'|'easy'>>('elk.cardRatings',{});
  const [sessionRatings,setSessionRatings] = useState<Record<string,string>>({});
  const complete=index>=cards.length;
  const current=cards[index];
  const rate=(rating:'again'|'difficult'|'easy')=>{
    if(!flipped||!current)return;
    setRatings(prev=>({...prev,[current.id]:rating}));setSessionRatings(prev=>({...prev,[current.id]:rating}));onReview();setFlipped(false);setIndex(prev=>prev+1);
  };
  return <main className="page flashcard-page"><section className="page-intro centered"><Badge variant="gold">Active recall · {cards.length} cards</Badge><h2>Keep ideas close.<br/>Remember them longer.</h2><p>Flip each card, then choose how confidently you remembered. Ratings are saved locally.</p></section>
    <div className="deck-progress"><span>{Math.min(index+1,cards.length)} of {cards.length}</span><Progress value={cards.length?(Math.min(index,cards.length)/cards.length)*100:0}/><span>{Math.max(cards.length-index,0)} remaining</span></div>
    {complete?<div className="deck-finished"><Check size={34}/><h3>Review complete</h3><p>You reviewed {Object.keys(sessionRatings).length} cards this session. Last ratings are stored in this browser.</p><button className="primary-button" onClick={()=>{setIndex(0);setFlipped(false);setSessionRatings({})}}><RotateCcw size={17}/> Review deck again</button></div>
    :<><button className={`flashcard ${flipped?'flipped':''}`} onClick={()=>setFlipped(!flipped)} aria-label={flipped?'Show flashcard question':'Reveal flashcard answer'} aria-pressed={flipped}>
      <div className="flashcard-face front"><Badge>{current.topic}</Badge><p className="eyebrow">{flipped?'QUESTION':'TAP TO REVEAL'}</p><h3>{current.question}</h3><span><RotateCcw size={17}/> Flip card</span></div>
      <div className="flashcard-face back"><Badge variant="gold">Answer</Badge><h3>{current.answer}</h3><p>{current.detail}</p><span><RotateCcw size={17}/> Show question</span></div>
    </button>
    <div className="card-rating"><button disabled={!flipped} onClick={()=>rate('again')}><RotateCcw size={17}/><span><strong>Review again</strong><small>Needs practice</small></span></button><button disabled={!flipped} onClick={()=>rate('difficult')}><CircleHelp size={17}/><span><strong>Difficult</strong><small>Review soon</small></span></button><button disabled={!flipped} onClick={()=>rate('easy')}><Check size={17}/><span><strong>Easy</strong><small>Remembered well</small></span></button></div><p className="rating-note">Reveal the answer before rating this card. Spaced repetition scheduling is not enabled in this demo.</p></>}
    <p className="saved-rating-count">{Object.keys(ratings).length} unique cards have a saved review rating.</p>
  </main>;
}

function ProgressPage({ stats, setPage }: { stats:StudyProgress; setPage:(page:Page)=>void }) {
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
      <div className="real-study-metrics"><div><span>Answered in this browser</span><strong>{stats.answered}</strong></div><div><span>Correctly answered</span><strong>{stats.correct}</strong></div><div><span>Flashcard reviews</span><strong>{stats.reviewed}</strong></div><div><span>Quiz accuracy</span><strong>{stats.answered?`${Math.round(stats.correct/stats.answered*100)}%`:'—'}</strong></div></div>
      <p className="demo-disclaimer">The metrics above are based on saved actions in this browser. The weekly chart and topic confidence panels below contain sample data only.</p>
      <div className="analytics-grid">
        <article className="panel consistency">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Last 7 days</p>
              <h3>Learning consistency</h3>
            </div>
            <strong>Demo weekly chart</strong>
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
              <h3>Suggested focus · Demo</h3>
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
          <button className="primary-button" onClick={()=>setPage("practice")}>
            Start recommended review <ChevronRight size={16} />
          </button>
        </article>
      </div>
    </main>
  );
}

function SettingsPage({dark,setDark,setPage,reducedMotion,setReducedMotion}: {dark:boolean;setDark:(v:boolean)=>void;setPage:(page:Page)=>void;reducedMotion:boolean;setReducedMotion:(v:boolean)=>void}) {
  const [language,setLanguage] = useStoredState<'English'|'Bahasa Indonesia'>('elk.language','English');
  const [panel,setPanel] = useState<'appearance'|'language'|'privacy'|'accessibility'>('appearance');
  const [largeText,setLargeText] = useStoredState('elk.reader.large',false);
  const menu:{name:string;onClick:()=>void;active:boolean}[] = [
    {name:'Profile',onClick:()=>setPage('profile'),active:false},
    {name:'Language & region',onClick:()=>setPanel('language'),active:panel==='language'},
    {name:'Appearance',onClick:()=>setPanel('appearance'),active:panel==='appearance'},
    {name:'AI inference',onClick:()=>setPage('hybrid'),active:false},
    {name:'Offline materials',onClick:()=>setPage('library'),active:false},
    {name:'Privacy & data',onClick:()=>setPanel('privacy'),active:panel==='privacy'},
    {name:'Accessibility',onClick:()=>setPanel('accessibility'),active:panel==='accessibility'},
  ];
  const resetLocalData=()=>{if(!window.confirm('Delete all locally saved El-Kīmiyā notes, uploads, flashcards, ratings, and quiz history from this browser? This cannot be undone.'))return;
    ['elk.notes','elk.uploadedTexts','elk.customCards','elk.cardRatings','elk.stats','elk.reader.bookmarked'].forEach(key=>localStorage.removeItem(key));window.location.reload();};
  return <main className="page settings-page"><div className="settings-nav"><p className="eyebrow">Preferences</p>{menu.map(item=><button key={item.name} onClick={item.onClick} className={item.active?'active':''} aria-current={item.active?'page':undefined}>{item.name}<ChevronRight size={16}/></button>)}</div>
    <section className="settings-content"><Badge variant="gold">Personal workspace</Badge><h2>{panel==='appearance'?'Appearance':panel==='language'?'Learning & language':panel==='privacy'?'Privacy & local data':'Accessibility'}</h2>
      {panel==='appearance'&&<><p>Set your reading environment. The approved logo geometry never changes.</p><div className="settings-section"><h3>Color theme</h3><div className="theme-options"><button className={!dark?'active':''} onClick={()=>setDark(false)} aria-pressed={!dark}><span className="theme-preview light"><i/><b/></span><strong>Light</strong><small>Warm, focused surfaces</small></button><button className={dark?'active':''} onClick={()=>setDark(true)} aria-pressed={dark}><span className="theme-preview dark"><i/><b/></span><strong>Deep navy</strong><small>Lower-light learning</small></button></div></div></>}
      {panel==='language'&&<><p>Set a study-language preference. Only English interface copy is included in this prototype; this setting does not translate the entire app yet.</p><div className="settings-section"><h3>Preferred language</h3><div className="language-options">{(['English','Bahasa Indonesia'] as const).map(item=><button key={item} onClick={()=>setLanguage(item)} className={language===item?'active':''} aria-pressed={language===item}><span><strong>{item}</strong><small>{item==='English'?'Original demo content':'Preference saved for future localization'}</small></span>{language===item&&<Check size={18}/>}</button>)}</div><p className="setting-note">Arabic terminology may appear in lessons. Arabic AI support is not guaranteed.</p></div></>}
      {panel==='privacy'&&<><p>This version runs as a guest. Learning notes, imported text, and review history use browser localStorage. Photos remain in memory for the current session; they are not uploaded by the scanner.</p><div className="settings-section"><h3>Your control</h3><p>When Firebase AI Logic is configured, prompts can be processed locally or in the cloud according to model availability and inference preference. Check the verified provider label after each request.</p><button className="secondary-button" onClick={()=>setPage('hybrid')}>Inspect AI inference settings <ChevronRight size={16}/></button><hr/><button className="reset-data-button" onClick={resetLocalData}><X size={16}/> Delete all locally saved learning data</button></div></>}
      {panel==='accessibility'&&<><p>Comfortable reading controls and motion preferences are saved locally.</p><div className="settings-section"><h3>Reading text</h3><button className="setting-switch" onClick={()=>setLargeText(!largeText)} aria-pressed={largeText}><span>Large textbook text</span><strong>{largeText?'Enabled':'Disabled'}</strong></button><h3>Motion</h3><button className="setting-switch" onClick={()=>setReducedMotion(!reducedMotion)} aria-pressed={reducedMotion}><span>Reduce interface animation</span><strong>{reducedMotion?'Enabled':'Disabled'}</strong></button><p className="setting-note">System reduced-motion preference is always respected.</p></div></>}
      <div className="settings-brand-panel"><BrandMark size="md" showTagline/><div><Badge>About El-Kīmiyā</Badge><p>Hybrid AI Chemistry Learning Platform · Web + responsive mobile prototype · Guest demonstration.</p></div></div>
    </section>
  </main>;
}

function ScanPage({ setPage, addNote, addCard, notify, askAbout }: {
  setPage:(page:Page)=>void;
  addNote:(title:string,content:string,source:string)=>void;
  addCard:(card:StudyCard)=>void;
  notify:(message:string)=>void;
  askAbout:(prompt:string)=>void;
}) {
  const [step,setStep] = useState<'camera'|'review'|'result'>('camera');
  const [preview,setPreview] = useState<string|null>(null);
  const [text,setText] = useState('');
  const [error,setError] = useState('');
  const sample='A covalent bond forms when atoms share one or more electron pairs. These electrons are attracted by both atomic nuclei.';
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
  const fileChange = (file?:File) => {
    if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setError('Choose a PNG, JPEG or WebP image.');return}
    if(file.size>6*1024*1024){setError('Image is larger than 6MB. Please choose a smaller file.');return}
    setError('');setPreview(URL.createObjectURL(file));setText('');setStep('review');
  };
  const useSample=()=>{setText(sample);setError('');setStep('review');};
  const save=()=>addNote('Captured study passage',text,'Personal text entered/reviewed in scanner · Not OCR verified');
  const makeCard=()=>{addCard({id:`scan-${Date.now()}`,topic:'Personal scan',question:'Explain the concept in this scanned passage.',answer:text,detail:'Based on manually reviewed text, not verified source text.'});notify('Flashcard created from reviewed passage')};
  return <main className="scan-page v2-scan">
    {step==='camera'&&<div className="camera-view"><div className="scan-header"><button className="icon-button" onClick={()=>setPage('dashboard')} aria-label="Close scanner"><X/></button><div><BrandMark compact inverted size="sm"/><strong>Capture learning material</strong><small>Camera/gallery upload — no OCR running</small></div></div>
      <div className="scan-frame"><i/><i/><i/><i/><div className="sample-page"><small>PERSONAL LEARNING WORKSPACE</small><h3>From a page<br/>to understanding.</h3><p>Take a photo or upload a page. Then review and enter the passage you want to study.</p><p className="demo-disclaimer">No image recognition or text extraction is claimed in this prototype.</p></div></div>
      <p className="scan-hint">Your photograph stays in this browser session; it is not uploaded to a server by this feature.</p>
      <div className="camera-actions"><label className="scan-upload-button"><Upload size={21}/><small>Gallery<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>fileChange(e.target.files?.[0])}/></small></label>
        <label className="capture" title="Use camera"><Camera size={24}/><input type="file" accept="image/*" capture="environment" onChange={e=>fileChange(e.target.files?.[0])}/></label>
        <button onClick={useSample}><BookOpen size={20}/><small>Try demo</small></button></div>{error&&<p role="alert" className="inline-alert">{error}</p>}
    </div>}
    {step==='review'&&<div className="scan-review"><div className="scan-review-head"><button className="icon-button" onClick={()=>setStep('camera')} aria-label="Back to scanner"><ChevronLeft/></button><div><BrandMark compact size="sm"/><strong>Review the passage</strong><small>Manual transcription — OCR not available</small></div><Badge>Private</Badge></div>
      {preview&&<div className="scan-image-preview"><img src={preview} alt="Your selected page photographed for manual transcription"/></div>}
      <div className="captured-page"><small>{preview?'SELECTED IMAGE':'SAMPLE PASSAGE · DEMO'}</small><h2>Text to study</h2><label htmlFor="scan-text">Type or correct the passage from the photograph</label><textarea id="scan-text" rows={7} value={text} placeholder="Enter the paragraph or chemistry question from your page..." onChange={e=>setText(e.target.value)} maxLength={4000}/><p>{text.length}/4000 characters · Source unverified until you inspect it.</p></div>
      <div className="scan-bottom"><p><CircleHelp size={16}/> This is not automatic OCR. Please check every word.</p><button className="primary-button" disabled={!text.trim()} onClick={()=>setStep('result')}>Continue to study guide <ChevronRight size={16}/></button></div>
    </div>}
    {step==='result'&&<div className="scan-result"><div className="scan-review-head"><button className="icon-button" onClick={()=>setStep('review')} aria-label="Back to edit"><ChevronLeft/></button><div><BrandMark compact size="sm"/><strong>Study the passage</strong><small>Reviewed text · Manual input</small></div><Badge>Local</Badge></div>
      <div className="scan-answer-orb"><BookOpen/></div><Badge variant="gold">Source-grounded note</Badge><h2>Read, reflect,<br/>remember.</h2><p className="scan-quoted-passage">{text}</p><p>This view preserves exactly the passage you reviewed. It does not invent an AI explanation. You can save it, create a review card, or open the AI tutor separately.</p>
      <div className="source-box"><div><strong>Provenance</strong><Badge variant="neutral">Manual review</Badge></div><p>{preview?'Your selected image':'Original demo sample'}</p><span>No verified book title, chapter or page metadata.</span></div>
      <div className="mobile-action-grid"><button onClick={save}><NotebookPen/> Save note</button><button onClick={makeCard}><Layers3/> Create flashcard</button></div><button className="primary-button full" onClick={()=>askAbout(`Please explain this chemistry passage; distinguish facts from any unsupported claims:
${text.slice(0,1500)}`)}>Review question in chemistry tutor <ChevronRight/></button>
    </div>}
  </main>;
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

function SimplePage({ type, setPage, notes, deleteNote, notify }: {
  type:'notes'|'profile';setPage:(page:Page)=>void;notes:SavedNote[];deleteNote:(id:string)=>void;notify:(msg:string)=>void;
}) {
  const [query,setQuery] = useState('');
  const filtered=notes.filter(note=>`${note.title} ${note.content} ${note.source}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="page standard-page"><section className="page-intro"><Badge variant="gold">{type==='notes'?'Personal knowledge':'Your account'}</Badge><h2>{type==='notes'?'Your saved ideas,\nkept close.':'Your learning space.'}</h2><p>{type==='notes'?'These notes are stored in this browser, not in a cloud account.':'This version is a guest prototype. Authentication is not enabled.'}</p></section>
    {type==='notes'?<><div className="notes-toolbar"><label><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search saved notes" aria-label="Search saved notes"/></label><span>{filtered.length} saved entries</span></div>
      {filtered.length?<div className="notes-grid">{filtered.map(note=><article className="saved-note-card" key={note.id}><div><Badge variant="neutral">{new Date(note.createdAt).toLocaleDateString()}</Badge><button className="icon-button" title="Delete note" aria-label={`Delete ${note.title}`} onClick={()=>deleteNote(note.id)}><X size={16}/></button></div><h3>{note.title}</h3><p>{note.content}</p><small>{note.source}</small><button className="text-button" onClick={()=>{void navigator.clipboard?.writeText(note.content).then(()=>notify('Note copied')).catch(()=>notify('Copy unavailable; select the text instead'))}}><FileText size={15}/> Copy note</button></article>)}</div>:<div className="empty-state"><span><NotebookPen/></span><h3>{notes.length?'No matching notes':'No notes saved yet'}</h3><p>{notes.length?'Try a different search.':'Open a lesson, select a passage, and save a real note to this browser.'}</p><button className="primary-button" onClick={()=>setPage('reader')}>Open textbook <ChevronRight size={16}/></button></div>}
    </>:<div className="empty-state"><span><User/></span><h3>Guest scholar</h3><p>Local notes, learning review state and quiz statistics are stored on this device. This is not a signed-in account.</p><button className="primary-button" onClick={()=>setPage('settings')}>Manage preferences <ChevronRight size={16}/></button></div>}
  </main>;
}

export default function App() {
  const validPages: Page[] = ['landing','dashboard','library','faith','reader','tutor','hybrid','practice','explorer','flashcards','progress','notes','settings','scan','profile'];
  const hashPage = () => {const value=window.location.hash.slice(1) as Page;return validPages.includes(value)?value:'landing'};
  const [page,setCurrentPage] = useState<Page>(hashPage);
  const [collapsed,setCollapsed] = useStoredState('elk.sidebar.collapsed',false);
  const [dark,setDark] = useStoredState('elk.dark',false);
  const [reducedMotion,setReducedMotion] = useStoredState('elk.reduceMotion',false);
  const [offline,setOffline] = useState(false); // Only a UI scenario toggle, not actual network control.
  const [preference,setPreference] = useStoredState<InferencePreference>('elk.inferencePreference','Prefer on-device');
  const [notes,setNotes] = useStoredState<SavedNote[]>('elk.notes',[]);
  const [customCards,setCustomCards] = useStoredState<StudyCard[]>('elk.customCards',[]);
  const [statistics,setStatistics] = useStoredState<StudyProgress>('elk.stats',{answered:0,correct:0,reviewed:0});
  const [toast,setToast] = useState('');
  const [initialPrompt,setInitialPrompt] = useState('');
  const setPage=(next:Page) => {if(next!==page){history.pushState({},'',`#${next}`);setCurrentPage(next);window.scrollTo({top:0,behavior:'auto'})}};
  const notify=(message:string)=>setToast(message);
  useEffect(()=>{const handler=()=>setCurrentPage(hashPage());window.addEventListener('popstate',handler);window.addEventListener('hashchange',handler);return()=>{window.removeEventListener('popstate',handler);window.removeEventListener('hashchange',handler)}},[]);
  useEffect(()=>{if(!toast)return;const timer=window.setTimeout(()=>setToast(''),3500);return()=>window.clearTimeout(timer)},[toast]);
  useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='/'&&!(event.target instanceof HTMLInputElement)&&!(event.target instanceof HTMLTextAreaElement)){event.preventDefault();document.querySelector<HTMLInputElement>('.global-search input')?.focus()}if(event.key==='Escape')setToast('')};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler)},[]);
  const addNote=(title:string,content:string,source:string)=>{setNotes(prev=>[createNote(title,content,source),...prev]);notify('Saved locally — open Saved Notes to view');};
  const addCard=(card:StudyCard)=>{setCustomCards(prev=>[...prev,card]);notify('Flashcard saved to your review deck');};
  const deleteNote=(id:string)=>{setNotes(prev=>prev.filter(n=>n.id!==id));notify('Note deleted')};
  const askAbout=(prompt:string)=>{setInitialPrompt(prompt);setPage('tutor')};
  const onAnswer=(correct:boolean)=>setStatistics(prev=>({ ...prev,answered:prev.answered+1,correct:prev.correct+(correct?1:0) }));
  const content=(() => {
    if(page==='landing')return <LandingPage enterApp={()=>setPage('dashboard')} openFaith={()=>setPage('faith')}/>;
    if(page==='dashboard')return <Dashboard setPage={setPage}/>;
    if(page==='library')return <LibraryPage setPage={setPage} addNote={addNote} notify={notify} askAbout={askAbout}/>;
    if(page==='faith')return <ChemistryFaithPage onBack={()=>setPage('dashboard')} onOpenLibrary={()=>setPage('library')} onAskTutor={askAbout} onSaveNote={addNote}/>;
    if(page==='reader')return <ReaderPage setPage={setPage} addNote={addNote} addCard={addCard} dark={dark} notify={notify}/>;
    if(page==='tutor')return <TutorPage setPage={setPage} addNote={addNote} addCard={addCard} preference={preference} initialPrompt={initialPrompt} clearInitialPrompt={()=>setInitialPrompt('')}/>;
    if(page==='hybrid')return <HybridPage offline={offline} setOffline={setOffline} preference={preference} setPreference={setPreference}/>;
    if(page==='practice')return <PracticePage setPage={setPage} onAnswer={onAnswer}/>;
    if(page==='explorer')return <ExplorerPage setPage={setPage} addNote={addNote} askAbout={askAbout}/>;
    if(page==='flashcards')return <FlashcardsPage cards={[...starterCards,...customCards]} onReview={()=>setStatistics(prev=>({...prev,reviewed:prev.reviewed+1}))}/>;
    if(page==='progress')return <ProgressPage stats={statistics} setPage={setPage}/>;
    if(page==='settings')return <SettingsPage dark={dark} setDark={setDark} setPage={setPage} reducedMotion={reducedMotion} setReducedMotion={setReducedMotion}/>;
    if(page==='scan')return <ScanPage setPage={setPage} addNote={addNote} addCard={addCard} notify={notify} askAbout={askAbout}/>;
    if(page==='notes'||page==='profile')return <SimplePage type={page} setPage={setPage} notes={notes} deleteNote={deleteNote} notify={notify}/>;
    return <Dashboard setPage={setPage}/>;
  })();
  if(page==='landing')return <div className={dark?'app dark':'app'} data-reduce-motion={reducedMotion}>{content}</div>;
  return <div className={dark?'app dark':'app'} data-reduce-motion={reducedMotion}>
    <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed}/>
    <div className="app-shell">{page!=='reader'&&page!=='scan'&&<Header page={page} setPage={setPage} dark={dark} setDark={setDark} offline={offline}/>}<div key={page} className="page-entrance">{content}</div></div>
    <button className="mobile-tutor-fab" onClick={()=>setPage('tutor')} aria-label="Open chemistry tutor"><BrainCircuit size={19}/></button>
    {page!=='scan'&&<MobileBottomNav page={page} setPage={setPage}/>}
    {toast&&<div className="toast" role="status"><Check size={17}/><span>{toast}</span><button onClick={()=>setToast('')} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </div>;
}
