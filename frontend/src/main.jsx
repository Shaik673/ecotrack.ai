import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle, ArrowRight, Award, Bike, Bot, CalendarDays, CheckCircle2, CloudSun,
  Compass, Crown, Droplets, Dumbbell, Eye, EyeOff, Flag, Flame, Globe2, Heart,
  Home as HomeIcon, Image as ImageIcon, Instagram, Leaf, Lightbulb, Linkedin,
  LogOut, Mail, MapPinned, MessageCircle, MessageSquare, Orbit, Radio, Recycle,
  Reply, SendHorizonal,
  ShieldCheck, Sparkles, Sprout, Target, Trophy, Upload, UserRound, Users,
  Waves, Zap
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import * as THREE from 'three';
import './styles.css';

const API_URL = 'http://127.0.0.1:8006';
const countries = {
  India: ['Andhra Pradesh', 'Delhi', 'Gujarat', 'Karnataka', 'Kerala', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana'],
  'United States': ['California', 'Florida', 'Georgia', 'Illinois', 'Massachusetts', 'New York', 'North Carolina', 'Texas', 'Virginia', 'Washington'],
  Canada: ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Nova Scotia', 'Ontario', 'Quebec', 'Saskatchewan', 'Yukon', 'Nunavut'],
  'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Greater London', 'Manchester', 'Birmingham', 'Liverpool', 'Bristol', 'Leeds'],
  Australia: ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'ACT', 'Northern Territory', 'Perth', 'Adelaide'],
  Germany: ['Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Saarland', 'Saxony', 'Thuringia'],
  Japan: ['Tokyo', 'Osaka', 'Kyoto', 'Hokkaido', 'Fukuoka', 'Aichi', 'Kanagawa', 'Hyogo', 'Okinawa', 'Saitama'],
  Brazil: ['Sao Paulo', 'Rio de Janeiro', 'Bahia', 'Parana', 'Ceara', 'Goias', 'Amazonas', 'Pernambuco', 'Minas Gerais', 'Santa Catarina'],
  France: ['Ile-de-France', 'Normandy', 'Brittany', 'Occitanie', 'Provence', 'Corsica', 'Grand Est', 'Burgundy', 'Centre-Val de Loire', 'Nouvelle-Aquitaine'],
  Singapore: ['Central', 'East', 'North', 'North-East', 'West', 'Tampines', 'Jurong East', 'Woodlands', 'Queenstown', 'Toa Payoh']
};
const palette = ['#61f2a5', '#58c7ff', '#ffdc5e', '#ff7ab6'];
const navPages = ['home', 'dashboard', 'calculator', 'planet', 'challenges', 'community', 'assistant'];
const suggestedQuestions = [
  'How can I reduce my transport footprint this week?',
  'Explain my latest carbon result in simple terms.',
  'Give me a 7 day eco challenge plan.',
  'What habits lower electricity emissions fastest?',
  'How can my community reduce waste together?'
];

function cls(...xs) { return xs.filter(Boolean).join(' '); }
async function api(path, options = {}) {
  let response;
  try { response = await fetch(`${API_URL}${path}`, options); }
  catch { throw new Error('Cannot connect to EcoTrack API. Start the FastAPI backend on http://127.0.0.1:8006.'); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || 'EcoTrack request failed.');
  return data;
}

function useSession() {
  const [user, setUserState] = useState(() => JSON.parse(localStorage.getItem('ecotrack:user') || 'null'));
  const setUser = (next) => {
    setUserState(next);
    if (next) localStorage.setItem('ecotrack:user', JSON.stringify(next));
    else localStorage.removeItem('ecotrack:user');
  };
  return [user, setUser];
}

function App() {
  const [user, setUser] = useSession();
  const [page, setPage] = useState(user ? (user.profileComplete ? 'home' : 'profile') : 'landing');
  useEffect(() => { if (!user && !['landing', 'signin', 'signup'].includes(page)) setPage('landing'); }, [user, page]);
  const authed = user?.profileComplete;
  return (
    <div className="app">
      {page !== 'landing' && <Nav page={page} setPage={setPage} user={user} setUser={setUser} />}
      {page === 'landing' && <Landing setPage={setPage} />}
      {page === 'signin' && <Auth mode="signin" setPage={setPage} setUser={setUser} />}
      {page === 'signup' && <Auth mode="signup" setPage={setPage} setUser={setUser} />}
      {page === 'profile' && <Profile user={user} setUser={setUser} setPage={setPage} />}
      {authed && page === 'home' && <HomePage user={user} setPage={setPage} />}
      {authed && page === 'dashboard' && <Dashboard user={user} setPage={setPage} />}
      {authed && page === 'calculator' && <Calculator user={user} />}
      {authed && page === 'planet' && <Planet user={user} />}
      {authed && page === 'challenges' && <Challenges user={user} setPage={setPage} />}
      {authed && page === 'community' && <CommunityHub user={user} />}
      {authed && page === 'assistant' && <Assistant user={user} />}
      {authed && page !== 'assistant' && <EcoAIWidget user={user} />}
      {page !== 'landing' && <Footer setPage={setPage} />}
    </div>
  );
}

function Landing({ setPage }) {
  const guide = [
    ['Carbon Calculator', 'Answer guided lifestyle questions. EcoTrack calculates category emissions, saves them, and turns the result into AI insights.', Zap],
    ['Dashboard', 'Saved calculator runs become trend charts, category breakdowns, recommendations, and progress signals.', Orbit],
    ['Planet Intelligence', 'Explore a live-feeling globe with environmental overlays, hotspots, activity arcs, and forecast cards.', Globe2],
    ['Eco Challenges', 'Join daily and weekly missions, watch progress bars move, earn XP, and build repeatable green habits.', Trophy],
    ['Community Hub', 'Post updates, share images, like wins, reply to threads, and learn from topic-based community discussions.', Users],
    ['Eco AI', 'Ask any sustainability question. The backend routes your prompt to the Groq API and returns practical guidance.', Bot],
  ];
  const previews = [
    ['Dashboard pulse', 'Trend charts and recommendations update after each saved carbon calculation.', '84'],
    ['Planet scan', 'Glowing markers show emissions, AQI, heat, and energy activity across regions.', '4'],
    ['Community lift', 'Posts, likes, comments, replies, and live discussion threads keep action social.', 'Live'],
  ];
  const testimonials = [
    ['Aisha', 'EcoTrack made carbon tracking feel like a daily habit instead of homework.'],
    ['Noah', 'The challenges and community feed keep me coming back.'],
    ['Maya', 'Eco AI gives specific ideas instead of generic advice.'],
  ];
  return (
    <main className="landing">
      <div className="motion-grid" />
      <nav className="landing-nav">
        <button className="brand-mark" onClick={() => setPage('landing')}><Leaf /> EcoTrack</button>
        <div>
          <button onClick={() => setPage('signin')}>Sign in</button>
          <button className="primary small" onClick={() => setPage('signup')}>Start tracking</button>
        </div>
      </nav>
      <section className="landing-hero">
        <div className="hero-copy">
          <span className="chip"><Sparkles size={16} /> Live carbon intelligence</span>
          <h1>EcoTrack</h1>
          <p>Measure daily carbon choices, watch your footprint evolve, and get AI-powered climate actions that feel practical enough to repeat.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setPage('signup')}>Create account <ArrowRight size={18} /></button>
            <button className="ghost" onClick={() => setPage('signin')}>I already have one</button>
          </div>
        </div>
        <div className="orbital-card">
          <div className="carbon-ring"><span>CO2</span><strong>-32%</strong></div>
          <div className="metric-strip"><b>Transport</b><span>18.4 kg saved</span></div>
          <div className="metric-strip"><b>Energy</b><span>Solar-ready plan</span></div>
          <div className="metric-strip"><b>Diet</b><span>2 plant meals</span></div>
        </div>
      </section>
      <section className="landing-features">
        {[
          ['Carbon Calculator', 'Estimate travel, energy, diet, and shopping impact with saved results.', Zap],
          ['Dashboard Graphs', 'Dynamic trend, category, and recommendation visuals update after every calculation.', Orbit],
          ['Planet Intelligence', 'A smooth Three.js earth model paired with climate signals and live-style insights.', Globe2],
          ['AI Assistant', 'Groq-powered chat for tailored low-carbon actions and sustainability Q&A.', Bot],
        ].map(([title, text, Icon]) => <article key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}
      </section>
      <section className="landing-guide">
        <div className="section-title"><h2>Learning Guide</h2><p>Understand each EcoTrack feature before signing in, then use the full workspace after account creation.</p></div>
        <div className="guide-grid">{guide.map(([title, text, Icon]) => <article className="glass" key={title}><Icon /><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="landing-preview">
        <div className="section-title"><h2>Live Preview</h2><p>Motion snapshots of the main experience, from calculator results to community action.</p></div>
        <div className="preview-slider">{previews.map(([title, text, stat], index) => <article className="glass preview-slide" style={{ '--delay': `${index * .18}s` }} key={title}><span>{stat}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section className="landing-testimonials">
        <div className="section-title"><h2>What early users say</h2><p>Small climate actions become easier when the feedback loop is visible.</p></div>
        <div className="testimonial-track">{testimonials.map(([name, quote]) => <article className="glass" key={name}><div className="mini-avatar">{name[0]}</div><p>{quote}</p><strong>{name}</strong></article>)}</div>
      </section>
      <footer className="landing-footer"><b><Leaf /> EcoTrack</b><span>Copyright 2026 EcoTrack. All rights reserved.</span></footer>
    </main>
  );
}

function Auth({ mode, setPage, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Enter a valid email address.');
    if (isSignup && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) return setError('Password needs 8 characters, uppercase, lowercase, and a number.');
    setLoading(true);
    try {
      const data = await api(`/auth/${isSignup ? 'signup' : 'signin'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      setUser(data);
      setPage(data.profileComplete ? 'home' : 'profile');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return (
    <main className="auth-page">
      <form className="auth-panel" onSubmit={submit}>
        <span className="chip"><ShieldCheck size={16} /> Secure SQLite auth</span>
        <h1>{isSignup ? 'Create your EcoTrack account' : 'Welcome back'}</h1>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>
        <label>Password<div className="password-row"><input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 8 characters" /><button type="button" onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>
        {error && <p className="error">{error}</p>}
        <button className="primary full" disabled={loading}>{loading ? 'Please wait...' : isSignup ? 'Signup' : 'Signin'}</button>
        <button type="button" className="linkish" onClick={() => setPage(isSignup ? 'signin' : 'signup')}>{isSignup ? 'Already registered? Signin' : 'New here? Signup'}</button>
      </form>
    </main>
  );
}

function Profile({ user, setUser, setPage }) {
  const profile = user?.profile || {};
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    email: profile.email || user?.email || '',
    age: profile.age || '',
    country: profile.country || 'India',
    state: profile.state || 'Telangana',
    gender: profile.gender || 'Prefer not to say'
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    setError('');
    if (form.full_name.trim().length < 2) return setError('Full Name must be at least 2 characters.');
    if (+form.age < 13 || +form.age > 110) return setError('Age must be between 13 and 110.');
    const body = new FormData();
    Object.entries({ user_id: user.id, ...form }).forEach(([k, v]) => body.append(k, v));
    if (file) body.append('profile_pic', file);
    try { const data = await api('/profile', { method: 'POST', body }); setUser(data); setPage('home'); }
    catch (err) { setError(err.message); }
  }
  return (
    <main className="page-wrap">
      <form className="profile-grid glass" onSubmit={submit}>
        <section>
          <span className="chip"><UserRound size={16} /> Profile creation</span>
          <h1>{user?.profileComplete ? 'Edit your EcoTrack profile' : 'Personalize your climate dashboard'}</h1>
          <p>Your profile helps EcoTrack tune recommendations by region, age group, and lifestyle context.</p>
          <label className="upload-box">
            {profile.profile_pic && !file ? <img src={`${API_URL}${profile.profile_pic}`} alt="Current profile" /> : <Upload />}
            {file ? file.name : 'Upload profile pic'}
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} />
          </label>
        </section>
        <section className="form-grid">
          <label>Full Name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
          <label>Email<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>Age<input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} /></label>
          <label>Country<select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, state: countries[e.target.value][0] })}>{Object.keys(countries).map(c => <option key={c}>{c}</option>)}</select></label>
          <label>State<select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}>{countries[form.country].map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Gender<select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>{['Female', 'Male', 'Non-binary', 'Prefer not to say'].map(g => <option key={g}>{g}</option>)}</select></label>
          {error && <p className="error wide">{error}</p>}
          <button className="primary wide">Save profile <ArrowRight size={18} /></button>
        </section>
      </form>
    </main>
  );
}

function Nav({ page, setPage, user, setUser }) {
  return (
    <nav className="top-nav">
      <button className="brand-mark" onClick={() => setPage('home')}><Leaf /> EcoTrack</button>
      <div className="nav-links">
        {navPages.map(p => <button key={p} className={cls(page === p && 'active')} onClick={() => setPage(p)}>{p}</button>)}
      </div>
      <div className="nav-account">
        <button className="avatar" onClick={() => setPage('profile')} title="Edit profile">{user?.profile?.profile_pic ? <img src={`${API_URL}${user.profile.profile_pic}`} /> : <UserRound />}</button>
        <button className="logout-button" onClick={() => setUser(null)}><LogOut size={17} /> Logout</button>
      </div>
    </nav>
  );
}

function HomePage({ user, setPage }) {
  const featureCards = [
    ['Carbon Calculator', 'Step-by-step lifestyle inputs with saved footprint metrics and AI insight.', Zap, 'calculator'],
    ['Planet Intelligence', 'Rotating Earth, regional hotspots, forecasts, and climate signals.', Globe2, 'planet'],
    ['Eco Challenges', 'Daily missions, streaks, badges, and measurable habit goals.', Trophy, 'challenges'],
    ['Community Hub', 'Team progress, events, stories, and collaborative climate actions.', Users, 'community'],
  ];
  return (
    <main className="page-wrap">
      <section className="home-hero glass">
        <div>
          <span className="chip"><HomeIcon size={16} /> Home</span>
          <h1>Welcome back, {user.profile?.full_name || 'Eco member'}.</h1>
          <p>EcoTrack brings your calculator, dashboard, community, challenges, planet intelligence, and Eco AI assistant into one smooth climate command center.</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => setPage('calculator')}>Start carbon scan <ArrowRight size={18} /></button>
            <button className="ghost" onClick={() => setPage('planet')}>Open planet intelligence</button>
          </div>
        </div>
        <div className="home-orbit">
          <span>Live eco pulse</span>
          <strong>84</strong>
          <em>readiness score</em>
        </div>
      </section>
      <section className="feature-grid">
        {featureCards.map(([title, text, Icon, route]) => (
          <button key={title} className="feature-tile glass" onClick={() => setPage(route)}>
            <Icon /><h3>{title}</h3><p>{text}</p>
          </button>
        ))}
      </section>
      <section className="section-grid">
        <article className="glass info-panel"><h2>Today's eco operating system</h2><p><Bike /> Replace one short car trip.</p><p><Leaf /> Choose one plant-forward meal.</p><p><Zap /> Shift heavy electricity use to off-peak hours.</p></article>
        <article className="glass info-panel"><h2>Progress loops</h2><p><Target /> Calculator results feed your dashboard.</p><p><Award /> Challenges convert habits into streaks.</p><p><MessageCircle /> Eco AI explains what to do next.</p></article>
      </section>
    </main>
  );
}

function Dashboard({ user, setPage }) {
  const [data, setData] = useState({ history: [], trend: [], breakdown: [] });
  const [recs, setRecs] = useState([]);
  useEffect(() => { api(`/dashboard/${user.id}`).then(setData); api(`/recommendations/${user.id}`).then(r => setRecs(r.items)); }, [user.id]);
  const latest = data.latest;
  return (
    <main className="page-wrap">
      <section className="dashboard-hero glass">
        <div><span className="chip"><CloudSun size={16} /> Dashboard</span><h1>{user.profile?.full_name || 'Eco member'}, your planet signals are ready.</h1><p>Saved carbon calculations flow into this dashboard with live trend charts, category visualizations, and AI recommendations.</p><button className="primary" onClick={() => setPage('calculator')}>Calculate footprint <ArrowRight size={18} /></button></div>
        <div className="hero-score"><span>Latest footprint</span><strong>{latest ? latest.total : '0'} kg</strong><em>{latest ? latest.category : 'No run yet'}</em></div>
      </section>
      <section className="cards-3">
        <Metric title="Calculations" value={data.history.length} icon={CheckCircle2} />
        <Metric title="Latest status" value={latest?.category || 'Pending'} icon={Sprout} />
        <Metric title="Top action" value={recs[0] || 'Run calculator'} icon={Compass} />
      </section>
      <section className="analytics-grid">
        <ChartCard title="Footprint trend"><ResponsiveContainer><AreaChart data={data.trend}><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#61f2a5" stopOpacity=".8"/><stop offset="1" stopColor="#61f2a5" stopOpacity=".08"/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" /><XAxis dataKey="date" stroke="#a9b8c7" /><YAxis stroke="#a9b8c7" /><Tooltip /><Area dataKey="total" stroke="#61f2a5" fill="url(#g)" /></AreaChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Carbon breakdown"><ResponsiveContainer><PieChart><Pie data={data.breakdown} dataKey="value" outerRadius={105}>{data.breakdown.map((_, i) => <Cell key={i} fill={palette[i]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></ChartCard>
        <ChartCard title="Saved calculations"><ResponsiveContainer><BarChart data={data.history.slice().reverse()}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" /><XAxis dataKey="category" stroke="#a9b8c7" /><YAxis stroke="#a9b8c7" /><Tooltip /><Bar dataKey="total" fill="#58c7ff" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard>
      </section>
      <section className="glass recommendations"><h2>AI recommendations</h2>{recs.map((r) => <p key={r}><Recycle size={18} /> {r}</p>)}</section>
    </main>
  );
}

function Metric({ title, value, icon: Icon }) { return <article className="metric glass"><Icon /><span>{title}</span><strong>{value}</strong></article>; }
function ChartCard({ title, children }) { return <article className="chart-card glass"><h3>{title}</h3><div>{children}</div></article>; }

function calculatorInsight(result) {
  if (!result) return [];
  const top = ['transport', 'electricity', 'diet', 'shopping'].sort((a, b) => result[b] - result[a])[0];
  const map = {
    transport: 'Transport is your largest source. Try replacing two short solo trips with transit, walking, cycling, or ride-sharing this week.',
    electricity: 'Electricity is leading your footprint. Shift heavy appliance use, reduce standby loads, and explore renewable plans.',
    diet: 'Diet is your largest lever. Two plant-forward meals and lower food waste can move your score quickly.',
    shopping: 'Shopping is the highest category. Delay non-essential purchases and choose durable or refillable products.'
  };
  return [
    map[top],
    `Estimated annualized footprint from this run: ${(result.total * 12).toFixed(1)} kg CO2e.`,
    `Approximate trees needed to offset this monthly result: ${Math.ceil(result.total / 21)}.`
  ];
}

function Calculator({ user }) {
  const [form, setForm] = useState({ car_km: 120, flights: 0, electricity_kwh: 260, meat_meals: 8, shopping_spend: 80, household: 3 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Travel', icon: Bike, fields: { car_km: 'Monthly car km', flights: 'Flights this month' } },
    { title: 'Home Energy', icon: Zap, fields: { electricity_kwh: 'Monthly electricity kWh', household: 'Household members' } },
    { title: 'Lifestyle', icon: Leaf, fields: { meat_meals: 'Meat meals this month', shopping_spend: 'Shopping spend USD' } },
  ];
  async function submit(e) {
    e.preventDefault(); setError('');
    try { setResult(await api('/footprints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, ...Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)])) }) })); }
    catch (err) { setError(err.message); }
  }
  return (
    <main className="page-wrap calc-layout">
      <form className="glass calculator" onSubmit={submit}>
        <span className="chip"><Zap size={16} /> Carbon Calculator</span><h1>Calculate and save your footprint</h1>
        <div className="stepper">{steps.map((s, i) => <button type="button" key={s.title} className={cls(step === i && 'active')} onClick={() => setStep(i)}><s.icon /> {s.title}</button>)}</div>
        <section className="step-card">
          <h2>{steps[step].title}</h2>
          {Object.entries(steps[step].fields).map(([k, label]) => <label key={k}>{label}<input type="number" min={k === 'household' ? 1 : 0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} /></label>)}
        </section>
        <div className="calc-actions">
          <button type="button" className="ghost" onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
          {step < steps.length - 1 ? <button type="button" className="primary" onClick={() => setStep(step + 1)}>Next <ArrowRight size={18} /></button> : <button className="primary">Save result</button>}
        </div>
        {error && <p className="error">{error}</p>}
      </form>
      <section className="glass result-panel">{result ? <><h2>{result.total} kg CO2e</h2><p className="status">{result.category} impact</p><div className="output-metrics"><Metric title="Annualized" value={`${(result.total * 12).toFixed(0)} kg`} icon={CalendarDays} /><Metric title="Per person" value={`${(result.total / Number(form.household || 1)).toFixed(1)} kg`} icon={Users} /><Metric title="Offset trees" value={Math.ceil(result.total / 21)} icon={Sprout} /></div><div className="break-list">{['transport', 'electricity', 'diet', 'shopping'].map(k => <p key={k}><span>{k}</span><b>{result[k]} kg</b></p>)}</div><div className="ai-insights"><h3>Dynamic AI Insights</h3>{calculatorInsight(result).map(x => <p key={x}><Lightbulb size={18} /> {x}</p>)}</div></> : <><Waves /><h2>Your saved result appears here</h2><p>Every calculation is stored in SQLite and immediately becomes dashboard data.</p></>}</section>
    </main>
  );
}

function Planet() {
  const forecast = [
    { name: 'Energy demand', value: 72 },
    { name: 'Transport pressure', value: 58 },
    { name: 'Heat risk', value: 64 },
    { name: 'Waste load', value: 49 },
  ];
  const liveLayers = [
    ['Carbon emissions', '412 ppm', '#ff7a7a'],
    ['Temperature change', '+1.3 C', '#ffdc5e'],
    ['Air quality index', 'AQI 68', '#58c7ff'],
    ['Energy consumption', '71 TW', '#61f2a5'],
  ];
  const hotspots = [
    ['Urban commute belts', 'High', 'Transport emissions spike during weekday peaks.'],
    ['Industrial energy zones', 'Medium', 'Electricity intensity responds to grid mix changes.'],
    ['Coastal heat corridors', 'Medium', 'Cooling demand is forecast to climb.'],
  ];
  return (
    <main className="page-wrap">
      <section className="planet-layout">
        <section className="glass planet-copy"><span className="chip"><Globe2 size={16} /> Planet Intelligence</span><h1>Live Earth Map</h1><p>A realistic interactive Earth surface with smooth auto-rotation, drag rotation, zoom controls, glowing regional markers, heat zones, and animated global activity arcs.</p><div className="signal-list"><p><MapPinned /> Carbon emissions by region</p><p><CloudSun /> Temperature and air-quality overlays</p><p><Zap /> Energy consumption activity lines</p></div><div className="layer-pills">{liveLayers.map(([name, value, color]) => <span key={name} style={{ '--layer': color }}><b>{value}</b>{name}</span>)}</div></section>
        <Globe />
      </section>
      <section className="planet-intel-grid">
        <article className="glass chart-card"><h3><Radio /> AI Trend Forecast</h3><div><ResponsiveContainer><BarChart data={forecast}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff18" /><XAxis dataKey="name" stroke="#a9b8c7" /><YAxis stroke="#a9b8c7" /><Tooltip /><Bar dataKey="value" fill="#61f2a5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></article>
        <article className="glass info-panel"><h2><AlertTriangle /> Regional Hotspots</h2>{hotspots.map(([area, level, text]) => <p key={area}><b>{area}</b><span>{level}</span>{text}</p>)}</article>
        <article className="glass info-panel ai-panel"><h2><Sparkles /> AI Insight</h2><p>EcoTrack predicts the fastest gains will come from combining commute reduction, household energy timing, and community-level waste sorting. The strongest next action is to reduce the category that dominates your latest calculator result.</p></article>
        <article className="glass info-panel"><h2><Compass /> Planet Components</h2><p><CloudSun /> Climate signal monitor</p><p><MapPinned /> Hotspot scanner</p><p><Target /> Action priority engine</p></article>
      </section>
    </main>
  );
}

function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const ocean = ctx.createLinearGradient(0, 0, 1024, 512);
  ocean.addColorStop(0, '#083b77'); ocean.addColorStop(.48, '#0f7fc4'); ocean.addColorStop(1, '#071a3f');
  ctx.fillStyle = ocean; ctx.fillRect(0, 0, 1024, 512);
  ctx.fillStyle = 'rgba(74, 201, 117, .9)';
  [
    [165, 190, 120, 78, -0.2], [250, 270, 74, 120, 0.25], [500, 180, 150, 82, 0.08],
    [575, 290, 95, 130, -0.1], [725, 210, 175, 92, 0.18], [812, 318, 82, 72, 0.45],
    [870, 365, 105, 46, -0.15], [455, 115, 78, 36, 0.2]
  ].forEach(([x, y, rx, ry, rot]) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = 'rgba(202, 255, 218, .48)';
  for (let i = 0; i < 70; i++) {
    ctx.beginPath();
    ctx.ellipse((i * 137) % 1024, 38 + ((i * 71) % 430), 34 + (i % 5) * 9, 5 + (i % 3) * 3, i, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

function latLonToVector3(lat, lon, radius = 1.08) {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function Globe() {
  const mount = useRef(null);
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 3.2;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const earthTexture = createEarthTexture();
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 128), new THREE.MeshStandardMaterial({ map: earthTexture, roughness: .82, metalness: .03 }));
    const land = new THREE.Mesh(new THREE.SphereGeometry(1.006, 96, 96), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .06, roughness: .9 }));
    land.scale.set(1, .985, 1);
    const clouds = new THREE.Mesh(new THREE.SphereGeometry(1.035, 96, 96), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .18 }));
    const wire = new THREE.Mesh(new THREE.SphereGeometry(1.08, 48, 48), new THREE.MeshBasicMaterial({ color: 0x8fffe1, wireframe: true, transparent: true, opacity: .14 }));
    const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.18, 96, 96), new THREE.MeshBasicMaterial({ color: 0x58c7ff, transparent: true, opacity: .08 }));
    const activityGroup = new THREE.Group();
    const markerData = [
      ['North America', 39, -98, 0xff7a7a, 'Carbon emissions'],
      ['Europe', 51, 10, 0xffdc5e, 'Temperature change'],
      ['India', 22, 78, 0x58c7ff, 'Air quality index'],
      ['East Asia', 35, 105, 0x61f2a5, 'Energy consumption'],
      ['Brazil', -10, -52, 0xff7ab6, 'Carbon emissions'],
    ];
    markerData.forEach(([, lat, lon, color]) => {
      const marker = new THREE.Mesh(new THREE.SphereGeometry(.032, 24, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95 }));
      marker.position.copy(latLonToVector3(lat, lon, 1.11));
      const heat = new THREE.Mesh(new THREE.SphereGeometry(.075, 24, 24), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .2 }));
      heat.position.copy(latLonToVector3(lat, lon, 1.105));
      marker.userData.baseScale = 1;
      activityGroup.add(heat, marker);
    });
    [[39, -98, 51, 10], [51, 10, 22, 78], [22, 78, 35, 105], [-10, -52, 39, -98]].forEach(([aLat, aLon, bLat, bLon]) => {
      const start = latLonToVector3(aLat, aLon, 1.13);
      const end = latLonToVector3(bLat, bLon, 1.13);
      const mid = start.clone().add(end).normalize().multiplyScalar(1.48);
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(64)), new THREE.LineBasicMaterial({ color: 0x8fffe1, transparent: true, opacity: .58 }));
      activityGroup.add(line);
    });
    scene.add(globe, land, clouds, wire, atmosphere, activityGroup, new THREE.AmbientLight(0xffffff, 1.15));
    const light = new THREE.DirectionalLight(0xffffff, 2.2); light.position.set(3, 2, 4); scene.add(light);
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    function resize() { const w = mount.current.clientWidth, h = mount.current.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    function pointerDown(event) { dragging = true; lastX = event.clientX; lastY = event.clientY; mount.current.setPointerCapture?.(event.pointerId); }
    function pointerMove(event) {
      if (!dragging) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX; lastY = event.clientY;
      globe.rotation.y += dx * 0.006; land.rotation.y += dx * 0.006; clouds.rotation.y += dx * 0.004; wire.rotation.y += dx * 0.006; activityGroup.rotation.y += dx * 0.006;
      globe.rotation.x = Math.max(-0.45, Math.min(0.45, globe.rotation.x + dy * 0.004));
      land.rotation.x = globe.rotation.x; clouds.rotation.x = globe.rotation.x; wire.rotation.x = globe.rotation.x; activityGroup.rotation.x = globe.rotation.x;
    }
    function pointerUp() { dragging = false; }
    function wheel(event) { event.preventDefault(); camera.position.z = Math.max(2.35, Math.min(4.6, camera.position.z + event.deltaY * 0.002)); }
    mount.current.appendChild(renderer.domElement); resize();
    mount.current.addEventListener('pointerdown', pointerDown);
    mount.current.addEventListener('pointermove', pointerMove);
    mount.current.addEventListener('pointerup', pointerUp);
    mount.current.addEventListener('pointerleave', pointerUp);
    mount.current.addEventListener('wheel', wheel, { passive: false });
    let raf; function animate(time = 0) {
      if (!dragging) { globe.rotation.y += .003; land.rotation.y += .003; clouds.rotation.y += .0045; activityGroup.rotation.y += .003; }
      wire.rotation.y -= .0015;
      activityGroup.children.forEach((child, index) => {
        if (child.geometry?.type === 'SphereGeometry') {
          const pulse = 1 + Math.sin(time * .004 + index) * .18;
          child.scale.setScalar(pulse);
        }
      });
      renderer.render(scene, camera); raf = requestAnimationFrame(animate);
    } animate();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
      mount.current?.removeEventListener('pointerdown', pointerDown);
      mount.current?.removeEventListener('pointermove', pointerMove);
      mount.current?.removeEventListener('pointerup', pointerUp);
      mount.current?.removeEventListener('pointerleave', pointerUp);
      mount.current?.removeEventListener('wheel', wheel);
      earthTexture.dispose(); renderer.dispose(); mount.current?.replaceChildren();
    };
  }, []);
  return (
    <section className="globe-shell glass" ref={mount}>
      <div className="globe-hud">
        <span>Drag to rotate</span>
        <span>Scroll to zoom</span>
      </div>
      <div className="globe-data">
        <b>Live overlays</b>
        <span className="emissions">Carbon</span>
        <span className="temp">Temperature</span>
        <span className="aqi">AQI</span>
        <span className="energy">Energy</span>
      </div>
    </section>
  );
}

function ChatExperience({ user, compact = false }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Ask me for carbon reduction ideas, dashboard interpretation, or sustainability recommendations.' }]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  async function send(e) {
    e.preventDefault(); if (!text.trim()) return;
    const outgoing = text; setText(''); setMessages(m => [...m, { role: 'user', text: outgoing }]);
    setLoading(true);
    try {
      const data = await api('/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, message: outgoing }) });
      setMessages(m => [...m, { role: 'assistant', text: data.answer, source: data.source }]);
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', text: err.message }]);
    } finally { setLoading(false); }
  }
  return (
    <section className={cls('glass chat-panel', compact && 'compact-chat')}>
      <span className="chip"><MessageCircle size={16} /> Groq AI Assistant</span>
      {!compact && <div className="suggested-row">{suggestedQuestions.map(q => <button key={q} onClick={() => setText(q)}>{q}</button>)}</div>}
      <div className="messages">
        {messages.map((m, i) => <p key={i} className={m.role}>{m.text}{m.role === 'assistant' && m.source && <em>{m.source === 'groq' ? 'Groq response' : 'Local fallback'}</em>}</p>)}
        {loading && <div className="assistant ai-loading"><span /><span /><span /><b>Eco AI is asking Groq...</b></div>}
      </div>
      <form onSubmit={send} className="chat-box"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask EcoTrack..." /><button className="primary"><SendHorizonal /></button></form>
    </section>
  );
}

function Assistant({ user }) {
  return (
    <main className="page-wrap assistant-page">
      <ChatExperience user={user} />
    </main>
  );
}

function Challenges({ setPage }) {
  const leaderboard = [
    { name: 'Aisha Rao', score: 2840, badge: 'Carbon Crusher', progress: 96 },
    { name: 'Noah Kim', score: 2510, badge: 'Hydration Hero', progress: 88 },
    { name: 'Maya Singh', score: 2325, badge: 'Streak Master', progress: 81 },
    { name: 'Leo Carter', score: 2180, badge: 'Energy Saver', progress: 76 },
  ];
  const challenges = [
    { title: 'Calorie Tracking', text: 'Log mindful meals for 5 days and connect food choices to carbon impact.', xp: '140 XP', progress: 72, Icon: Target, badge: 'Nutrition Focus' },
    { title: 'Workout Streak', text: 'Complete 4 low-carbon workouts: walking, cycling, yoga, or bodyweight training.', xp: '180 XP', progress: 58, Icon: Dumbbell, badge: 'Movement Streak' },
    { title: 'Hydration Goal', text: 'Hit your reusable-bottle hydration target for 7 days.', xp: '100 XP', progress: 86, Icon: Droplets, badge: 'Refill Pro' },
    { title: 'Energy Shift', text: 'Move appliance-heavy tasks outside peak hours three times this week.', xp: '120 XP', progress: 44, Icon: Zap, badge: 'Grid Friend' },
  ];
  return (
    <main className="page-wrap">
      <section className="page-hero challenge-hero glass">
        <div>
          <span className="chip"><Trophy size={16} /> Eco Challenges</span>
          <h1><span>Push Your Limits.</span><span>Complete Challenges.</span><span>Level Up.</span></h1>
          <p>Join daily and weekly challenges, track your progress in real time, earn rewards, and turn healthy sustainable habits into visible momentum.</p>
          <button className="primary" onClick={() => setPage('calculator')}>Measure before you start</button>
        </div>
        <div className="level-card">
          <Crown /><strong>Level 12</strong><span>2,460 XP earned</span><div><i style={{ width: '76%' }} /></div>
        </div>
      </section>
      <section className="leaderboard glass">
        <div className="section-title"><h2>Leaderboard</h2><p>Top users ranked by activity, completed goals, and challenge progress.</p></div>
        <div className="leader-grid">
          {leaderboard.map((user, index) => (
            <article key={user.name} className="leader-card">
              <span className="rank">#{index + 1}</span>
              <div className="mini-avatar">{user.name.split(' ').map(part => part[0]).join('')}</div>
              <h3>{user.name}</h3>
              <p>{user.badge}</p>
              <strong>{user.score} pts</strong>
              <div className="progress-line"><i style={{ width: `${user.progress}%` }} /></div>
            </article>
          ))}
        </div>
      </section>
      <section className="challenge-grid">
        {challenges.map(({ title, text, xp, progress, Icon, badge }) => (
          <article className="glass challenge-card goal-card" key={title}>
            <div className="circle-progress" style={{ '--progress': `${progress * 3.6}deg` }}><span>{progress}%</span></div>
            <Icon /><h3>{title}</h3><p>{text}</p><strong>{xp}</strong><em>{badge}</em>
            <div className="progress-line"><i style={{ width: `${progress}%` }} /></div>
            <button className="ghost">Join challenge</button>
          </article>
        ))}
      </section>
    </main>
  );
}

function CommunityHub({ user }) {
  const profileName = user.profile?.full_name || 'Eco member';
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [activeTopic, setActiveTopic] = useState('Fitness');
  const [threadText, setThreadText] = useState('');
  const [posts, setPosts] = useState([
    { id: 1, author: 'Riya Sharma', avatar: 'RS', time: '2 min ago', text: 'Completed my car-light commute and saved 4.8 kg CO2e today.', image: '', likes: 18, comments: ['That is a huge weekday win.'], replies: ['Trying this tomorrow.'] },
    { id: 2, author: 'GreenGrid Team', avatar: 'GG', time: '14 min ago', text: 'Repair meetup recap: 32 items fixed, 18 kg of waste avoided.', image: '', likes: 31, comments: ['Please host another one this weekend.'], replies: [] },
  ]);
  const [threads, setThreads] = useState({
    Fitness: ['How do you keep workouts low-carbon during summer heat?', 'Walking meetings helped me add 6k steps without extra travel.'],
    Nutrition: ['What are your easiest plant-forward lunches?', 'Batch cooking lentils dropped my food waste this week.'],
    Skincare: ['Any low-waste sunscreen brands that work in humid weather?', 'Refillable cleanser bottles are finally available near me.'],
    'Mental Health': ['Climate anxiety check-in: what helps you stay grounded?', 'I use one small action per day instead of doom-scrolling.'],
  });
  useEffect(() => {
    const updates = [
      'Live: Someone joined the hydration goal thread.',
      'Live: A moderator highlighted a helpful tip.',
      'Live: New progress update synced from the community feed.',
    ];
    const interval = setInterval(() => {
      setThreads(current => {
        const next = updates[Math.floor(Date.now() / 12000) % updates.length];
        if (current[activeTopic][0] === next) return current;
        return { ...current, [activeTopic]: [next, ...current[activeTopic].slice(0, 5)] };
      });
    }, 12000);
    return () => clearInterval(interval);
  }, [activeTopic]);
  function addPost(event) {
    event.preventDefault();
    if (!postText.trim() && !postImage) return;
    setPosts([{ id: Date.now(), author: profileName, avatar: profileName.split(' ').map(part => part[0]).join('').slice(0, 2), time: 'Just now', text: postText, image: postImage, likes: 0, comments: [], replies: [] }, ...posts]);
    setPostText(''); setPostImage('');
  }
  function uploadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPostImage(reader.result);
    reader.readAsDataURL(file);
  }
  function likePost(id) {
    setPosts(items => items.map(post => post.id === id ? { ...post, likes: post.likes + 1 } : post));
  }
  function addComment(id) {
    setPosts(items => items.map(post => post.id === id ? { ...post, comments: [...post.comments, 'Great progress. I am adding this to my plan.'] } : post));
  }
  function addReply(id) {
    setPosts(items => items.map(post => post.id === id ? { ...post, replies: [...post.replies, 'Reply sent from the community thread.'] } : post));
  }
  function addThread(event) {
    event.preventDefault();
    if (!threadText.trim()) return;
    setThreads(current => ({ ...current, [activeTopic]: [`${profileName}: ${threadText}`, ...current[activeTopic]] }));
    setThreadText('');
  }
  return (
    <main className="page-wrap">
      <section className="page-hero community-hero glass">
        <div>
          <span className="chip"><Users size={16} /> Community Hub</span>
          <h1><span>Connect.</span><span>Share.</span><span>Grow Together.</span></h1>
          <p>Share progress updates, upload images, react to community wins, discuss practical tips, and learn from people building healthier sustainable routines together.</p>
        </div>
        <div className="community-pulse"><Users /><strong>Live</strong><span>community activity</span></div>
      </section>
      <section className="community-layout">
        <div className="feed-column">
          <form className="glass composer" onSubmit={addPost}>
            <div className="composer-head"><div className="mini-avatar">{profileName.split(' ').map(part => part[0]).join('').slice(0, 2)}</div><input value={postText} onChange={(e) => setPostText(e.target.value)} placeholder="Share progress, a tip, or today's eco win..." /></div>
            {postImage && <img className="post-preview" src={postImage} alt="Selected upload preview" />}
            <div className="composer-actions"><label><ImageIcon size={18} /> Upload image<input type="file" accept="image/*" onChange={uploadImage} /></label><button className="primary">Post update</button></div>
          </form>
          {posts.map(post => (
            <article className="glass post-card" key={post.id}>
              <header><div className="mini-avatar">{post.avatar}</div><div><h3>{post.author}</h3><span>{post.time}</span></div></header>
              <p>{post.text}</p>
              {post.image && <img className="post-image" src={post.image} alt="Community update" />}
              <div className="engagement-row">
                <button onClick={() => likePost(post.id)}><Heart size={18} /> {post.likes}</button>
                <button onClick={() => addComment(post.id)}><MessageSquare size={18} /> {post.comments.length}</button>
                <button onClick={() => addReply(post.id)}><Reply size={18} /> {post.replies.length}</button>
                <button><Flag size={18} /> Moderate</button>
              </div>
              <div className="comment-stack">{[...post.comments, ...post.replies].map((comment, index) => <span key={`${post.id}-${index}`}>{comment}</span>)}</div>
            </article>
          ))}
        </div>
        <aside className="glass forum-panel">
          <h2>Discussion Forum</h2>
          <div className="topic-tabs">{Object.keys(threads).map(topic => <button key={topic} className={cls(activeTopic === topic && 'active')} onClick={() => setActiveTopic(topic)}>{topic}</button>)}</div>
          <div className="thread-list">{threads[activeTopic].map(item => <p key={item}><MessageCircle size={17} /> {item}</p>)}</div>
          <form className="thread-composer" onSubmit={addThread}><input value={threadText} onChange={(e) => setThreadText(e.target.value)} placeholder={`Ask or share in ${activeTopic}`} /><button className="primary"><SendHorizonal size={18} /></button></form>
          <div className="moderation-box"><ShieldCheck size={18} /><span>Moderation tools active: report, flag, slow-mode, and respectful discussion prompts.</span></div>
        </aside>
      </section>
    </main>
  );
}

function EcoAIWidget({ user }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="eco-ai-widget">
      {open && <ChatExperience user={user} compact />}
      <button className="eco-ai-button" onClick={() => setOpen(!open)}><Bot /><span>Eco AI</span></button>
    </div>
  );
}

function Footer({ setPage }) {
  const qrCells = Array.from({ length: 49 }, (_, index) => [0, 1, 2, 6, 7, 8, 14, 18, 20, 24, 28, 30, 32, 36, 40, 42, 43, 44, 48].includes(index) || index % 5 === 0 || index % 11 === 0);
  return (
    <footer className="footer glass">
      <section>
        <div className="footer-brand"><Leaf /> EcoTrack</div>
        <p>EcoTrack combines carbon calculation, planet intelligence, AI recommendations, challenges, and community collaboration into one futuristic sustainability workspace for everyday climate action.</p>
      </section>
      <section>
        <h3>Quick links</h3>
        {navPages.map(p => <button key={p} onClick={() => setPage(p)}>{p}</button>)}
      </section>
      <section>
        <h3>Disclaimer</h3>
        <p>EcoTrack provides educational sustainability estimates and AI guidance. Results are approximations and should not be treated as official environmental audits.</p>
        <a className="qr-box" href="https://discord.gg/5HnSbYQY8" target="_blank" rel="noreferrer" aria-label="Discord community QR code">
          <span className="qr-grid">{qrCells.map((on, index) => <i key={index} className={on ? 'on' : ''} />)}</span>
          <span>Discord community</span>
        </a>
      </section>
      <section>
        <h3>Contact support</h3>
        <a href="mailto:support@ecotrack.ai"><Mail size={15} /> support@ecotrack.ai</a>
        <a href="https://ecotrack.ai" target="_blank" rel="noreferrer"><Globe2 size={15} /> ecotrack.ai</a>
        <a href="https://www.instagram.com/sk_mastery67/" target="_blank" rel="noreferrer"><Instagram size={15} /> Instagram</a>
        <a href="https://www.linkedin.com/in/shaik-73142a336/" target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn</a>
        <a href="https://discord.gg/5HnSbYQY8" target="_blank" rel="noreferrer"><MessageCircle size={15} /> Discord</a>
      </section>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
