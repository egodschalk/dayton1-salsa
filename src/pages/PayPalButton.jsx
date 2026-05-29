import { useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, addDoc } from 'firebase/firestore'

const IS_SANDBOX = false

const CLIENT_ID = IS_SANDBOX
    ? 'ATa2uW4F2oDvrxNJ4TxL6hkZ4Zd8nF-K0KTzjZxFQbVhl9CUe1pNznPexU6cgfoLOLxcKWaIBpe2AuDt'
    : 'AVI4LpJe46rQQcObnfSR6qyf9dzp3ypfM9HI4pqp61LZLE5cynC16Z5ASlu73y5ggpX7tQTbE-exYM1l'

const PASS_AMOUNTS = {
    day: '25.00',
    one_style: '60.00',
    both_styles: '80.00'
}

const PASS_LABELS = {
    day: 'Day Pass — $25',
    one_style: 'Monthly 1 Style — $60',
    both_styles: 'Monthly Both Styles — $80'
}

function getExpiryDate(passType) {
    const now = new Date()
    if (passType === 'day') {
        const expiry = new Date(now)
        expiry.setMonth(expiry.getMonth() + 3)
        return expiry.toISOString()
    }
    const expiry = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return expiry.toISOString()
}

async function saveMember(formData, selectedPass, transactionId) {
    const now = new Date()
    const expiryDate = getExpiryDate(selectedPass)
    try {
        await addDoc(collection(db, 'members'), {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            email: formData.email || '',
            passType: selectedPass,
            passLabel: PASS_LABELS[selectedPass],
            amount: PASS_AMOUNTS[selectedPass],
            purchaseDate: now.toISOString(),
            expiryDate,
            originalExpiryDate: expiryDate,
            transactionId,
            isActive: true,
            checkedIn: false,
            createdAt: now
        })
        console.log('Member saved to Firebase!')
    } catch (error) {
        console.error('Error saving member:', error)
    }
}

export default function PayPalButton({ selectedPass, formData, onSuccess }) {
    const containerRef = useRef(null)

    const formDataRef = useRef(formData)
    const onSuccessRef = useRef(onSuccess)
    const selectedPassRef = useRef(selectedPass)

    useEffect(() => { formDataRef.current = formData }, [formData])
    useEffect(() => { onSuccessRef.current = onSuccess }, [onSuccess])
    useEffect(() => { selectedPassRef.current = selectedPass }, [selectedPass])

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.innerHTML = ''
        }

        function renderButtons() {
            if (!window.paypal || !containerRef.current) return

            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: { value: PASS_AMOUNTS[selectedPassRef.current] },
                            description: PASS_LABELS[selectedPassRef.current]
                        }]
                    })
                },
                onApprove: (data, actions) => {
                    return actions.order.capture()
                        .then(async (details) => {
                            if (!details?.id) {
                                alert('Payment could not be verified. Please try again.')
                                return
                            }
                            await saveMember(formDataRef.current, selectedPassRef.current, details.id)
                            onSuccessRef.current(details)
                        })
                        .catch((err) => {
                            console.error('Capture failed:', err)
                            alert('Payment was not completed. Please try again.')
                        })
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
        script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD&enable-funding=venmo&buyer-country=US`
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