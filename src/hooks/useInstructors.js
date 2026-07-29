import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore'

// Hook: subscribes to all instructors, sorted by order
export function useInstructors() {
    const [instructors, setInstructors] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'instructors'), orderBy('order', 'asc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setInstructors(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return unsubscribe
    }, [])

    return { instructors, loading }
}

// Adds a new instructor
export async function createInstructor(name, existingInstructors) {
    const maxOrder = existingInstructors.reduce((max, i) => Math.max(max, i.order ?? 0), -1)
    await addDoc(collection(db, 'instructors'), {
        name: name.trim(),
        active: true,
        order: maxOrder + 1
    })
}

// Toggles an instructor active/inactive (soft delete)
export async function setInstructorActive(id, active) {
    await updateDoc(doc(db, 'instructors', id), { active })
}

// One-time seed of the four current instructors, if none exist
export async function seedInstructors() {
    const existing = await getDocs(collection(db, 'instructors'))
    if (!existing.empty) {
        return { seeded: false, message: 'Instructors already exist — seed skipped.' }
    }
    const names = ['Heather Sommer', 'David Sommer', 'Ricky RJ Williams', 'Brian Lugo']
    for (let i = 0; i < names.length; i++) {
        await addDoc(collection(db, 'instructors'), {
            name: names[i],
            active: true,
            order: i
        })
    }
    return { seeded: true, message: 'Seeded 4 instructors.' }
}