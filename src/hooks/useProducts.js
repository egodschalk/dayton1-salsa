import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, doc, addDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore'

// Hook: subscribes to all products, sorted by order
export function useProducts() {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const q = query(collection(db, 'products'), orderBy('order', 'asc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        })
        return unsubscribe
    }, [])

    return { products, loading }
}

// Creates a new product with its size variants
export async function createProduct(data, existingProducts) {
    const maxOrder = existingProducts.reduce((max, p) => Math.max(max, p.order ?? 0), -1)
    await addDoc(collection(db, 'products'), {
        name: data.name,
        price: data.price,
        active: true,
        order: maxOrder + 1,
        variants: data.variants // [{ size: 'S', stock: 4 }, ...]
    })
}

// Updates a product's details (name, price, variants/stock, active)
export async function updateProduct(id, data) {
    await updateDoc(doc(db, 'products', id), data)
}