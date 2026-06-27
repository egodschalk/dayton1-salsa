import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore'

// Evaluates whether a pass should be visible to buyers right now
export function isPassVisible(pass, today = new Date()) {
    if (!pass.active) return false

    const v = pass.visibility || { mode: 'always' }

    if (v.mode === 'always') return true

    if (v.mode === 'monthlyWindow') {
        const dayOfMonth = today.getDate()
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
        const startDays = v.windowStartDays ?? 7
        const endDays = v.windowEndDays ?? 5
        return dayOfMonth <= startDays || dayOfMonth >= (daysInMonth - (endDays - 1))
    }

    if (v.mode === 'dateRange') {
        if (!v.startDate || !v.endDate) return true
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
        return todayStr >= v.startDate && todayStr <= v.endDate
    }

    if (v.mode === 'daysOfWeek') {
        const days = v.days || []
        return days.includes(today.getDay())
    }

    return true
}

// Computes the expiry date for a pass based on its duration type
export function getExpiryDate(pass) {
    const now = new Date()
    if (pass.duration === 'day') {
        const expiry = new Date(now)
        expiry.setMonth(expiry.getMonth() + 3)
        return expiry.toISOString()
    }
    // monthly
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const diffDays = (nextMonth - now) / (1000 * 60 * 60 * 24)
    if (diffDays < 5) {
        return new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString()
    }
    return nextMonth.toISOString()
}

// Hook: subscribes to all pass types, returns them sorted by order
export function usePassTypes() {
    const [passTypes, setPassTypes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'passTypes'), orderBy('order', 'asc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPassTypes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return unsubscribe
    }, [])

    return { passTypes, loading }
}

// One-time seed — creates the 3 starter passes if none exist yet
export async function seedPassTypes() {
    const existing = await getDocs(collection(db, 'passTypes'))
    if (!existing.empty) {
        return { seeded: false, message: 'Pass types already exist — seed skipped.' }
    }

    const starters = [
        {
            key: 'day',
            label: 'Day Pass',
            amount: '25.00',
            duration: 'day',
            order: 0,
            active: true,
            visibility: { mode: 'always' }
        },
        {
            key: 'one_style',
            label: 'Monthly — 1 Style',
            amount: '60.00',
            duration: 'month',
            order: 1,
            active: true,
            visibility: { mode: 'monthlyWindow', windowStartDays: 9, windowEndDays: 5 }
        },
        {
            key: 'both_styles',
            label: 'Monthly — Both Styles',
            amount: '80.00',
            duration: 'month',
            order: 2,
            active: true,
            visibility: { mode: 'monthlyWindow', windowStartDays: 9, windowEndDays: 5 }
        }
    ]

    for (const pass of starters) {
        await addDoc(collection(db, 'passTypes'), pass)
    }

    return { seeded: true, message: 'Seeded 3 starter pass types.' }
}

// Generates a unique key from a label, avoiding collisions with existing keys
export function generatePassKey(label, existingKeys) {
    const base = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
    if (!existingKeys.includes(base)) return base
    let n = 2
    while (existingKeys.includes(`${base}_${n}`)) n++
    return `${base}_${n}`
}

// Creates a new pass type
export async function createPassType(data, existingPasses) {
    const existingKeys = existingPasses.map(p => p.key)
    const key = generatePassKey(data.label, existingKeys)
    const maxOrder = existingPasses.reduce((max, p) => Math.max(max, p.order ?? 0), -1)
    await addDoc(collection(db, 'passTypes'), {
        key,
        label: data.label,
        amount: data.amount,
        duration: data.duration,
        order: maxOrder + 1,
        active: true,
        visibility: data.visibility
    })
}

// Updates an existing pass type (label, amount, duration, visibility, active)
export async function updatePassType(id, data) {
    await updateDoc(doc(db, 'passTypes', id), data)
}