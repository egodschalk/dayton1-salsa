import { useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'
import { usePassTypes, getExpiryDate } from '../hooks/usePassTypes'

const IS_SANDBOX = false

const CLIENT_ID = IS_SANDBOX
    ? 'ATa2uW4F2oDvrxNJ4TxL6hkZ4Zd8nF-K0KTzjZxFQbVhl9CUe1pNznPexU6cgfoLOLxcKWaIBpe2AuDt'
    : 'AVI4LpJe46rQQcObnfSR6qyf9dzp3ypfM9HI4pqp61LZLE5cynC16Z5ASlu73y5ggpX7tQTbE-exYM1l'

async function saveMember(formData, pass, transactionId) {
    const now = new Date()
    const expiryDate = getExpiryDate(pass)
    try {
        await addDoc(collection(db, 'members'), {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email || '',
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
        console.log('Member saved to Firebase!')
    } catch (error) {
        console.error('Error saving member:', error)
    }
}

export default function PayPalButton({ selectedPass, formData, onSuccess }) {
    const containerRef = useRef(null)
    const { passTypes } = usePassTypes()

    const formDataRef = useRef(formData)
    const onSuccessRef = useRef(onSuccess)
    const selectedPassRef = useRef(selectedPass)
    const passTypesRef = useRef(passTypes)

    useEffect(() => { formDataRef.current = formData }, [formData])
    useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
    useEffect(() => { selectedPassRef.current = selectedPass }, [selectedPass])
    useEffect(() => { passTypesRef.current = passTypes }, [passTypes])

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }

        function findPass() {
            return passTypesRef.current.find(p => p.key === selectedPassRef.current)
        }

        function renderButtons() {
            if (!window.paypal || !containerRef.current) return

            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    const pass = findPass()
                    if (!pass) {
                        alert('Selected pass is no longer available. Please refresh.')
                        return
                    }
                    return actions.order.create({
                        purchase_units: [{
                            amount: { value: pass.amount },
                            description: pass.label
                        }]
                    })
                },
                onApprove: async (data) => {
                    try {
                        const res = await fetch('/.netlify/functions/capture-order', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderID: data.orderID })
                        })
                        const details = await res.json()

                        const transactionId = details?.purchase_units?.[0]?.payments?.captures?.[0]?.id || details?.id

                        if (!transactionId) {
                            alert('Payment could not be verified. Please try again.')
                            return
                        }

                        const pass = findPass()
                        if (!pass) {
                            alert('Pass data missing. Please contact the front desk.')
                            return
                        }

                        await saveMember(formDataRef.current, pass, transactionId)
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