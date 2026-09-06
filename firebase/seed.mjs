// =========================================================
// OrgSynq AI — Firestore seed script
//
// Populates departments, employees (with a manager hierarchy),
// digital twins, AI insights, simulations, a health trend, and
// notifications. Safe to re-run — it clears each collection first.
//
// Usage:
//   1. Fill in the non-VITE_ Firebase vars in your .env (see .env.example)
//   2. npm run seed
//
// This uses the regular Firebase Web SDK (not firebase-admin), so no
// service account file is needed. Because firestore.rules requires a
// signed-in user for every read/write, this script signs in with an
// existing OrgSynq account before touching Firestore — see SEED_EMAIL /
// SEED_PASSWORD below.
// =========================================================

import 'dotenv/config'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  deleteDoc,
  Timestamp
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
}

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    '\nMissing Firebase config. Fill in FIREBASE_API_KEY, FIREBASE_PROJECT_ID, etc. in your .env file (see .env.example), then run `npm run seed` again.\n'
  )
  process.exit(1)
}

const SEED_EMAIL = process.env.SEED_EMAIL
const SEED_PASSWORD = process.env.SEED_PASSWORD

if (!SEED_EMAIL || !SEED_PASSWORD) {
  console.error(
    '\nMissing SEED_EMAIL / SEED_PASSWORD in your .env file.\n' +
      'Firestore now requires a signed-in user for every write, so this script needs to log in first.\n' +
      '1. Sign up for an account in the app itself (or Firebase Console -> Authentication -> Add user).\n' +
      '2. Add these two lines to your .env:\n' +
      '   SEED_EMAIL=you@example.com\n' +
      '   SEED_PASSWORD=your-password\n' +
      '3. Run `npm run seed` again.\n'
  )
  process.exit(1)
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

const rand = (min, max) => Math.round(min + Math.random() * (max - min))
const hoursAgo = (h) => Timestamp.fromDate(new Date(Date.now() - h * 60 * 60 * 1000))

async function clearCollection(name) {
  const snap = await getDocs(collection(db, name))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  console.log(`  cleared ${snap.size} existing doc(s) from "${name}"`)
}

async function seedDigitalTwin(employeeId, employee) {
  const skills = rand(35, 95)
  const leadership = rand(25, 90)
  const learning = rand(30, 90)
  const promotion_ready = rand(20, 90)
  const collaboration = rand(35, 95)
  const org_contribution = rand(30, 95)
  const performance = Math.min(120, Math.max(0, employee.performance + rand(-5, 5)))
  const overall = Math.round(
    (performance +
      skills +
      leadership +
      learning +
      (100 - employee.burnout) +
      (100 - employee.attrition_risk) +
      promotion_ready +
      collaboration +
      org_contribution) /
      9
  )

  await setDoc(doc(db, 'digital_twins', employeeId), {
    performance,
    skills,
    leadership,
    learning,
    burnout: employee.burnout,
    attrition_risk: employee.attrition_risk,
    promotion_ready,
    collaboration,
    org_contribution,
    overall,
    updated_at: Timestamp.now()
  })
}

async function main() {
  console.log(`\nSeeding Firestore project "${firebaseConfig.projectId}"...\n`)

  console.log(`Signing in as ${SEED_EMAIL}...`)
  try {
    await signInWithEmailAndPassword(auth, SEED_EMAIL, SEED_PASSWORD)
  } catch (err) {
    console.error(
      `\nCould not sign in with SEED_EMAIL/SEED_PASSWORD: ${err.message}\n` +
        'Make sure this account exists (sign up for it in the app, or add it in Firebase Console -> Authentication -> Add user) and that the password in .env is correct.\n'
    )
    process.exit(1)
  }
  console.log('Signed in.\n')

  console.log('Clearing existing data...')
  for (const name of [
    'notifications',
    'simulations',
    'insights',
    'digital_twins',
    'employees',
    'org_health_trend',
    'departments',
    'team_formations',
    'one_on_ones',
    'candidates',
    'placement_searches',
    'courses',
    'projects',
    'kudos',
    'awards'
  ]) {
    await clearCollection(name)
  }

  // -------------------------------------------------------
  // Departments (custom doc ids so employees can reference them directly)
  // -------------------------------------------------------
  console.log('\nCreating departments...')
  const departments = [
    { id: 'engineering', name: 'Engineering', color: '#3B82F6' },
    { id: 'product', name: 'Product', color: '#8B5CF6' },
    { id: 'design', name: 'Design', color: '#EC4899' },
    { id: 'marketing', name: 'Marketing', color: '#F5A524' },
    { id: 'sales', name: 'Sales', color: '#22C55E' },
    { id: 'hr', name: 'HR', color: '#06B6D4' },
    { id: 'finance', name: 'Finance', color: '#F43F5E' },
    { id: 'operations', name: 'Operations', color: '#14B8A6' }
  ]
  for (const d of departments) {
    await setDoc(doc(db, 'departments', d.id), { name: d.name, color: d.color })
  }

  // -------------------------------------------------------
  // Executives (top of the org chart, no manager)
  // -------------------------------------------------------
  console.log('Creating executives...')
  const executives = [
    {
      id: 'casey-morgan',
      name: 'Casey Morgan',
      email: 'casey.morgan@orgsynq.ai',
      title: 'Chief Executive Officer',
      department_id: 'operations',
      manager_id: null,
      location: 'New York',
      status: 'Active',
      performance: 91,
      burnout: 38,
      attrition_risk: 12,
      skills: ['Leadership', 'Strategy', 'Public Speaking', 'Fundraising'],
      experience_years: 18
    },
    {
      id: 'taylor-reed',
      name: 'Taylor Reed',
      email: 'taylor.reed@orgsynq.ai',
      title: 'Chief Marketing Officer',
      department_id: 'marketing',
      manager_id: null,
      location: 'New York',
      status: 'Active',
      performance: 84,
      burnout: 44,
      attrition_risk: 18,
      skills: ['Brand Strategy', 'Leadership', 'Growth Marketing', 'Public Speaking'],
      experience_years: 15
    }
  ]

  // -------------------------------------------------------
  // Department leads (report to the executives)
  // -------------------------------------------------------
  const leads = [
    { id: 'oakley-robinson', name: 'Oakley Robinson', email: 'oakley.robinson@orgsynq.ai', title: 'HR Manager', department_id: 'hr', manager_id: 'casey-morgan', location: 'Chicago', status: 'Active', performance: 68, burnout: 78, attrition_risk: 38, skills: ['People Operations', 'Conflict Resolution', 'Compliance', 'Recruiting'], experience_years: 9 },
    { id: 'noel-martinez', name: 'Noel Martinez', email: 'noel.martinez@orgsynq.ai', title: 'Head of Sales', department_id: 'sales', manager_id: 'casey-morgan', location: 'Austin', status: 'Active', performance: 75, burnout: 12, attrition_risk: 6, skills: ['Negotiation', 'Sales Strategy', 'CRM', 'Team Leadership'], experience_years: 12 },
    { id: 'yael-wright', name: 'Yael Wright', email: 'yael.wright@orgsynq.ai', title: 'Head of Product', department_id: 'product', manager_id: 'taylor-reed', location: 'Seattle', status: 'Remote', performance: 66, burnout: 70, attrition_risk: 40, skills: ['Product Strategy', 'Roadmapping', 'User Research', 'SQL'], experience_years: 11 },
    { id: 'jamie-chen', name: 'Jamie Chen', email: 'jamie.chen@orgsynq.ai', title: 'Engineering Lead', department_id: 'engineering', manager_id: 'casey-morgan', location: 'San Francisco', status: 'Active', performance: 88, burnout: 41, attrition_risk: 15, skills: ['System Design', 'TypeScript', 'Team Leadership', 'Cloud Architecture'], experience_years: 13 },
    { id: 'faye-garcia', name: 'Faye Garcia', email: 'faye.garcia@orgsynq.ai', title: 'Design Lead', department_id: 'design', manager_id: 'taylor-reed', location: 'Denver', status: 'Remote', performance: 79, burnout: 33, attrition_risk: 22, skills: ['Design Systems', 'Figma', 'User Research', 'Team Leadership'], experience_years: 10 },
    { id: 'cameron-wells', name: 'Cameron Wells', email: 'cameron.wells@orgsynq.ai', title: 'Finance Lead', department_id: 'finance', manager_id: 'taylor-reed', location: 'Boston', status: 'Active', performance: 81, burnout: 28, attrition_risk: 10, skills: ['Financial Modeling', 'Forecasting', 'Excel', 'Budgeting'], experience_years: 14 },
    { id: 'drew-adams', name: 'Drew Adams', email: 'drew.adams@orgsynq.ai', title: 'Marketing Lead', department_id: 'marketing', manager_id: 'casey-morgan', location: 'London', status: 'Active', performance: 74, burnout: 46, attrition_risk: 24, skills: ['Campaign Strategy', 'Content Marketing', 'Analytics', 'SEO'], experience_years: 8 },
    { id: 'jade-patel', name: 'Jade Patel', email: 'jade.patel@orgsynq.ai', title: 'Operations Lead', department_id: 'operations', manager_id: 'taylor-reed', location: 'Austin', status: 'Remote', performance: 77, burnout: 39, attrition_risk: 19, skills: ['Process Optimization', 'Logistics', 'Vendor Management', 'Project Management'], experience_years: 9 }
  ]

  for (const e of [...executives, ...leads]) {
    const { id, ...data } = e
    await setDoc(doc(db, 'employees', id), { ...data, created_at: Timestamp.now() })
    await seedDigitalTwin(id, data)
  }
  console.log(`  created ${executives.length} executives + ${leads.length} department leads (with digital twins)`)

  // -------------------------------------------------------
  // Individual contributors (report to the leads above)
  // -------------------------------------------------------
  console.log('Creating individual contributors...')
  const ics = [
    ['Val Ibarra', 'val.ibarra@orgsynq.ai', 'Software Engineer', 'engineering', 'jamie-chen', 'San Francisco', 'Active'],
    ['Emery Taylor', 'emery.taylor@orgsynq.ai', 'Brand Manager', 'marketing', 'drew-adams', 'Boston', 'Active'],
    ['Kai Sullivan', 'kai.sullivan@orgsynq.ai', 'Backend Engineer', 'engineering', 'jamie-chen', 'Remote', 'Remote'],
    ['Indigo Vance', 'indigo.vance@orgsynq.ai', 'DevOps Engineer', 'engineering', 'jamie-chen', 'Seattle', 'Remote'],
    ['Skyler Ford', 'skyler.ford@orgsynq.ai', 'Product Manager', 'product', 'yael-wright', 'Seattle', 'Active'],
    ['Milo Bennett', 'milo.bennett@orgsynq.ai', 'Product Owner', 'product', 'yael-wright', 'Chicago', 'Remote'],
    ['Marlowe Diaz', 'marlowe.diaz@orgsynq.ai', 'SEO Specialist', 'marketing', 'drew-adams', 'Denver', 'Active'],
    ['Finley Grant', 'finley.grant@orgsynq.ai', 'Operations Analyst', 'operations', 'jade-patel', 'Austin', 'Active'],
    ['Piper Nolan', 'piper.nolan@orgsynq.ai', 'UI Designer', 'design', 'faye-garcia', 'Denver', 'Active'],
    ['Xander Ross', 'xander.ross@orgsynq.ai', 'Sales Engineer', 'sales', 'noel-martinez', 'San Francisco', 'Remote'],
    ['Quinn Hayes', 'quinn.hayes@orgsynq.ai', 'Account Executive', 'sales', 'noel-martinez', 'Austin', 'Active'],
    ['Tatum Reyes', 'tatum.reyes@orgsynq.ai', 'Sales Development Rep', 'sales', 'noel-martinez', 'Remote', 'Remote'],
    ['Glen Ortiz', 'glen.ortiz@orgsynq.ai', 'Senior UX Designer', 'design', 'faye-garcia', 'Boston', 'Active'],
    ['Dana Moore', 'dana.moore@orgsynq.ai', 'Senior UX Designer', 'design', 'faye-garcia', 'Boston', 'Active'],
    ['Harper Lane', 'harper.lane@orgsynq.ai', 'People Operations', 'hr', 'oakley-robinson', 'London', 'Active'],
    ['Parker Blake', 'parker.blake@orgsynq.ai', 'Recruiter', 'hr', 'oakley-robinson', 'Chicago', 'Remote'],
    ['Reese Coleman', 'reese.coleman@orgsynq.ai', 'Financial Analyst', 'finance', 'cameron-wells', 'Boston', 'Active'],
    ['Hana Suzuki', 'hana.suzuki@orgsynq.ai', 'Controller', 'finance', 'cameron-wells', 'Boston', 'Active'],
    ['Avery Davis', 'avery.davis@orgsynq.ai', 'Operations Manager', 'operations', 'jade-patel', 'Austin', 'Active'],
    ['Nina Castro', 'nina.castro@orgsynq.ai', 'Logistics Coordinator', 'operations', 'jade-patel', 'Remote', 'Remote'],
    ['Aiden Hill', 'aiden.hill@orgsynq.ai', 'Product Manager', 'product', 'yael-wright', 'Los Angeles', 'Remote'],
    ['Alex Chen', 'alex.chen@orgsynq.ai', 'Engineering Manager', 'engineering', 'jamie-chen', 'London', 'Remote'],
    ['Blake Miller', 'blake.miller@orgsynq.ai', 'DevOps Engineer', 'engineering', 'jamie-chen', 'Seattle', 'Remote'],
    ['Brynn Scott', 'brynn.scott@orgsynq.ai', 'UI Designer', 'design', 'faye-garcia', 'Denver', 'Active'],
    ['Cameron Wilson', 'cameron.wilson@orgsynq.ai', 'Product Owner', 'product', 'yael-wright', 'Seattle', 'Active'],
    ['Casey Johnson', 'casey.johnson@orgsynq.ai', 'Sales Engineer', 'sales', 'noel-martinez', 'San Francisco', 'Remote'],
    ['Cole Green', 'cole.green@orgsynq.ai', 'SEO Specialist', 'marketing', 'drew-adams', 'Denver', 'Remote'],
    ['Eden Baker', 'eden.baker@orgsynq.ai', 'People Operations', 'hr', 'oakley-robinson', 'London', 'Remote'],
    ['Rowan Price', 'rowan.price@orgsynq.ai', 'Backend Engineer', 'engineering', 'jamie-chen', 'Austin', 'Active'],
    ['Sawyer James', 'sawyer.james@orgsynq.ai', 'Frontend Engineer', 'engineering', 'jamie-chen', 'Remote', 'Remote'],
    ['Ellis Novak', 'ellis.novak@orgsynq.ai', 'QA Engineer', 'engineering', 'jamie-chen', 'San Francisco', 'Active'],
    ['Rory Simmons', 'rory.simmons@orgsynq.ai', 'Data Analyst', 'product', 'yael-wright', 'Chicago', 'Active'],
    ['Sage Whitfield', 'sage.whitfield@orgsynq.ai', 'Content Strategist', 'marketing', 'drew-adams', 'Boston', 'Remote'],
    ['Briar Holloway', 'briar.holloway@orgsynq.ai', 'Growth Marketer', 'marketing', 'drew-adams', 'Remote', 'Remote'],
    ['Wren Alvarado', 'wren.alvarado@orgsynq.ai', 'Customer Success Mgr', 'sales', 'noel-martinez', 'Austin', 'Active'],
    ['Lennox Freeman', 'lennox.freeman@orgsynq.ai', 'Account Executive', 'sales', 'noel-martinez', 'New York', 'Active'],
    ['Marlowe Stein', 'marlowe.stein@orgsynq.ai', 'Payroll Specialist', 'finance', 'cameron-wells', 'Boston', 'Active'],
    ['Ember Castillo', 'ember.castillo@orgsynq.ai', 'FP&A Analyst', 'finance', 'cameron-wells', 'New York', 'Remote'],
    ['Tobias Reed', 'tobias.reed@orgsynq.ai', 'Warehouse Supervisor', 'operations', 'jade-patel', 'Austin', 'Active'],
    ['Juniper Cole', 'juniper.cole@orgsynq.ai', 'Facilities Coordinator', 'operations', 'jade-patel', 'Remote', 'Remote']
  ]

  const SKILL_POOL = {
    engineering: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS', 'Docker', 'CI/CD', 'System Design', 'Testing/QA', 'Kubernetes'],
    design: ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping', 'Accessibility', 'Illustration', 'Typography'],
    product: ['Product Strategy', 'Roadmapping', 'User Research', 'SQL', 'A/B Testing', 'Agile/Scrum', 'Data Analysis', 'Stakeholder Management'],
    sales: ['Negotiation', 'CRM', 'Sales Strategy', 'Account Management', 'Cold Outreach', 'Closing', 'Customer Success', 'Public Speaking'],
    marketing: ['Content Marketing', 'SEO', 'Campaign Strategy', 'Analytics', 'Copywriting', 'Social Media', 'Brand Strategy', 'Email Marketing'],
    finance: ['Financial Modeling', 'Forecasting', 'Excel', 'Budgeting', 'GAAP', 'Payroll', 'Financial Reporting', 'Data Analysis'],
    hr: ['Recruiting', 'People Operations', 'Conflict Resolution', 'Compliance', 'Onboarding', 'Employee Relations', 'HRIS'],
    operations: ['Process Optimization', 'Logistics', 'Vendor Management', 'Project Management', 'Supply Chain', 'Facilities Management']
  }

  function randomSkills(department_id) {
    const pool = SKILL_POOL[department_id] || SKILL_POOL.operations
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, rand(3, 5))
  }

  function experienceForTitle(title) {
    const senior = /senior|lead|manager|head|principal|staff/i.test(title)
    return senior ? rand(6, 16) : rand(1, 8)
  }

  for (const [name, email, title, department_id, manager_id, location, status] of ics) {
    const employee = {
      name,
      email,
      title,
      department_id,
      manager_id,
      location,
      status,
      performance: rand(45, 100),
      burnout: rand(15, 75),
      attrition_risk: rand(5, 65),
      skills: randomSkills(department_id),
      experience_years: experienceForTitle(title),
      created_at: Timestamp.now()
    }
    const ref = await addDoc(collection(db, 'employees'), employee)
    await seedDigitalTwin(ref.id, employee)
  }
  console.log(`  created ${ics.length} individual contributors (with digital twins)`)

  // -------------------------------------------------------
  // Org health trend
  // -------------------------------------------------------
  console.log('Creating org health trend...')
  const trend = [
    ['jan', 'Jan', 70, 1],
    ['feb', 'Feb', 74, 2],
    ['mar', 'Mar', 72, 3],
    ['apr', 'Apr', 69, 4],
    ['may', 'May', 71, 5],
    ['jun', 'Jun', 75, 6],
    ['jul', 'Jul', 73, 7]
  ]
  for (const [id, month, health, sort_order] of trend) {
    await setDoc(doc(db, 'org_health_trend', id), { month, health, sort_order })
  }

  // -------------------------------------------------------
  // AI Decision Support insights
  // -------------------------------------------------------
  console.log('Creating insights...')
  const insights = [
    {
      type: 'risk',
      title: 'Critical Burnout Alert: Engineering Department',
      description:
        'Several engineers are showing burnout scores above 75%. Immediate intervention is recommended to avoid attrition and project delays.',
      severity: 'high',
      confidence: 87,
      employees_affected: 6,
      status: 'open',
      action_steps: [
        'Schedule 1:1 check-ins with affected engineers this week',
        'Redistribute sprint load across the team',
        'Offer flexible PTO for the next two sprints'
      ],
      created_at: hoursAgo(1)
    },
    {
      type: 'risk',
      title: 'Flight Risk: 8 High-Value Employees',
      description:
        'Eight employees have an attrition risk above 60%. Estimated combined replacement cost is approximately $2.4M.',
      severity: 'critical',
      confidence: 82,
      employees_affected: 8,
      status: 'open',
      action_steps: [
        'Prioritize retention conversations with direct managers',
        'Benchmark compensation against market data',
        'Fast-track pending promotion reviews'
      ],
      created_at: hoursAgo(4)
    },
    {
      type: 'opportunity',
      title: 'Promotion Candidates Identified',
      description:
        'Three employees are ready for promotion based on strong performance and leadership indicators in their digital twin profiles.',
      severity: 'high',
      confidence: 91,
      employees_affected: 3,
      status: 'open',
      action_steps: [
        'Prepare promotion packets for the next review cycle',
        'Align new scope with department roadmaps',
        'Communicate timeline expectations to candidates'
      ],
      created_at: hoursAgo(8)
    },
    {
      type: 'recommendation',
      title: 'Rebalance Design Team Workload',
      description:
        'Design department burnout is trending 18% above the company average while headcount has stayed flat for two quarters.',
      severity: 'medium',
      confidence: 76,
      employees_affected: 5,
      status: 'open',
      action_steps: [
        'Evaluate a contractor for overflow design work',
        'Audit current project intake process',
        'Introduce a design review rotation'
      ],
      created_at: hoursAgo(20)
    },
    {
      type: 'prediction',
      title: 'Q3 Attrition Forecast: Sales',
      description:
        'Based on current trends, the Sales department is projected to see two additional departures in the next quarter absent intervention.',
      severity: 'medium',
      confidence: 71,
      employees_affected: 2,
      status: 'open',
      action_steps: [
        'Review quota fairness across territories',
        'Increase manager check-in cadence',
        'Revisit the SDR-to-AE promotion path'
      ],
      created_at: hoursAgo(30)
    },
    {
      type: 'opportunity',
      title: 'Cross-Training Opportunity: Product & Design',
      description:
        'Overlap in collaboration scores suggests Product and Design employees would benefit from a structured cross-training program.',
      severity: 'low',
      confidence: 68,
      employees_affected: 9,
      status: 'resolved',
      action_steps: [
        'Pilot a two-week shadow program',
        'Gather feedback after the first cohort',
        'Scale to additional departments if successful'
      ],
      created_at: hoursAgo(72)
    }
  ]
  for (const insight of insights) {
    await addDoc(collection(db, 'insights'), insight)
  }

  // -------------------------------------------------------
  // Sample simulations
  // -------------------------------------------------------
  console.log('Creating sample simulations...')
  const simulations = [
    {
      name: 'Q4 Design Restructure',
      scenario_type: 'Layoff',
      target_department_id: 'design',
      affected_employees: 16,
      productivity_change: -11,
      financial_impact: 1307380,
      project_delay_risk: 22,
      recovery_time_months: 2,
      attrition_risk: 32,
      morale_impact: -18,
      confidence: 76,
      recommendations: [
        'Implement knowledge transfer protocols before changes',
        'Communicate transparently with the remaining team',
        'Offer outplacement support to affected employees'
      ],
      created_at: hoursAgo(48)
    },
    {
      name: 'Engineering Expansion Plan',
      scenario_type: 'Hiring',
      target_department_id: 'engineering',
      affected_employees: 12,
      productivity_change: 9,
      financial_impact: 640000,
      project_delay_risk: 6,
      recovery_time_months: 3,
      attrition_risk: -5,
      morale_impact: 6,
      confidence: 84,
      recommendations: [
        'Pair new hires with a senior mentor',
        'Front-load onboarding documentation',
        'Stagger start dates to avoid ramp-up bottlenecks'
      ],
      created_at: hoursAgo(96)
    }
  ]
  for (const sim of simulations) {
    await addDoc(collection(db, 'simulations'), sim)
  }

  // -------------------------------------------------------
  // Notifications
  // -------------------------------------------------------
  console.log('Creating notifications...')
  const notifications = [
    { title: 'Critical burnout alert', message: 'Engineering department burnout crossed the 75% threshold.', is_read: false, created_at: Timestamp.fromDate(new Date(Date.now() - 20 * 60 * 1000)) },
    { title: 'Flight risk detected', message: '8 high-value employees now show attrition risk above 60%.', is_read: false, created_at: hoursAgo(2) },
    { title: 'Simulation completed', message: 'Your "Q4 Design Restructure" scenario finished processing.', is_read: false, created_at: hoursAgo(5) },
    { title: 'Promotion candidates ready', message: '3 employees were flagged as promotion-ready this week.', is_read: true, created_at: hoursAgo(24) },
    { title: 'Weekly digest available', message: 'Your workforce health summary for last week is ready to view.', is_read: true, created_at: hoursAgo(48) },
    { title: 'New digital twin generated', message: 'A cognitive profile was generated for a newly added employee.', is_read: true, created_at: hoursAgo(72) }
  ]
  for (const n of notifications) {
    await addDoc(collection(db, 'notifications'), n)
  }

  // -------------------------------------------------------
  // Candidates (external placement pool)
  // -------------------------------------------------------
  console.log('Creating sample candidates...')
  const candidates = [
    {
      name: 'Priya Nair',
      email: 'priya.nair@example.com',
      applied_role: 'Senior Backend Engineer',
      location: 'Bengaluru',
      skills: ['Node.js', 'PostgreSQL', 'AWS', 'System Design', 'Kubernetes'],
      experience_years: 7,
      test_score: 88,
      interview_score: 82,
      behavior_score: 79,
      status: 'Interviewing',
      notes: 'Strong system design round; slightly weak on Kubernetes specifics.'
    },
    {
      name: 'Marcus Webb',
      email: 'marcus.webb@example.com',
      applied_role: 'Product Designer',
      location: 'Remote',
      skills: ['Figma', 'Design Systems', 'Prototyping', 'User Research'],
      experience_years: 4,
      test_score: 74,
      interview_score: 85,
      behavior_score: 90,
      status: 'Screening',
      notes: 'Excellent portfolio, especially design systems work.'
    },
    {
      name: 'Elena Vasquez',
      email: 'elena.vasquez@example.com',
      applied_role: 'Customer Success Manager',
      location: 'Miami',
      skills: ['Account Management', 'CRM', 'Customer Success', 'Public Speaking'],
      experience_years: 5,
      test_score: 70,
      interview_score: 91,
      behavior_score: 88,
      status: 'Offer',
      notes: 'Very strong communicator, previously at a SaaS scale-up.'
    },
    {
      name: 'Tomasz Kowalski',
      email: 'tomasz.kowalski@example.com',
      applied_role: 'Senior Backend Engineer',
      location: 'Warsaw',
      skills: ['Python', 'Django', 'PostgreSQL', 'CI/CD'],
      experience_years: 9,
      test_score: 92,
      interview_score: 76,
      behavior_score: 68,
      status: 'New',
      notes: 'Top technical score in the pool; interview felt a bit rehearsed.'
    },
    {
      name: 'Ava Thompson',
      email: 'ava.thompson@example.com',
      applied_role: 'Junior Product Designer',
      location: 'Toronto',
      skills: ['Figma', 'UI Design', 'Illustration'],
      experience_years: 1,
      test_score: 65,
      interview_score: 78,
      behavior_score: 84,
      status: 'New',
      notes: 'Junior but very promising portfolio for the level.'
    },
    {
      name: 'Devon Brooks',
      email: 'devon.brooks@example.com',
      applied_role: 'Sales Development Rep',
      location: 'Chicago',
      skills: ['Cold Outreach', 'CRM', 'Negotiation'],
      experience_years: 2,
      test_score: 60,
      interview_score: 55,
      behavior_score: 62,
      status: 'Rejected',
      notes: 'Did not demonstrate enough resilience under objection-handling scenarios.'
    }
  ]
  for (const c of candidates) {
    await addDoc(collection(db, 'candidates'), { ...c, created_at: Timestamp.now() })
  }

  // -------------------------------------------------------
  // Courses (upskilling library)
  // -------------------------------------------------------
  console.log('Creating sample courses...')
  const courses = [
    {
      title: 'System Design Fundamentals',
      description: 'A practical primer on designing scalable backend systems — load balancing, caching, and database sharding.',
      youtube_url: 'https://www.youtube.com/watch?v=UzLMhqg3_Wc',
      category: 'Engineering'
    },
    {
      title: 'Figma for Product Designers',
      description: 'Get comfortable with components, auto-layout, and design systems in Figma.',
      youtube_url: 'https://www.youtube.com/watch?v=FTFaQWZBqQ8',
      category: 'Design'
    },
    {
      title: 'Leading Without Authority',
      description: 'How to influence and lead a team effectively even without a formal management title.',
      youtube_url: 'https://www.youtube.com/watch?v=qkMgvUbHwWo',
      category: 'Leadership'
    }
  ]
  for (const c of courses) {
    await addDoc(collection(db, 'courses'), { ...c, created_at: Timestamp.now() })
  }

  // -------------------------------------------------------
  // Projects (sample assignment)
  // -------------------------------------------------------
  console.log('Creating a sample project...')
  await addDoc(collection(db, 'projects'), {
    name: 'Mobile App Launch',
    description: 'Cross-functional push to ship the new mobile app, coordinating engineering, design, and marketing.',
    status: 'Active',
    member_ids: ['jamie-chen', 'faye-garcia', 'drew-adams'],
    created_at: Timestamp.now()
  })

  console.log('\nDone. Your Firestore project is seeded with 50 employees across 8 departments.\n')
  process.exit(0)
}

main().catch((err) => {
  console.error('\nSeeding failed:', err)
  process.exit(1)
})
