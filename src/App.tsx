import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowLeftRight, Bot, BriefcaseBusiness, CalendarDays,
  Check, CheckCircle2, ChevronRight, CircleGauge, Clock3, FileText,
  LayoutDashboard, Menu, Play, Plus, RefreshCw, Search, Settings,
  Sparkles, Target, UserRound, UsersRound, X
} from 'lucide-react'
import './App.css'

type Availability = 'Available' | 'Busy' | 'Unavailable'
type TaskStatus = 'In progress' | 'Completed' | 'Blocked' | 'Not started'
type Screen = 'Command Center' | 'Goal Planner' | 'Workforce' | 'Recovery'

type Person = {
  id: string; name: string; role: string; type: 'human' | 'agent'; skills: string[];
  availability: Availability; workload: number; status?: string; mode?: string
}

type Task = {
  id: string; title: string; phase: string; status: TaskStatus; assigneeId: string;
  skills: string[]; due: string; duration: number; dependencies: string[]; priority: 'High' | 'Medium' | 'Low'
}

type Activity = { id: number; text: string; time: string; tone: 'blue' | 'green' | 'amber' }
type Store = { tasks: Task[]; people: Person[]; activities: Activity[]; recoveryApproved: boolean }

const seedPeople: Person[] = [
  { id: 'maya', name: 'Maya Chen', role: 'Project Manager', type: 'human', skills: ['Planning', 'Coordination', 'Risk management'], availability: 'Available', workload: 64 },
  { id: 'david', name: 'David Miller', role: 'Lead Trainer', type: 'human', skills: ['AI training', 'Facilitation', 'Delivery'], availability: 'Available', workload: 82 },
  { id: 'aisha', name: 'Aisha Patel', role: 'Backup Trainer', type: 'human', skills: ['AI training', 'Facilitation', 'Coaching'], availability: 'Available', workload: 48 },
  { id: 'leo', name: 'Leo Martins', role: 'Content Developer', type: 'human', skills: ['Curriculum', 'Copywriting', 'Research'], availability: 'Busy', workload: 76 },
  { id: 'nora', name: 'Nora Ibrahim', role: 'Operations Coordinator', type: 'human', skills: ['Scheduling', 'Communication', 'Operations'], availability: 'Available', workload: 55 },
  { id: 'research', name: 'Research Agent', role: 'AI research capability', type: 'agent', skills: ['Research', 'Summarization', 'Sources'], availability: 'Available', workload: 35, status: 'Online', mode: 'Simulated execution' },
  { id: 'docs', name: 'Documentation Agent', role: 'AI writing capability', type: 'agent', skills: ['Documentation', 'Copywriting', 'Formatting'], availability: 'Available', workload: 42, status: 'Online', mode: 'Simulated execution' },
  { id: 'scheduler', name: 'Scheduling Assistant', role: 'AI scheduling capability', type: 'agent', skills: ['Scheduling', 'Calendar analysis', 'Notifications'], availability: 'Available', workload: 28, status: 'Online', mode: 'Simulated execution' },
]

const seedTasks: Task[] = [
  { id: 'T1', title: 'Research AI training use cases', phase: 'Discovery', status: 'Completed', assigneeId: 'research', skills: ['Research'], due: 'Nov 21', duration: 1, dependencies: [], priority: 'High' },
  { id: 'T2', title: 'Draft workshop learning objectives', phase: 'Design', status: 'In progress', assigneeId: 'leo', skills: ['Curriculum'], due: 'Nov 22', duration: 1, dependencies: ['T1'], priority: 'High' },
  { id: 'T3', title: 'Prepare trainer delivery guide', phase: 'Design', status: 'In progress', assigneeId: 'david', skills: ['AI training', 'Delivery'], due: 'Nov 23', duration: 2, dependencies: ['T2'], priority: 'High' },
  { id: 'T4', title: 'Build facilitator slide deck', phase: 'Preparation', status: 'In progress', assigneeId: 'docs', skills: ['Documentation'], due: 'Nov 24', duration: 2, dependencies: ['T2'], priority: 'Medium' },
  { id: 'T5', title: 'Coordinate rooms and attendance', phase: 'Preparation', status: 'Not started', assigneeId: 'nora', skills: ['Scheduling', 'Operations'], due: 'Nov 25', duration: 1, dependencies: [], priority: 'Medium' },
  { id: 'T6', title: 'Conduct leadership dry run', phase: 'Delivery', status: 'Not started', assigneeId: 'david', skills: ['Facilitation'], due: 'Nov 26', duration: 1, dependencies: ['T3', 'T4'], priority: 'High' },
  { id: 'T7', title: 'Deliver corporate AI workshop', phase: 'Delivery', status: 'Not started', assigneeId: 'david', skills: ['AI training', 'Facilitation'], due: 'Nov 27', duration: 1, dependencies: ['T5', 'T6'], priority: 'High' },
]

const seedActivities: Activity[] = [
  { id: 1, text: 'Research brief completed', time: '12 min ago', tone: 'green' },
  { id: 2, text: 'Delivery guide moved to in progress', time: '38 min ago', tone: 'blue' },
  { id: 3, text: 'Maya Chen approved the project timeline', time: '2 hr ago', tone: 'green' },
]

const initialStore: Store = { tasks: seedTasks, people: seedPeople, activities: seedActivities, recoveryApproved: false }

function loadStore(): Store {
  try {
    const raw = localStorage.getItem('synqra-store') || localStorage.getItem('workforceos-store')
    return raw ? JSON.parse(raw) : initialStore
  } catch {
    return initialStore
  }
}

function App() {
  const [store, setStore] = useState<Store>(loadStore)
  const [screen, setScreen] = useState<Screen>('Command Center')
  const [menuOpen, setMenuOpen] = useState(false)
  const [disrupted, setDisrupted] = useState(false)
  const [recoveryGenerated, setRecoveryGenerated] = useState(false)
  const [guided, setGuided] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [toast, setToast] = useState('')
  const [planner, setPlanner] = useState({ goal: 'Deliver a Corporate AI Training Workshop', description: 'Create a practical seven-day workshop for managers and operators.', deadline: '2026-11-27', budget: '8000', skills: 'AI training, Curriculum, Scheduling', priority: 'High' })

  useEffect(() => { localStorage.setItem('synqra-store', JSON.stringify(store)) }, [store])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2600)
    return () => window.clearTimeout(timer)
  }, [toast])

  const peopleById = useMemo(() => Object.fromEntries(store.people.map(p => [p.id, p])), [store.people])
  const inProgress = store.tasks.filter(t => t.status === 'In progress').length
  const completed = store.tasks.filter(t => t.status === 'Completed').length
  const blocked = store.tasks.filter(t => t.status === 'Blocked').length
  const affected = disrupted ? store.tasks.filter(t => t.assigneeId === 'david' || t.dependencies.some(d => ['T3', 'T6'].includes(d))) : []

  const notify = (text: string) => setToast(text)

  const reset = () => {
    setStore(initialStore)
    setDisrupted(false)
    setRecoveryGenerated(false)
    setGuided(false)
    setGuideStep(0)
    notify('Demo scenario reset')
  }

  const simulateDisruption = () => {
    setDisrupted(true)
    setRecoveryGenerated(false)
    setStore(s => ({ ...s, recoveryApproved: false, people: s.people.map(p => p.id === 'david' ? { ...p, availability: 'Unavailable' } : p), activities: [{ id: Date.now(), text: 'Lead trainer marked unavailable', time: 'Just now', tone: 'amber' }, ...s.activities] }))
    notify('Disruption detected: 3 tasks affected')
  }

  const generateRecovery = () => {
    if (!disrupted) { notify('Introduce a disruption first'); return }
    setRecoveryGenerated(true)
  }

  const approveRecovery = () => {
    setStore(s => ({
      ...s,
      recoveryApproved: true,
      tasks: s.tasks.map(t => t.assigneeId === 'david' ? { ...t, assigneeId: 'aisha', due: t.id === 'T7' ? 'Nov 28' : t.due } : t),
      people: s.people.map(p => p.id === 'aisha' ? { ...p, workload: Math.min(92, p.workload + 18), availability: p.workload + 18 >= 90 ? 'Busy' : 'Available' } : p.id === 'david' ? { ...p, availability: 'Unavailable' } : p),
      activities: [{ id: Date.now(), text: 'Recovery approved: Aisha Patel reassigned 3 trainer tasks', time: 'Just now', tone: 'green' }, ...s.activities],
    }))
    notify('Recovery plan approved')
  }

  const rejectRecovery = () => {
    setRecoveryGenerated(false)
    setStore(s => ({ ...s, activities: [{ id: Date.now(), text: 'Recovery plan rejected; project unchanged', time: 'Just now', tone: 'amber' }, ...s.activities] }))
    notify('Plan rejected; no committed changes made')
  }

  const navItems: { label: Screen; icon: typeof LayoutDashboard }[] = [
    { label: 'Command Center', icon: LayoutDashboard },
    { label: 'Goal Planner', icon: Target },
    { label: 'Workforce', icon: UsersRound },
    { label: 'Recovery', icon: ArrowLeftRight },
  ]

  const navigate = (next: Screen) => {
    setScreen(next); setMenuOpen(false)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><CircleGauge size={20} /></div><span>Synqra</span></div>
        <nav>
          {navItems.map(item => (
            <button key={item.label} className={screen === item.label ? 'active' : ''} onClick={() => navigate(item.label)}>
              <item.icon size={18} /><span>{item.label}</span>{item.label === 'Recovery' && <b className="alert-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button><Settings size={18} /><span>Settings</span></button>
          <div className="demo-profile"><div className="avatar">MC</div><div><strong>Maya Chen</strong><small>Workspace admin</small></div></div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMenuOpen(v => !v)}><Menu size={20} /></button>
          <div className="breadcrumb"><span>ZeroLimit</span><ChevronRight size={14} /><strong>{screen}</strong></div>
          <div className="top-actions">
            <button className="guided-btn" onClick={() => { setGuided(true); setGuideStep(0); navigate('Command Center') }}><Play size={15} /> Start Guided Demo</button>
            <button className="icon-btn"><Search size={17} /></button>
            <div className="avatar sm">MC</div>
          </div>
        </header>

        {guided && <div className="guide-strip">
          <span className="guide-label">GUIDED DEMO</span>
          {['Dashboard', 'Plan', 'Workforce', 'Disruption', 'Recovery', 'Approve'].map((s, i) => <button key={s} className={i === guideStep ? 'current' : i < guideStep ? 'done' : ''} onClick={() => { setGuideStep(i); if (i === 1) navigate('Goal Planner'); if (i === 2) navigate('Workforce'); if (i >= 3) navigate('Recovery') }}>{i < guideStep ? <Check size={12} /> : i + 1}<span>{s}</span></button>)}
          <button className="guide-close" onClick={() => setGuided(false)}><X size={15} /></button>
        </div>}

        <div className="content">
          {screen === 'Command Center' && <CommandCenter store={store} peopleById={peopleById} inProgress={inProgress} completed={completed} blocked={blocked} navigate={navigate} disrupted={disrupted} />}
          {screen === 'Goal Planner' && <GoalPlanner planner={planner} setPlanner={setPlanner} store={store} setStore={setStore} notify={notify} navigate={navigate} />}
          {screen === 'Workforce' && <Workforce store={store} setStore={setStore} notify={notify} />}
          {screen === 'Recovery' && <Recovery store={store} disrupted={disrupted} recoveryGenerated={recoveryGenerated} affected={affected} simulateDisruption={simulateDisruption} generateRecovery={generateRecovery} approveRecovery={approveRecovery} rejectRecovery={rejectRecovery} reset={reset} notify={notify} />}
        </div>
      </main>
      {toast && <div className="toast"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function CommandCenter({ store, peopleById, inProgress, completed, blocked, navigate, disrupted }: any) {
  const health = blocked ? 'At risk' : disrupted ? 'Degraded' : 'Healthy'
  return <>
    <div className="page-heading"><div><p className="eyebrow">MONDAY, NOVEMBER 20</p><h1>Command Center</h1><p>Keep work moving. Even when plans change.</p></div><button className="primary" onClick={() => navigate('Goal Planner')}><Plus size={16} /> New project</button></div>
    <div className="metrics">
      <Metric label="Active projects" value="2" detail="+1 this month" icon={<BriefcaseBusiness />} />
      <Metric label="Human team" value="5" detail="4 available" icon={<UsersRound />} />
      <Metric label="AI agents" value="3" detail="All online" icon={<Bot />} />
      <Metric label="Tasks in progress" value={inProgress} detail="Across 2 projects" icon={<Clock3 />} />
      <Metric label="Completed" value={completed} detail="14% of project" icon={<CheckCircle2 />} />
      <Metric label="Blocked" value={blocked} detail={blocked ? 'Needs attention' : 'No blockers'} icon={<AlertTriangle />} />
      <Metric label="Pending approvals" value={store.recoveryApproved ? 0 : disrupted ? 1 : 0} detail="Manager review" icon={<FileText />} />
    </div>
    <div className="dashboard-grid">
      <section className="card project-card">
        <div className="card-head"><div><p className="eyebrow">PRIMARY PROJECT</p><h2>Corporate AI Training Workshop</h2></div><span className="status-pill blue">On track</span></div>
        <div className="project-progress"><div><strong>42%</strong><span>Overall completion</span></div><div className="progress-track"><div style={{ width: '42%' }} /></div></div>
        <div className="phase-row">{['Discovery', 'Design', 'Preparation', 'Delivery'].map((p, i) => <div key={p} className={i < 2 ? 'complete' : i === 2 ? 'current' : ''}><span>{i < 2 ? <Check size={12} /> : i + 1}</span><b>{p}</b></div>)}</div>
      </section>
      <section className="card health-card"><div className="card-head"><h2>Operational Health</h2><span className={`health ${health === 'Healthy' ? 'good' : 'warn'}`}>{health}</span></div>
        <div className="health-row"><span><CheckCircle2 size={16} /> Task velocity</span><strong>Good</strong></div>
        <div className="health-row"><span><UsersRound size={16} /> Workforce capacity</span><strong>{disrupted ? 'Watch' : 'Good'}</strong></div>
        <div className="health-row"><span><AlertTriangle size={16} /> Dependency risk</span><strong>{disrupted ? 'Elevated' : 'Low'}</strong></div>
      </section>
      <section className="card allocation-card"><div className="card-head"><h2>Human–AI workforce</h2><button className="text-btn" onClick={() => navigate('Workforce')}>View allocation</button></div>
        <div className="allocation-list">{store.people.slice(0, 6).map((p: Person) => <div className="allocation-row" key={p.id}><div className={`mini-avatar ${p.type}`}>{p.type === 'agent' ? <Bot size={15} /> : p.name.split(' ').map(n => n[0]).join('')}</div><div><strong>{p.name}</strong><small>{p.availability} · {p.workload}% workload</small></div><span>{store.tasks.filter((t: Task) => t.assigneeId === p.id).length} tasks</span></div>)}</div>
      </section>
      <section className="card deadlines-card"><div className="card-head"><h2>Upcoming deadlines</h2><CalendarDays size={17} /></div>
        {store.tasks.filter((t: Task) => t.status !== 'Completed').slice(0, 4).map((t: Task) => <div className="deadline-row" key={t.id}><div><strong>{t.title}</strong><small>{peopleById[t.assigneeId]?.name}</small></div><span>{t.due}</span></div>)}
      </section>
      <section className="card activity-card"><div className="card-head"><h2>Recent activity</h2></div>
        {store.activities.slice(0, 5).map((a: Activity) => <div className="activity-row" key={a.id}><span className={`activity-dot ${a.tone}`} /><div><strong>{a.text}</strong><small>{a.time}</small></div></div>)}
      </section>
    </div>
  </>
}

function Metric({ label, value, detail, icon }: any) {
  return <div className="metric-card"><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
}

function GoalPlanner({ planner, setPlanner, store, setStore, notify, navigate }: any) {
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  const generate = () => {
    setLoading(true)
    window.setTimeout(() => {
      const g = planner.goal.toLowerCase()
      const isTraining = g.includes('training') || g.includes('workshop')
      const newTasks: Task[] = isTraining ? [
        { id: 'G1', title: 'Define workshop audience and outcomes', phase: 'Discovery', status: 'Not started', assigneeId: 'maya', skills: ['Planning'], due: 'Nov 21', duration: 1, dependencies: [], priority: 'High' },
        { id: 'G2', title: 'Develop role-specific learning exercises', phase: 'Design', status: 'Not started', assigneeId: 'leo', skills: ['Curriculum'], due: 'Nov 23', duration: 2, dependencies: ['G1'], priority: 'High' },
        { id: 'G3', title: 'Prepare facilitator materials', phase: 'Preparation', status: 'Not started', assigneeId: 'docs', skills: ['Documentation'], due: 'Nov 25', duration: 2, dependencies: ['G2'], priority: 'Medium' },
        { id: 'G4', title: 'Deliver and collect feedback', phase: 'Delivery', status: 'Not started', assigneeId: 'aisha', skills: ['Facilitation'], due: 'Nov 27', duration: 1, dependencies: ['G3'], priority: 'High' },
      ] : [
        { id: 'G1', title: 'Clarify project requirements', phase: 'Discovery', status: 'Not started', assigneeId: 'maya', skills: ['Planning'], due: 'Nov 21', duration: 1, dependencies: [], priority: 'High' },
        { id: 'G2', title: 'Complete primary research', phase: 'Discovery', status: 'Not started', assigneeId: 'research', skills: ['Research'], due: 'Nov 22', duration: 1, dependencies: ['G1'], priority: 'Medium' },
        { id: 'G3', title: 'Produce implementation package', phase: 'Execution', status: 'Not started', assigneeId: 'docs', skills: ['Documentation'], due: 'Nov 25', duration: 2, dependencies: ['G2'], priority: 'High' },
      ]
      setStore((s: Store) => ({ ...s, tasks: [...s.tasks, ...newTasks] }))
      setGenerated(true); setLoading(false); notify(`Demo Planning Engine generated ${newTasks.length} tasks`)
    }, 700)
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">GOAL-TO-EXECUTION</p><h1>Plan a new project</h1><p>Translate an outcome into an accountable workflow.</p></div></div>
    <div className="planner-layout">
      <section className="card planner-form"><div className="card-head"><h2>Project brief</h2><span className="engine-badge"><Sparkles size={13} /> Demo Planning Engine</span></div>
        <label>Project goal<input value={planner.goal} onChange={e => setPlanner((p: any) => ({ ...p, goal: e.target.value }))} /></label>
        <label>Project description<textarea value={planner.description} onChange={e => setPlanner((p: any) => ({ ...p, description: e.target.value }))} /></label>
        <div className="form-grid"><label>Deadline<input type="date" value={planner.deadline} onChange={e => setPlanner((p: any) => ({ ...p, deadline: e.target.value }))} /></label><label>Available budget<input type="number" value={planner.budget} onChange={e => setPlanner((p: any) => ({ ...p, budget: e.target.value }))} /></label></div>
        <label>Required skills<input value={planner.skills} onChange={e => setPlanner((p: any) => ({ ...p, skills: e.target.value }))} /></label>
        <label>Priority<select value={planner.priority} onChange={e => setPlanner((p: any) => ({ ...p, priority: e.target.value }) )}><option>High</option><option>Medium</option><option>Low</option></select></label>
        <button className="primary full" disabled={loading || !planner.goal.trim()} onClick={generate}>{loading ? <><RefreshCw className="spin" size={16} /> Generating plan...</> : <><Sparkles size={16} /> Generate Execution Plan</>}</button>
      </section>
      <section className="card plan-preview">
        <div className="card-head"><h2>{generated ? 'Generated workflow' : 'Execution preview'}</h2>{generated && <span className="status-pill green">Ready for review</span>}</div>
        {generated ? <div className="task-board">{store.tasks.slice(-4).map((t: Task) => <div className="board-task" key={t.id}><div><span className={`priority ${t.priority.toLowerCase()}`}>{t.priority}</span><small>{t.phase}</small></div><strong>{t.title}</strong><p><UserRound size={13} /> {store.people.find((p: Person) => p.id === t.assigneeId)?.name}</p><p><Clock3 size={13} /> {t.duration} day · Due {t.due}</p></div>)}</div> : <div className="empty-preview"><div className="empty-icon"><Target size={24} /></div><h3>Your execution plan will appear here</h3><p>Describe the goal and generate a structured, dependency-aware workflow.</p></div>}
        {generated && <div className="preview-actions"><button className="secondary" onClick={() => navigate('Workforce')}>Edit assignments</button><button className="primary" onClick={() => notify('Execution plan saved locally')}>Approve & save</button></div>}
      </section>
    </div>
  </>
}

function Workforce({ store, setStore, notify }: any) {
  const [selectedTask, setSelectedTask] = useState(store.tasks.find((t: Task) => t.status !== 'Completed')?.id || '')
  const task = store.tasks.find((t: Task) => t.id === selectedTask)
  const candidates = task ? store.people.filter((p: Person) => p.availability !== 'Unavailable').map((p: Person) => {
    const skillHits = task.skills.filter((s: string) => p.skills.some((ps: string) => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase()))).length
    const score = Math.round((skillHits / Math.max(task.skills.length, 1)) * 45 + (p.availability === 'Available' ? 30 : 10) + (100 - p.workload) * 0.25)
    return { person: p, score: Math.min(score, 99) }
  }).sort((a: any, b: any) => b.score - a.score) : []
  const assign = (personId: string) => {
    if (!task) return
    setStore((s: Store) => ({ ...s, tasks: s.tasks.map(t => t.id === task.id ? { ...t, assigneeId: personId } : t), activities: [{ id: Date.now(), text: `${task.id} assigned to ${peopleName(s.people, personId)}`, time: 'Just now', tone: 'blue' }, ...s.activities] }))
    notify('Assignment updated')
  }
  return <>
    <div className="page-heading"><div><p className="eyebrow">WORKFORCE ALLOCATION</p><h1>People & AI capabilities</h1><p>Match work to capacity, skills, and availability.</p></div></div>
    <div className="workforce-layout">
      <section className="card workforce-list"><div className="card-head"><h2>Team capacity</h2><span className="count-badge">{store.people.length}</span></div>
        {store.people.map((p: Person) => <div className="worker-row" key={p.id}><div className={`worker-avatar ${p.type}`}>{p.type === 'agent' ? <Bot size={18} /> : p.name.split(' ').map(n => n[0]).join('')}</div><div className="worker-main"><div><strong>{p.name}</strong><span className={`availability ${p.availability.toLowerCase()}`}>{p.availability}</span></div><small>{p.role}</small><div className="capacity-line"><div><span style={{ width: `${p.workload}%` }} /></div><b>{p.workload}%</b></div></div></div>)}
      </section>
      <section className="card recommendation"><div className="card-head"><h2>Assignment recommendation</h2><span className="engine-badge"><Sparkles size={13} /> Rule-based</span></div>
        <label>Select task<select value={selectedTask} onChange={e => setSelectedTask(e.target.value)}>{store.tasks.map((t: Task) => <option key={t.id} value={t.id}>{t.id} · {t.title}</option>)}</select></label>
        {task && <div className="recommendation-body"><div className="task-brief"><span>RECOMMENDED FOR</span><strong>{task.title}</strong><p>{task.skills.join(' · ')}</p></div>
          {candidates.slice(0, 4).map(({ person, score }: any, i: number) => <div className="candidate" key={person.id}><div className={`worker-avatar ${person.type}`}>{person.type === 'agent' ? <Bot size={18} /> : person.name.split(' ').map((n: string) => n[0]).join('')}</div><div><strong>{person.name}</strong><small>{i === 0 ? 'Best match' : person.availability} · {person.workload}% workload</small><p>{score >= 70 ? 'Strong skill match with available capacity.' : 'Suitable fallback with limited remaining capacity.'}</p></div><b className="score">{score}%</b><button onClick={() => assign(person.id)}>{task.assigneeId === person.id ? 'Assigned' : 'Assign'}</button></div>)}
        </div>}
      </section>
    </div>
  </>
}

function peopleName(people: Person[], id: string) { return people.find(p => p.id === id)?.name || id }

function Recovery({ store, disrupted, recoveryGenerated, affected, simulateDisruption, generateRecovery, approveRecovery, rejectRecovery, reset, notify }: any) {
  const lead = store.people.find((p: Person) => p.id === 'david')
  const backup = store.people.find((p: Person) => p.id === 'aisha')
  const trainerTasks = store.tasks.filter((t: Task) => t.assigneeId === 'david')
  return <>
    <div className="page-heading recovery-heading"><div><p className="eyebrow">ADAPTIVE WORKFLOW RECOVERY</p><h1>Keep the project moving</h1><p>Detect disruption, assess alternatives, and approve a recovery plan.</p></div><button className="secondary" onClick={reset}><RefreshCw size={15} /> Reset Demo Scenario</button></div>
    <div className="recovery-steps"><div className={disrupted ? 'done' : 'active'}><span>{disrupted ? <Check size={12} /> : 1}</span><div><strong>Normal operations</strong><small>Plan and assignments</small></div></div><div className={disrupted ? 'active' : ''}><span>{disrupted ? 2 : 2}</span><div><strong>Disruption</strong><small>{disrupted ? 'Trainer unavailable' : 'Waiting to simulate'}</small></div></div><div className={recoveryGenerated ? 'active' : ''}><span>3</span><div><strong>Recovery analysis</strong><small>{recoveryGenerated ? 'Alternatives compared' : 'Not generated'}</small></div></div><div className={store.recoveryApproved ? 'done' : ''}><span>4</span><div><strong>Human approval</strong><small>{store.recoveryApproved ? 'Approved' : 'Awaiting decision'}</small></div></div></div>
    <div className="recovery-layout">
      <section className="recovery-main">
        {!disrupted ? <section className="card disruption-hero"><div className="disruption-icon"><UserRound size={22} /></div><div><span className="eyebrow">NORMAL OPERATIONS</span><h2>Lead trainer is available</h2><p>Corporate AI Training Workshop · 7-day schedule</p></div><button className="danger" onClick={simulateDisruption}><AlertTriangle size={15} /> Simulate Team Member Unavailability</button></section> :
        <section className="card disruption-hero disrupted"><div className="disruption-icon amber"><AlertTriangle size={22} /></div><div><span className="eyebrow">DISRUPTION DETECTED</span><h2>{lead.name} is unavailable</h2><p>{affected.length} tasks affected · {trainerTasks.length} directly assigned</p></div>{!recoveryGenerated && !store.recoveryApproved && <button className="primary" onClick={generateRecovery}>Generate Recovery Plan</button>}</section>}
        <section className="card affected-card"><div className="card-head"><h2>Affected work</h2><span className={`status-pill ${disrupted ? 'amber' : 'green'}`}>{disrupted ? '3 at risk' : 'No active disruption'}</span></div>
          {disrupted ? <div className="affected-table"><div className="table-head"><span>TASK</span><span>DEPENDENCY</span><span>RISK</span></div>{store.tasks.filter((t: Task) => t.assigneeId === 'david' || t.dependencies.some((d: string) => trainerTasks.some((tt: Task) => tt.id === d))).slice(0, 5).map((t: Task) => <div className="table-row" key={t.id}><div><strong>{t.title}</strong><small>{t.id} · Due {t.due}</small></div><span>{t.dependencies.length ? t.dependencies.join(', ') : 'None'}</span><span className="risk">Elevated</span></div>)}</div> : <div className="normal-table"><div><strong>T3</strong><span>Prepare trainer delivery guide</span><small>David Miller · Nov 23</small></div><div><strong>T6</strong><span>Conduct leadership dry run</span><small>David Miller · Nov 26</small></div><div><strong>T7</strong><span>Deliver corporate AI workshop</span><small>David Miller · Nov 27</small></div></div>}
        </section>
        {disrupted && recoveryGenerated && <section className="card plan-comparison"><div className="card-head"><div><p className="eyebrow">RULE-BASED RECOMMENDATION</p><h2>Reassign trainer responsibilities</h2></div>{!store.recoveryApproved && <span className="status-pill amber">Approval required</span>}</div>
          <div className="explanation"><Sparkles size={16} /><p>The assigned trainer is unavailable. <strong>{affected.length} upcoming tasks</strong> depend on this role. <strong>{backup.name}</strong> is qualified, has 48% workload, and is available to take over. Reassigning delivery work is expected to keep the program feasible while extending final delivery by one day.</p></div>
          <div className="comparison"><div><span>BEFORE</span>{['T3 · David Miller · Nov 23', 'T6 · David Miller · Nov 26', 'T7 · David Miller · Nov 27'].map(x => <p key={x}>{x}</p>)}</div><ArrowLeftRight size={18} /><div><span>AFTER · RECOMMENDED</span>{['T3 · Aisha Patel · Nov 23', 'T6 · Aisha Patel · Nov 26', 'T7 · Aisha Patel · Nov 28'].map(x => <p key={x}><Check size={12} />{x}</p>)}</div></div>
          {!store.recoveryApproved ? <div className="approval-actions"><button className="danger-text" onClick={rejectRecovery}><X size={15} /> Reject Plan</button><button className="secondary" onClick={() => notify('Alternatives: David unavailable; Aisha is the only qualified available trainer')}>Review Alternatives</button><button className="primary" onClick={approveRecovery}><Check size={15} /> Approve Recovery Plan</button></div> : <div className="approved-banner"><CheckCircle2 size={17} /><div><strong>Recovery plan approved</strong><small>Assignments and workload have been updated.</small></div></div>}
        </section>}
      </section>
      <aside className="recovery-aside">
        <section className="card alternatives-card"><div className="card-head"><h2>Qualified alternatives</h2></div><div className="alternative"><div className="worker-avatar">AP</div><div><strong>Aisha Patel</strong><small>Backup Trainer</small><p>AI training · Facilitation</p></div><b>92%</b></div><div className="capacity-note"><span>Current workload</span><strong>48%</strong><div><i style={{ width: '48%' }} /></div></div></section>
        <section className="card knowledge-card"><div className="card-head"><h2>Knowledge & Decisions</h2></div><button onClick={() => notify('Opening: Corporate AI workshop delivery brief')}><FileText size={16} /><div><strong>Workshop delivery brief</strong><small>Project context · 4 decisions</small></div><ChevronRight size={15} /></button><button onClick={() => notify(store.recoveryApproved ? 'Decision: Aisha reassigned after lead trainer disruption' : 'Opening: Recovery approval history')}><CheckCircle2 size={16} /><div><strong>Recovery decision history</strong><small>{store.recoveryApproved ? '1 approved entry' : 'No approved entries yet'}</small></div><ChevronRight size={15} /></button></section>
      </aside>
    </div>
  </>
}

export default App
