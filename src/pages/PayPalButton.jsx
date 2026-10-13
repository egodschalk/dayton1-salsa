import { useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'
import { usePassTypes, getExpiryDate } from '../hooks/usePassTypes'

const IS_SANDBOX = false

const CLIENT_ID = IS_SANDBOX
    ? 'ATa2uW4F2oDvrxNJ4TxL6hkZ4Zd8nF-K0KTzjZxFQbVhl9CUe1pNznPexU6cgfoLOLxcKWaIBpe2AuDt'
    : 'AVI4LpJe46rQQcObnfSR6qyf9dzp3ypfM9HI4pqp61LZLE5cynC16Z5ASlu73y5ggpX7tQTbE-exYM1l'

// Returns true if saved, false if it failed
async function saveMember(person, pass, transactionId) {
    const now = new Date()
    const expiryDate = getExpiryDate(pass)
    try {
        await addDoc(collection(db, 'members'), {
            firstName: person.firstName,
            lastName: person.lastName,
            phone: person.phone,
            email: person.email || '',
            passType: pass.key,
            passLabel: pass.label,
            amount: pass.amount,
            purchaseDate: now.toISOString(),
            expiryDate,
            originalExpiryDate: expiryDate,
            transactionId,
            isActive: true,
            checkIns: [],
            createdAt: now
        })
        return true
    } catch (error) {
        console.error('Error saving member:', error)
        return false
    }
}

// cart       = [{ id, firstName, lastName, phone, email, passKey }]
// merchItems = [{ productId, productName, size, quantity, unitPrice }]
// buyer      = { name, phone, email }  (pickup contact for merch)
export default function PayPalButton({ cart, merchItems = [], buyer, onSuccess }) {
    const containerRef = useRef(null)
    const { passTypes } = usePassTypes()

    const cartRef = useRef(cart)
    const merchRef = useRef(merchItems)
    const buyerRef = useRef(buyer)
    const onSuccessRef = useRef(onSuccess)
    const passTypesRef = useRef(passTypes)

    useEffect(() => { cartRef.current = cart }, [cart])
    useEffect(() => { merchRef.current = merchItems }, [merchItems])
    useEffect(() => { buyerRef.current = buyer }, [buyer])
    useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
    useEffect(() => { passTypesRef.current = passTypes }, [passTypes])

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }

        function findPass(key) {
            return passTypesRef.current.find(p => p.key === key)
        }

        function renderButtons() {
            if (!window.paypal || !containerRef.current) return

            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    const passLines = cartRef.current.map(person => ({ person, pass: findPass(person.passKey) }))
                    const merch = merchRef.current

                    if (passLines.some(l => !l.pass)) {
                        alert('One of the selected passes is no longer available. Please refresh.')
                        return
                    }
                    if (passLines.length === 0 && merch.length === 0) {
                        alert('Your order is empty.')
                        return
                    }

                    const passItems = passLines.map(l => ({
                        name: `${l.pass.label} - ${l.person.firstName} ${l.person.lastName}`.slice(0, 127),
                        unit_amount: { currency_code: 'USD', value: parseFloat(l.pass.amount).toFixed(2) },
                        quantity: '1',
                        category: 'DIGITAL_GOODS'
                    }))

                    const merchLines = merch.map(item => ({
                        name: `${item.productName} (${item.size})`.slice(0, 127),
                        unit_amount: { currency_code: 'USD', value: parseFloat(item.unitPrice).toFixed(2) },
                        quantity: String(item.quantity),
                        category: 'PHYSICAL_GOODS'
                    }))

                    const allItems = [...passItems, ...merchLines]
                    const totalCents = allItems.reduce(
                        (sum, i) => sum + Math.round(parseFloat(i.unit_amount.value) * 100) * parseInt(i.quantity, 10),
                        0
                    )
                    const total = (totalCents / 100).toFixed(2)

                    return actions.order.create({
                        purchase_units: [{
                            description: 'DaytOn1 Salsa Order',
                            amount: {
                                value: total,
                                currency_code: 'USD',
                                breakdown: {
                                    item_total: { currency_code: 'USD', value: total }
                                }
                            },
                            items: allItems
                        }]
                    })
                },
                onApprove: async (data) => {
                    try {
                        const people = cartRef.current
                        const merch = merchRef.current
                        let transactionId = null
                        let warning = ''
                        let details = null

                        if (merch.length > 0) {
                            // Orders with merch: this function takes the payment, reduces stock, saves the order
                            const res = await fetch('/.netlify/functions/capture-merch-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderID: data.orderID,
                                    items: merch,
                                    buyer: buyerRef.current
                                })
                            })
                            const result = await res.json()
                            if (!res.ok || !result.success) {
                                throw new Error(result.error || 'Payment could not be verified.')
                            }
                            transactionId = result.transactionId || data.orderID
                            warning = result.warning || ''
                            details = { id: transactionId }
                        } else {
                            // Passes only
                            const res = await fetch('/.netlify/functions/capture-order', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderID: data.orderID })
                            })
                            details = await res.json()
                            transactionId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || details?.id
                        }

                        if (!transactionId) {
                            alert('Payment could not be verified. Please try again.')
                            return
                        }

                        if (people.length > 0) {
                            const lines = people.map(person => ({ person, pass: findPass(person.passKey) }))
                            if (lines.some(l => !l.pass)) {
                                alert(`Pass data missing. Please contact the front desk with transaction ID ${transactionId}.`)
                                return
                            }

                            const results = await Promise.all(
                                lines.map(l => saveMember(l.person, l.pass, transactionId))
                            )

                            if (results.some(ok => !ok)) {
                                alert(`Your payment went through, but we had trouble saving a registration. Please show the front desk this transaction ID: ${transactionId}`)
                            }
                        }

                        if (warning) {
                            alert(`Your payment went through, but: ${warning} We will contact you about that part of your order. Transaction ID: ${transactionId}`)
                        }

                        onSuccessRef.current(details)
                    } catch (err) {
                        console.error('Capture failed:', err)
                        alert('Payment was not completed: ' + (err?.message || String(err)))
                    }
                },
                onError: (err) => {
                    console.error('PayPal error:', err)
                    alert('Payment error: ' + (err?.message || String(err)))
                },
                onCancel: () => {
                    alert('Payment cancelled. You can try again when ready.')
                }
            }).render(containerRef.current)
        }

        if (window.paypal) {
            renderButtons()
            return
        }

        const existingScript = document.querySelector(`script[src*="paypal.com/sdk"]`)
        if (existingScript) {
            existingScript.addEventListener('load', renderButtons)
            return
        }

        const script = document.createElement('script')
        script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD&enable-funding=venmo`
        script.async = true
        script.onload = renderButtons
        script.onerror = () => {
            console.error('Failed to load PayPal SDK')
            alert('Could not load payment system. Please refresh and try again.')
        }
        document.body.appendChild(script)

        return () => {
            if (document.body.contains(script)) {
                document.body.removeChild(script)
            }
        }
    }, [])

    return <div ref={containerRef} />
}