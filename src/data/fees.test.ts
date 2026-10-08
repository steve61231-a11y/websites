import { describe, expect, it } from 'vitest'
import {
  allocatePayment, chargeBalance, feeBalance, itemsForStudent, proratedAmount, prorationFactor,
} from './selectors'
import { appendShillings, dropLastShilling, formatKes, matchesAmount, sumCents } from '@/lib/money'
import type { FeeCharge, FeeItem, FeePayment, Term } from './types'

/**
 * The fee rules decide what families are told they owe, so they are tested
 * rather than eyeballed. Everything here is in cents.
 */

const TERM_1: Term = { id: 't1', name: 'Term 1', startDate: '2026-01-06', endDate: '2026-04-04', isCurrent: false }
const TERM_2: Term = { id: 't2', name: 'Term 2', startDate: '2026-05-05', endDate: '2026-08-01', isCurrent: false }
const TERM_3: Term = { id: 't3', name: 'Term 3', startDate: '2026-09-01', endDate: '2026-11-28', isCurrent: true }
const TERMS = [TERM_1, TERM_2, TERM_3]

const item = (over: Partial<FeeItem> & Pick<FeeItem, 'key'>): FeeItem => ({
  label: over.key, emoji: '📌', cycle: 'term', defaultAmountCents: null, classAmounts: {},
  isOptional: false, isAdmissionOnly: false, limitedToClassIds: [], isNegotiated: false,
  instalmentAmountCents: null, isProratable: false, sortOrder: 10, isArchived: false,
  ...over,
})

const TUITION = item({ key: 'tuition', isProratable: true, classAmounts: { kg1: 3_200_000 } })
const ADMISSION = item({ key: 'admission', cycle: 'once', isAdmissionOnly: true, defaultAmountCents: 500_000 })
const UNIFORM = item({ key: 'uniform', cycle: 'once', isOptional: true, limitedToClassIds: ['pp1', 'pp2'] })
const ITEMS = [TUITION, ADMISSION, UNIFORM]

const charge = (over: Partial<FeeCharge> & Pick<FeeCharge, 'id' | 'itemKey' | 'amountCents'>): FeeCharge => ({
  studentId: 'kid', termId: TERM_3.id, fullAmountCents: null, proratedFrom: null,
  dueDate: null, quantity: null, notes: null, isWaived: false, createdAt: '2026-09-01T00:00:00Z',
  ...over,
})

const payment = (over: Partial<FeePayment> & Pick<FeePayment, 'id' | 'amountCents'>): FeePayment => ({
  studentId: 'kid', termId: TERM_3.id, chargeId: null, paidOn: '2026-09-10', method: 'mpesa',
  reference: null, notes: null, createdBy: null, createdByName: null, createdAt: '2026-09-10T00:00:00Z',
  ...over,
})

describe('proration — "we prorate as per where the term is"', () => {
  it('charges the full amount to a child there from day one', () => {
    expect(prorationFactor(TERM_3.startDate, TERM_3)).toBe(1)
    expect(proratedAmount(3_200_000, TERM_3.startDate, TERM_3)).toBe(3_200_000)
  })

  it('charges about half to a child joining halfway through', () => {
    const half = proratedAmount(3_200_000, '2026-10-15', TERM_3)
    expect(half).toBeGreaterThan(1_400_000)
    expect(half).toBeLessThan(1_800_000)
  })

  it('rounds to the nearest 50 shillings, because the school quotes round figures', () => {
    expect(proratedAmount(3_200_000, '2026-10-15', TERM_3) % 5_000).toBe(0)
  })

  it('never charges more than the full price, or less than nothing', () => {
    expect(prorationFactor('2025-01-01', TERM_3)).toBe(1)
    expect(prorationFactor('2027-01-01', TERM_3)).toBe(0)
  })
})

describe('what a new child is billed versus a returning one', () => {
  it('bills the admission fee only to a child who is joining', () => {
    const joining = itemsForStudent(ITEMS, 'kg1', { isNewAdmission: true }).map((i) => i.key)
    const returning = itemsForStudent(ITEMS, 'kg1', { isNewAdmission: false }).map((i) => i.key)
    expect(joining).toContain('admission')
    expect(returning).not.toContain('admission')
  })

  it('keeps the uniform to the classes that wear one', () => {
    expect(itemsForStudent(ITEMS, 'kg1', { isNewAdmission: true }).map((i) => i.key)).not.toContain('uniform')
    expect(itemsForStudent(ITEMS, 'pp2', { isNewAdmission: true }).map((i) => i.key)).toContain('uniform')
  })
})

describe('a single line', () => {
  const line = charge({ id: 'c1', itemKey: 'tuition', amountCents: 3_700_000 })

  it('is unpaid with nothing against it', () => {
    const b = chargeBalance(line, ITEMS, [], '2026-09-20')
    expect(b.balanceCents).toBe(3_700_000)
    expect(b.status).toBe('unpaid')
  })

  it('is part paid once some money lands on it', () => {
    const b = chargeBalance(line, ITEMS, [payment({ id: 'p1', amountCents: 1_000_000, chargeId: 'c1' })], '2026-09-20')
    expect(b.paidCents).toBe(1_000_000)
    expect(b.balanceCents).toBe(2_700_000)
    expect(b.status).toBe('partial')
  })

  it('ignores money paid against a different line', () => {
    const b = chargeBalance(line, ITEMS, [payment({ id: 'p1', amountCents: 1_000_000, chargeId: 'other' })], '2026-09-20')
    expect(b.paidCents).toBe(0)
  })

  it('goes overdue once its due date has passed', () => {
    const dated = charge({ id: 'c1', itemKey: 'tuition', amountCents: 3_700_000, dueDate: '2026-09-20' })
    expect(chargeBalance(dated, ITEMS, [], '2026-10-01').status).toBe('overdue')
  })

  it('counts a waived line as settled, not as owing', () => {
    const waived = charge({ id: 'c1', itemKey: 'tuition', amountCents: 3_700_000, isWaived: true })
    const b = chargeBalance(waived, ITEMS, [], '2026-10-01')
    expect(b.balanceCents).toBe(0)
    expect(b.status).toBe('waived')
  })
})

describe('arrears carry into the next term', () => {
  const lastTerm = charge({ id: 'old', itemKey: 'tuition', amountCents: 3_400_000, termId: TERM_2.id })
  const thisTerm = charge({ id: 'new', itemKey: 'tuition', amountCents: 3_700_000, termId: TERM_3.id })

  it('brings an unpaid earlier term forward without hiding it in this term\'s bill', () => {
    const b = feeBalance('kid', TERM_3.id, [lastTerm, thisTerm], [], ITEMS, TERMS, '2026-09-20')
    expect(b.dueCents).toBe(3_700_000)          // only this term was billed now
    expect(b.broughtForwardCents).toBe(3_400_000)
    expect(b.balanceCents).toBe(7_100_000)      // but they owe both
    expect(b.status).toBe('overdue')
  })

  it('stops bringing it forward once the old term is settled', () => {
    const paidOff = [payment({ id: 'p', amountCents: 3_400_000, chargeId: 'old', termId: TERM_2.id })]
    const b = feeBalance('kid', TERM_3.id, [lastTerm, thisTerm], paidOff, ITEMS, TERMS, '2026-09-20')
    expect(b.broughtForwardCents).toBe(0)
    expect(b.balanceCents).toBe(3_700_000)
  })

  it('does not count a later term as arrears against an earlier one', () => {
    const b = feeBalance('kid', TERM_2.id, [lastTerm, thisTerm], [], ITEMS, TERMS, '2026-05-10')
    expect(b.broughtForwardCents).toBe(0)
  })
})

describe('the whole bill', () => {
  it('folds annual and one-off lines into whichever term you are looking at', () => {
    const lines = [
      charge({ id: 'tui', itemKey: 'tuition', amountCents: 3_700_000 }),
      charge({ id: 'adm', itemKey: 'admission', amountCents: 500_000, termId: null }),
    ]
    const b = feeBalance('kid', TERM_3.id, lines, [], ITEMS, TERMS, '2026-09-20')
    expect(b.lines).toHaveLength(2)
    expect(b.dueCents).toBe(4_200_000)
  })

  it('still counts money that has not been put against a line', () => {
    const lines = [charge({ id: 'tui', itemKey: 'tuition', amountCents: 3_700_000 })]
    const loose = [payment({ id: 'p', amountCents: 500_000, chargeId: null })]
    const b = feeBalance('kid', TERM_3.id, lines, loose, ITEMS, TERMS, '2026-09-20')
    expect(b.paidCents).toBe(500_000)
    expect(b.balanceCents).toBe(3_200_000)
  })

  it('reads as paid up only when nothing at all is left', () => {
    const lines = [charge({ id: 'tui', itemKey: 'tuition', amountCents: 3_700_000 })]
    const settled = [payment({ id: 'p', amountCents: 3_700_000, chargeId: 'tui' })]
    expect(feeBalance('kid', TERM_3.id, lines, settled, ITEMS, TERMS, '2026-09-20').status).toBe('paid')
  })

  it('has nothing to say about a child with no fees set', () => {
    expect(feeBalance('kid', TERM_3.id, [], [], ITEMS, TERMS, '2026-09-20').status).toBe('no-invoice')
  })
})

describe('the keypad types shillings, never cents', () => {
  it('turns 2 0 0 0 0 into twenty thousand shillings', () => {
    let v = 0
    for (const d of '20000') v = appendShillings(v, d)
    expect(v).toBe(2_000_000)
    expect(formatKes(v)).toBe('KES 20,000')
  })

  it('treats a multi-zero key the same as pressing zero that many times', () => {
    expect(appendShillings(appendShillings(0, '2'), '000')).toBe(appendShillings(0, '2000'))
  })

  it('takes one shilling digit off on backspace', () => {
    expect(dropLastShilling(2_000_000)).toBe(200_000)
    expect(dropLastShilling(0)).toBe(0)
  })

  it('refuses a figure no kindergarten would ever enter', () => {
    expect(appendShillings(900_000_000, '9')).toBe(900_000_000)
  })
})

describe('spreading a payment across what is owed', () => {
  const items = [
    item({ key: 'stationery', sortOrder: 40 }),
    item({ key: 'tuition', sortOrder: 10 }),
  ]
  const stationery = charge({ id: 's', itemKey: 'stationery', amountCents: 150_000, dueDate: '2026-09-10' })
  const tuition = charge({ id: 't', itemKey: 'tuition', amountCents: 3_700_000, dueDate: '2026-09-20' })
  const lines = [stationery, tuition].map((c) => chargeBalance(c, items, [], '2026-09-01'))

  it('clears the oldest debt first and spills into the next', () => {
    const { allocations, unassignedCents } = allocatePayment(500_000, lines)
    expect(allocations).toEqual([
      { chargeId: 's', amountCents: 150_000, label: 'stationery' },
      { chargeId: 't', amountCents: 350_000, label: 'tuition' },
    ])
    expect(unassignedCents).toBe(0)
  })

  it('stops at the first line when the money runs out', () => {
    const { allocations } = allocatePayment(100_000, lines)
    expect(allocations).toHaveLength(1)
    expect(allocations[0].amountCents).toBe(100_000)
  })

  it('hands back anything left over rather than attaching it somewhere', () => {
    const { allocations, unassignedCents } = allocatePayment(4_000_000, lines)
    expect(sumCents(allocations.map((a) => a.amountCents))).toBe(3_850_000)
    expect(unassignedCents).toBe(150_000)
  })

  it('ignores lines that are already settled or waived', () => {
    const settled = chargeBalance(
      charge({ id: 's', itemKey: 'stationery', amountCents: 150_000 }),
      items,
      [payment({ id: 'p', amountCents: 150_000, chargeId: 's' })],
      '2026-09-01',
    )
    const { allocations } = allocatePayment(100_000, [settled, lines[1]])
    expect(allocations.map((a) => a.chargeId)).toEqual(['t'])
  })
})

describe('searching by amount, the way people say it', () => {
  it('finds twenty thousand however it is typed', () => {
    for (const q of ['20000', '20,000', '20 000', '20k', '20K']) {
      expect(matchesAmount(q, 2_000_000)).toBe(true)
    }
  })

  it('does not confuse it with a different figure', () => {
    expect(matchesAmount('20000', 200_000)).toBe(false)
    expect(matchesAmount('21k', 2_000_000)).toBe(false)
  })

  it('still surfaces something on a partial figure', () => {
    expect(matchesAmount('200', 2_000_000)).toBe(true)
  })

  it('ignores words and empty searches', () => {
    expect(matchesAmount('naivas', 2_000_000)).toBe(false)
    expect(matchesAmount('  ', 2_000_000)).toBe(false)
  })
})
