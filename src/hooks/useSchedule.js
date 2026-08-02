import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'

const SCHEDULE_DOC = doc(db, 'scheduleInfo', 'current')

export function useSchedule() {
    const [schedule, setSchedule] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onSnapshot(SCHEDULE_DOC, (snap) => {
            if (snap.exists()) {
                setSchedule(snap.data())
            } else {
                setSchedule(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    return { schedule, loading }
}

export async function saveSchedule(data) {
    await setDoc(SCHEDULE_DOC, data)
}

// Starter schedule — only used the first time owner saves
export const defaultSchedule = {
    month: 'August',
    dayName: 'Mondays',
    datesList: 'Aug 3, 10, 17, 24',
    cancellationNote: '(No classes Aug 31)',
    specialEvents: [
        { id: '1', title: 'August 24th', description: 'Social 8:30 - 10:30 PM' }
    ]
}