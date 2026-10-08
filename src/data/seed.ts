import type {
  Expense, Vendor, Student, SchoolClass, Parent, ParentNote, StudentParentLink,
  Term, FeeItem, FeeCharge, FeePayment, StaffMember, LeaveRecord, Profile,
  ExpenseCategoryKey, PaymentMethod,
} from './types'
import { addDays, addMonths, startOfMonth, todayIso, type IsoDate } from '@/lib/dates'

/**
 * A believable snapshot of a small Nairobi kindergarten, used by the demo store
 * so the app can be opened and understood before any Supabase keys exist.
 *
 * Deterministic on purpose (seeded PRNG): the same numbers appear on every
 * machine, so a screenshot taken today matches what the school sees tomorrow.
 */

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
}

const rand = rng(20260916)
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))

let idCounter = 0
const id = (prefix: string) => `${prefix}-${(++idCounter).toString(36).padStart(4, '0')}`

const NOW = new Date().toISOString()
const TODAY = todayIso()

/* --------------------------------------------------------------- reference */

export const DEMO_CLASSES: SchoolClass[] = [
  { id: 'class-daycare', name: 'Daycare', sortOrder: 10 },
  { id: 'class-kg1', name: 'KG1', sortOrder: 20 },
  { id: 'class-kg2', name: 'KG2', sortOrder: 30 },
  { id: 'class-pp1', name: 'PP1', sortOrder: 40 },
  { id: 'class-pp2', name: 'PP2', sortOrder: 50 },
]

const VENDOR_SEED: Array<[ExpenseCategoryKey, string]> = [
  ['fuel', "Ruby's"], ['fuel', 'B Energy'],
  ['supermarket', 'Naivas'], ['supermarket', 'Quickmart'], ['supermarket', 'Carrefour'],
  ['groceries', 'Local Market'], ['groceries', 'Mama Mboga'], ['groceries', 'Kawangware Market'],
  ['water', 'Nairobi Water'], ['water', 'Water Bowser'],
  ['repairs', 'Fundi — plumbing'], ['repairs', 'Fundi — electrical'],
  ['salaries', 'Monthly payroll'],
  ['other', 'KRA'], ['other', 'Printing shop'],
]

export const DEMO_VENDORS: Vendor[] = VENDOR_SEED.map(([categoryKey, name]) => ({
  id: id('vendor'),
  categoryKey,
  name,
  usageCount: between(1, 14),
  lastUsedAt: NOW,
  isArchived: false,
}))

const vendorFor = (cat: ExpenseCategoryKey) =>
  DEMO_VENDORS.filter((v) => v.categoryKey === cat)

/* ---------------------------------------------------------------- expenses */

/** Typical spend bands per category, in cents, so the totals look like a real term. */
const SPEND: Record<ExpenseCategoryKey, [number, number, number]> = {
  // [min cents, max cents, roughly how many times a month]
  supermarket: [180_000, 950_000, 5],
  groceries: [90_000, 420_000, 8],
  fuel: [200_000, 600_000, 4],
  salaries: [4_500_000, 5_200_000, 1],
  water: [150_000, 350_000, 2],
  repairs: [120_000, 1_400_000, 1],
  other: [50_000, 300_000, 2],
}

const METHODS: PaymentMethod[] = ['mpesa', 'mpesa', 'mpesa', 'cash', 'bank']

const NOTE_POOL = [
  'Weekly shopping for the kitchen',
  'Extra milk and fruit for snack time',
  'Topped up before the school run',
  'Paid the balance from last week',
  null, null, null,
]

function buildExpenses(): Expense[] {
  const out: Expense[] = []
  const firstMonth = addMonths(startOfMonth(TODAY), -5)

  for (let m = 0; m < 6; m++) {
    const monthStart = addMonths(firstMonth, m)
    const daysInMonth = Number(addDays(addMonths(monthStart, 1), -1).slice(8, 10))

    for (const key of Object.keys(SPEND) as ExpenseCategoryKey[]) {
      const [lo, hi, perMonth] = SPEND[key]
      const count = key === 'salaries' ? 1 : Math.max(1, perMonth + between(-1, 1))

      for (let i = 0; i < count; i++) {
        const day = key === 'salaries' ? Math.min(28, daysInMonth) : between(1, daysInMonth)
        const date = `${monthStart.slice(0, 7)}-${String(day).padStart(2, '0')}` as IsoDate
        if (date > TODAY) continue

        const vendors = vendorFor(key)
        const vendor = vendors.length ? pick(vendors) : null
        out.push({
          id: id('exp'),
          date,
          categoryKey: key,
          customCategory: null,
          vendorId: vendor?.id ?? null,
          vendorName: vendor?.name ?? 'Other',
          // Round to the nearest 50 KES — nobody spends KES 1,237.43 at a market.
          amountCents: Math.round(between(lo, hi) / 5_000) * 5_000,
          paymentMethod: key === 'salaries' ? 'bank' : pick(METHODS),
          notes: key === 'salaries' ? 'Monthly staff payroll' : pick(NOTE_POOL),
          createdBy: null,
          createdByName: 'Grace Wanjiru',
          createdAt: NOW,
        })
      }
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const DEMO_EXPENSES: Expense[] = buildExpenses()

/* ------------------------------------------------------- students & family */

type FamilySeed = {
  parent: string
  phone: string
  relationship: StudentParentLink['relationship']
  children: Array<{ first: string; last: string; age: number; className: string; allergies?: string[] }>
}

const FAMILIES: FamilySeed[] = [
  { parent: 'Grace Wanjiru', phone: '+254 722 145 903', relationship: 'mother',
    children: [{ first: 'Amani', last: 'Wanjiru', age: 5, className: 'PP2' },
               { first: 'Zawadi', last: 'Wanjiru', age: 3, className: 'Daycare' }] },
  { parent: 'Peter Otieno', phone: '+254 733 902 114', relationship: 'father',
    children: [{ first: 'Baraka', last: 'Otieno', age: 4, className: 'PP1', allergies: ['Peanut allergy'] }] },
  { parent: 'Mercy Achieng', phone: '+254 710 556 218', relationship: 'mother',
    children: [{ first: 'Neema', last: 'Achieng', age: 5, className: 'PP2' }] },
  { parent: 'Samuel Kimani', phone: '+254 724 310 887', relationship: 'father',
    children: [{ first: 'Mwangi', last: 'Kimani', age: 3, className: 'KG1' }] },
  { parent: 'Faith Njeri', phone: '+254 701 224 675', relationship: 'mother',
    children: [{ first: 'Imani', last: 'Njeri', age: 4, className: 'KG2', allergies: ['Dairy — mild'] }] },
  { parent: 'Joseph Mwangi', phone: '+254 738 447 190', relationship: 'father',
    children: [{ first: 'Tumaini', last: 'Mwangi', age: 4, className: 'PP1' }] },
  { parent: 'Esther Kamau', phone: '+254 713 668 402', relationship: 'mother',
    children: [{ first: 'Sanaa', last: 'Kamau', age: 5, className: 'PP2' }] },
  { parent: 'Alice Adhiambo', phone: '+254 726 019 553', relationship: 'guardian',
    children: [{ first: 'Jabali', last: 'Adhiambo', age: 3, className: 'Daycare' }] },
  { parent: 'Daniel Mutiso', phone: '+254 745 830 271', relationship: 'father',
    children: [{ first: 'Upendo', last: 'Mutiso', age: 4, className: 'KG2' }] },
  { parent: 'Rose Chebet', phone: '+254 709 337 448', relationship: 'mother',
    children: [{ first: 'Furaha', last: 'Chebet', age: 5, className: 'PP2' },
               { first: 'Subira', last: 'Chebet', age: 3, className: 'KG2' }] },
]

export const DEMO_PARENTS: Parent[] = []
export const DEMO_STUDENTS: Student[] = []
export const DEMO_LINKS: StudentParentLink[] = []

for (const family of FAMILIES) {
  const parent: Parent = {
    id: id('parent'),
    fullName: family.parent,
    phone: family.phone,
    email: `${family.parent.split(' ')[0].toLowerCase()}@example.co.ke`,
    createdAt: NOW,
  }
  DEMO_PARENTS.push(parent)

  family.children.forEach((child, index) => {
    const cls = DEMO_CLASSES.find((c) => c.name === child.className)!
    const birthYear = Number(TODAY.slice(0, 4)) - child.age
    const student: Student = {
      id: id('student'),
      firstName: child.first,
      lastName: child.last,
      dateOfBirth: `${birthYear}-${String(between(1, 12)).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`,
      photoUrl: null,
      classId: cls.id,
      className: cls.name,
      enrollmentDate: addMonths(TODAY, -between(2, 26)),
      status: 'active',
      emergencyContactName: family.parent,
      emergencyContactPhone: family.phone,
      allergies: child.allergies ?? [],
      medicalNotes: child.allergies?.length ? 'Kitchen has been briefed. Epi-pen not required.' : null,
      createdAt: NOW,
    }
    DEMO_STUDENTS.push(student)
    DEMO_LINKS.push({
      studentId: student.id,
      parentId: parent.id,
      relationship: family.relationship,
      isPrimaryContact: index === 0,
    })
  })
}

const NOTE_TEXTS = [
  'Called about the fee balance — will pay by Friday after payday.',
  'Discussed pickup time changing to 4pm on Wednesdays.',
  'Mentioned at pickup that the peanut allergy is confirmed by the clinic.',
  'Asked for a receipt for the last M-Pesa payment. Sent via WhatsApp.',
  'Happy with how the settling-in week went. Nothing outstanding.',
  'Will be travelling upcountry for two weeks in December.',
]

export const DEMO_PARENT_NOTES: ParentNote[] = DEMO_PARENTS.flatMap((p, i) =>
  Array.from({ length: between(1, 3) }, (_, n) => ({
    id: id('note'),
    parentId: p.id,
    noteDate: addDays(TODAY, -between(1, 70)),
    body: NOTE_TEXTS[(i + n) % NOTE_TEXTS.length],
    createdBy: null,
    createdByName: 'Front office',
    createdAt: NOW,
  })),
).sort((a, b) => (a.noteDate < b.noteDate ? 1 : -1))

/* -------------------------------------------------------------------- fees */

const year = Number(TODAY.slice(0, 4))
export const DEMO_TERMS: Term[] = [
  { id: 'term-1', name: `Term 1 ${year}`, startDate: `${year}-01-06`, endDate: `${year}-04-04`, isCurrent: false },
  { id: 'term-2', name: `Term 2 ${year}`, startDate: `${year}-05-05`, endDate: `${year}-08-01`, isCurrent: false },
  { id: 'term-3', name: `Term 3 ${year}`, startDate: `${year}-09-01`, endDate: `${year}-11-28`, isCurrent: true },
]

/**
 * The school's price list.
 *
 * Tuition and admission vary by class; stationery, insurance and uniform are
 * flat; transport is negotiated with each family, so it carries no price at all.
 * Every one of these is only a default — a student's own line can differ, which
 * is what happens in practice the moment a parent asks to pay in instalments.
 */
export const DEMO_FEE_ITEMS: FeeItem[] = [
  {
    key: 'tuition',
    label: 'Tuition & meals',
    emoji: '🍽️',
    cycle: 'term',
    defaultAmountCents: null,
    classAmounts: {
      'class-kg1': 3_200_000,
      'class-kg2': 3_400_000,
      'class-pp1': 3_600_000,
      'class-pp2': 3_700_000,
    },
    isOptional: false,
    isAdmissionOnly: false,
    limitedToClassIds: ['class-kg1', 'class-kg2', 'class-pp1', 'class-pp2'],
    isNegotiated: false,
    instalmentAmountCents: null,
    isProratable: true,
    sortOrder: 10,
    isArchived: false,
  },
  {
    key: 'daycare',
    label: 'Daycare days',
    emoji: '🧸',
    cycle: 'daily',
    // 600 a day. The line's amount is days attended × this rate.
    defaultAmountCents: 60_000,
    classAmounts: {},
    isOptional: false,
    isAdmissionOnly: false,
    limitedToClassIds: ['class-daycare'],
    isNegotiated: false,
    instalmentAmountCents: null,
    isProratable: false,
    sortOrder: 20,
    isArchived: false,
  },
  {
    key: 'admission',
    label: 'Admission fee',
    emoji: '📝',
    cycle: 'once',
    // Flat across every class, unlike tuition.
    defaultAmountCents: 250_000,
    classAmounts: {},
    isOptional: false,
    isAdmissionOnly: true,
    limitedToClassIds: [],
    isNegotiated: false,
    instalmentAmountCents: null,
    isProratable: false,
    sortOrder: 30,
    isArchived: false,
  },
  {
    key: 'stationery',
    label: 'Stationery',
    emoji: '✏️',
    cycle: 'year',
    defaultAmountCents: 450_000,
    classAmounts: {},
    isOptional: false,
    isAdmissionOnly: false,
    limitedToClassIds: [],
    isNegotiated: false,
    // 4,500 a year, or 1,500 a term across the three terms, by agreement.
    instalmentAmountCents: 150_000,
    isProratable: true,
    sortOrder: 40,
    isArchived: false,
  },
  {
    key: 'insurance',
    label: 'Insurance',
    emoji: '🛡️',
    cycle: 'year',
    defaultAmountCents: 150_000,
    classAmounts: {},
    isOptional: false,
    // Annual cover, so continuing children pay it again each year.
    isAdmissionOnly: false,
    limitedToClassIds: [],
    isNegotiated: false,
    instalmentAmountCents: null,
    isProratable: false,
    sortOrder: 50,
    isArchived: false,
  },
  {
    key: 'uniform',
    label: 'Uniform',
    emoji: '👕',
    cycle: 'once',
    defaultAmountCents: 1_000_000,
    classAmounts: {},
    // Optional: plenty of parents have the uniform made elsewhere.
    isOptional: true,
    isAdmissionOnly: false,
    limitedToClassIds: ['class-pp1', 'class-pp2'],
    isNegotiated: false,
    instalmentAmountCents: null,
    isProratable: false,
    sortOrder: 60,
    isArchived: false,
  },
  {
    key: 'transport',
    label: 'Transport',
    emoji: '🚐',
    cycle: 'term',
    // 10,000 is the standard rate. It is routinely adjusted down for a child
    // who lives close, so the line stays editable family by family.
    defaultAmountCents: 1_000_000,
    classAmounts: {},
    isOptional: true,
    isAdmissionOnly: false,
    limitedToClassIds: [],
    isNegotiated: false,
    instalmentAmountCents: null,
    isProratable: true,
    sortOrder: 70,
    isArchived: false,
  },
]

const itemByKey = (key: string) => DEMO_FEE_ITEMS.find((i) => i.key === key)!
const DUE = `${year}-09-20`

/* Charges: the lines on each family's bill for the current term. */
export const DEMO_CHARGES: FeeCharge[] = []

DEMO_STUDENTS.forEach((student, index) => {
  const classId = student.classId
  const isDaycare = classId === 'class-daycare'
  // Treat the most recent joiners as this term's new admissions.
  const isNewAdmission = index % 4 === 0

  const push = (
    itemKey: string,
    amountCents: number,
    opts: { termId?: string | null; quantity?: number | null; dueDate?: string | null } = {},
  ) => {
    DEMO_CHARGES.push({
      id: id('chg'),
      studentId: student.id,
      itemKey,
      termId: opts.termId !== undefined ? opts.termId : 'term-3',
      amountCents,
      fullAmountCents: null,
      proratedFrom: null,
      dueDate: opts.dueDate !== undefined ? opts.dueDate : DUE,
      quantity: opts.quantity ?? null,
      notes: null,
      isWaived: false,
      createdAt: NOW,
    })
  }

  if (isDaycare) {
    // ~3 days a week across the term so far.
    const days = between(18, 30)
    push('daycare', days * itemByKey('daycare').defaultAmountCents!, { quantity: days })
  } else {
    push('tuition', itemByKey('tuition').classAmounts[classId ?? ''] ?? 3_200_000)
  }

  if (isNewAdmission) {
    push('stationery', itemByKey('stationery').defaultAmountCents!, { termId: null })
    push('insurance', itemByKey('insurance').defaultAmountCents!, { termId: null })
    if (classId === 'class-pp1' || classId === 'class-pp2') {
      push('uniform', itemByKey('uniform').defaultAmountCents!, { termId: null })
    }
  }

  // Roughly a third of families use the bus, at a distance-dependent rate.
  if (index % 3 === 0) {
    push('transport', [800_000, 1_000_000, 1_000_000, 600_000][index % 4])
  }
})

/** A realistic spread: most paid up, a few part paid, a couple not started. */
export const DEMO_PAYMENTS: FeePayment[] = DEMO_CHARGES.flatMap((charge, index) => {
  const pattern = index % 5
  const amounts =
    pattern === 0 ? [] :
    pattern === 1 ? [Math.round(charge.amountCents * 0.4 / 5_000) * 5_000] :
    pattern === 2 ? [
      Math.round(charge.amountCents * 0.6 / 5_000) * 5_000,
      Math.round(charge.amountCents * 0.4 / 5_000) * 5_000,
    ] :
    [charge.amountCents]

  return amounts
    .filter((amountCents) => amountCents > 0)
    .map((amountCents, n) => ({
      id: id('pay'),
      studentId: charge.studentId,
      termId: charge.termId ?? 'term-3',
      chargeId: charge.id,
      amountCents,
      paidOn: addDays(`${year}-09-02`, n * 9 + between(0, 5)),
      method: pick(METHODS),
      reference: pick(['QGH4X2LM01', 'QGJ8P1TR77', 'QGK2M9WD40', null, null]),
      notes: null,
      createdBy: null,
      createdByName: 'Front office',
      createdAt: NOW,
    }))
}).filter((p) => p.paidOn <= TODAY)

/* ------------------------------------------------------------------- staff */

export const DEMO_STAFF: StaffMember[] = [
  { id: 'staff-1', fullName: 'Grace Wanjiru', roleTitle: 'Head Teacher', phone: '+254 722 145 903', email: 'grace@irisfields.ac.ke', startDate: `${year - 4}-01-08`, isActive: true, annualLeaveDays: 21 },
  { id: 'staff-2', fullName: 'Lilian Akinyi', roleTitle: 'Class Teacher — Nursery', phone: '+254 711 402 336', email: null, startDate: `${year - 2}-05-03`, isActive: true, annualLeaveDays: 21 },
  { id: 'staff-3', fullName: 'Brenda Nyambura', roleTitle: 'Class Teacher — Baby Class', phone: '+254 733 118 274', email: null, startDate: `${year - 1}-01-09`, isActive: true, annualLeaveDays: 21 },
  { id: 'staff-4', fullName: 'Kevin Omondi', roleTitle: 'Driver', phone: '+254 704 559 180', email: null, startDate: `${year - 3}-02-14`, isActive: true, annualLeaveDays: 21 },
  { id: 'staff-5', fullName: 'Agnes Muthoni', roleTitle: 'Cook', phone: '+254 726 883 041', email: null, startDate: `${year - 2}-09-01`, isActive: true, annualLeaveDays: 21 },
  { id: 'staff-6', fullName: 'Mary Atieno', roleTitle: 'Assistant Teacher', phone: '+254 745 220 613', email: null, startDate: `${year}-01-12`, isActive: true, annualLeaveDays: 21 },
]

export const DEMO_LEAVE: LeaveRecord[] = [
  { id: 'leave-1', staffId: 'staff-5', type: 'sick', startDate: TODAY, endDate: TODAY, notes: 'Flu — back tomorrow', createdBy: null, createdAt: NOW },
  { id: 'leave-2', staffId: 'staff-4', type: 'annual', startDate: addDays(TODAY, -1), endDate: addDays(TODAY, 3), notes: 'Family function upcountry', createdBy: null, createdAt: NOW },
  { id: 'leave-3', staffId: 'staff-2', type: 'annual', startDate: addDays(TODAY, 12), endDate: addDays(TODAY, 16), notes: null, createdBy: null, createdAt: NOW },
  { id: 'leave-4', staffId: 'staff-3', type: 'sick', startDate: addDays(TODAY, -24), endDate: addDays(TODAY, -23), notes: 'Clinic appointment', createdBy: null, createdAt: NOW },
  { id: 'leave-5', staffId: 'staff-6', type: 'other', startDate: addDays(TODAY, -40), endDate: addDays(TODAY, -40), notes: 'Compassionate leave', createdBy: null, createdAt: NOW },
]

export const DEMO_PROFILE: Profile = {
  id: 'demo-user',
  fullName: 'Grace Wanjiru',
  email: 'demo@irisfields.ac.ke',
  role: 'admin',
  createdAt: NOW,
}

export const DEMO_PROFILES: Profile[] = [
  DEMO_PROFILE,
  { id: 'demo-staff', fullName: 'Lilian Akinyi', email: 'lilian@irisfields.ac.ke', role: 'staff', createdAt: NOW },
]
