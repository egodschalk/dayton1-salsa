import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore'

// Hook: subscribes to all invoices, newest first (for owner portal list)
export function useInvoices() {
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setInvoices(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return unsubscribe
    }, [])

    return { invoices, loading }
}

// One-time fetch of a single invoice by ID (for the public payment page)
export async function getInvoice(invoiceId) {
    const snap = await getDoc(doc(db, 'invoices', invoiceId))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() }
}

// Creates a new invoice
export async function createInvoice(data) {
    const docRef = await addDoc(collection(db, 'invoices'), {
        companyName: data.companyName,
        contactName: data.contactName || '',
        contactEmail: data.contactEmail || '',
        description: data.description,
        amount: data.amount,
        eventDate: data.eventDate || '',
        status: 'unpaid',
        transactionId: null,
        paidAt: null,
        createdAt: new Date().toISOString()
    })
    return docRef.id
}

// Owner can edit an unpaid invoice's details
export async function updateInvoice(invoiceId, data) {
    await updateDoc(doc(db, 'invoices', invoiceId), data)
}