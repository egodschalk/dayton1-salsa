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

// cart = [{ id, firstName, lastName, phone, email, passKey }]
export default function PayPalButton({ cart, onSuccess }) {
    const containerRef = useRef(null)
    const { passTypes } = usePassTypes()

    const cartRef = useRef(cart)
    const onSuccessRef = useRef(onSuccess)
    const passTypesRef = useRef(passTypes)

    useEffect(() => { cartRef.current = cart }, [cart])
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
                    const lines = cartRef.current.map(person => ({ person, pass: findPass(person.passKey) }))
                    if (lines.length === 0 || lines.some(l => !l.pass)) {
                        alert('One of the selected passes is no longer available. Please refresh.')
                        return
                    }
                    const total = lines.reduce((sum, l) => sum + parseFloat(l.pass.amount), 0).toFixed(2)
                    return actions.order.create({
                        purchase_units: [{
                            description: 'DaytOn1 Salsa Passes',
                            amount: {
                                value: total,
                                currency_code: 'USD',
                                breakdown: {
                                    item_total: { currency_code: 'USD', value: total }
                                }
                            },
                            items: lines.map(l => ({
                                name: `${l.pass.label} - ${l.person.firstName} ${l.person.lastName}`.slice(0, 127),
                                unit_amount: { currency_code: 'USD', value: parseFloat(l.pass.amount).toFixed(2) },
                                quantity: '1',
                                category: 'DIGITAL_GOODS'
                            }))
                        }]
                    })
                },
                onApprove: async (data) => {
                    try {
                        const res = await fetch('/.netlify/functions/capture-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                orderID: data.orderID,
                                passKeys: cartRef.current.map(p => p.passKey)
                            })
                        })
                        const details = await res.json()

                        if (!res.ok) {
                            alert(details?.error || 'Payment could not be completed. Please try again.')
                            return
                        }

                        const transactionId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || details?.id

                        if (!transactionId) {
                            alert('Payment could not be verified. Please try again.')
                            return
                        }

                        const lines = cartRef.current.map(person => ({ person, pass: findPass(person.passKey) }))
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

                        onSuccessRef.current(details)
                    } catch (err) {
                        console.error('Capture failed:', err)
                        alert('Payment was not completed. Please try again.')
                    }
                },
                onError: (err) => {
                    console.error('PayPal error:', err)
                    alert('Something went wrong with your payment. Please try again.')
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