import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, doc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'

// Hook: subscribes to all merch orders, newest first
export function useOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'orders'), orderBy('purchaseDate', 'desc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return unsubscribe
    }, [])

    return { orders, loading }
}

// Marks an order as delivered/picked up
export async function markOrderDelivered(orderId) {
    await updateDoc(doc(db, 'orders', orderId), {
        status: 'delivered',
        deliveredAt: new Date().toISOString()
    })
}