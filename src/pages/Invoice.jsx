import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { getInvoice } from '../hooks/useInvoices'
import './Invoice.css'

const CLIENT_ID = 'AVI4LpJe46rQQcObnfSR6qyf9dzp3ypfM9HI4pqp61LZLE5cynC16Z5ASlu73y5ggpX7tQTbE-exYM1l'

export default function Invoice() {
    const { invoiceId } = useParams()
    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const [paid, setPaid] = useState(false)
    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState('')
    const containerRef = useRef(null)
    const invoiceRef = useRef(null)

    useEffect(() => {
        invoiceRef.current = invoice
    }, [invoice])

    useEffect(() => {
        getInvoice(invoiceId)
            .then(inv => {
                if (!inv) {
                    setNotFound(true)
                } else {
                    setInvoice(inv)
                    if (inv.status === 'paid') setPaid(true)
                }
                setLoading(false)
            })
            .catch(() => {
                setNotFound(true)
                setLoading(false)
            })
    }, [invoiceId])

    // Render PayPal button once invoice is loaded and unpaid
    useEffect(() => {
        if (!invoice || paid || !containerRef.current) return

        function renderButtons() {
            if (!window.paypal || !containerRef.current) return
            containerRef.current.innerHTML = ''

            window.paypal.Buttons({
                createOrder: (data, actions) => {
                    const inv = invoiceRef.current
                    const amount = parseFloat(inv.amount).toFixed(2)

                    return actions.order.create({
                        purchase_units: [{
                            reference_id: invoiceId,
                            invoice_id: `INV-${invoiceId.slice(0, 8).toUpperCase()}`,
                            description: `${inv.companyName} — ${inv.description}`.slice(0, 127),
                            custom_id: inv.companyName?.slice(0, 127),
                            soft_descriptor: 'DAYTON1 SALSA',
                            amount: {
                                value: amount,
                                currency_code: 'USD',
                                breakdown: {
                                    item_total: { currency_code: 'USD', value: amount },
                                    tax_total: { currency_code: 'USD', value: '0.00' }
                                }
                            },
                            items: [
                                {
                                    name: (inv.description || 'Event Services').slice(0, 127),
                                    description: `Private event booking for ${inv.companyName}`.slice(0, 127),
                                    unit_amount: { currency_code: 'USD', value: amount },
                                    quantity: '1',
                                    category: 'DIGITAL_GOODS'
                                }
                            ]
                        }]
                    })
                },
                onApprove: async (data) => {
                    setPaying(true)
                    setPayError('')
                    try {
                        const res = await fetch('/.netlify/functions/capture-invoice', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderID: data.orderID, invoiceId })
                        })
                        const result = await res.json()
                        if (!res.ok || !result.success) {
                            throw new Error(result.error || 'Payment could not be verified.')
                        }
                        setPaid(true)
                    } catch (err) {
                        console.error('Invoice capture failed:', err)
                        setPayError('Payment was not completed. Please try again or contact us directly.')
                    }
                    setPaying(false)
                },
                onError: (err) => {
                    console.error('PayPal error:', err)
                    setPayError('Something went wrong with your payment. Please try again.')
                },
                onCancel: () => {
                    setPayError('Payment cancelled. You can try again when ready.')
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
        script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD`
        script.async = true
        script.onload = renderButtons
        script.onerror = () => setPayError('Could not load payment system. Please refresh and try again.')
        document.body.appendChild(script)
    }, [invoice, paid, invoiceId])

    function formatDate(dateString) {
        return new Date(dateString + 'T12:00:00').toLocaleDateString()
    }

    if (loading) {
        return (
            <div className='invoice-page'>
                <div className='invoice-card'>
                    <p>Loading invoice...</p>
                </div>
            </div>
        )
    }

    if (notFound) {
        return (
            <div className='invoice-page'>
                <div className='invoice-card'>
                    <h2>Invoice Not Found</h2>
                    <p>This invoice link is invalid or has been removed. Please contact DaytOn1 Salsa directly.</p>
                </div>
            </div>
        )
    }

    return (
        <div className='invoice-page'>
            <div className='invoice-card'>
                <div className='invoice-header'>
                    <h1>DaytOn1 Salsa</h1>
                    <p className='invoice-subtitle'>Invoice</p>
                </div>

                <div className='invoice-details'>
                    <div className='invoice-row'>
                        <span>Billed To</span>
                        <span>{invoice.companyName}</span>
                    </div>
                    {invoice.companyAddress && (
                        <div className='invoice-row'>
                            <span>Address</span>
                            <span>{invoice.companyAddress}</span>
                        </div>
                    )}
                    {invoice.contactName && (
                        <div className='invoice-row'>
                            <span>Contact</span>
                            <span>{invoice.contactName}</span>
                        </div>
                    )}
                    <div className='invoice-row'>
                        <span>Description</span>
                        <span>{invoice.description}</span>
                    </div>
                    {invoice.eventDate && (
                        <div className='invoice-row'>
                            <span>Event Date</span>
                            <span>{formatDate(invoice.eventDate)}</span>
                        </div>
                    )}
                    <div className='invoice-row invoice-amount-row'>
                        <span>Amount Due</span>
                        <span className='invoice-amount'>${invoice.amount}</span>
                    </div>
                </div>

                {paid ? (
                    <div className='invoice-paid-block'>
                        <div className='invoice-paid-icon'>✓</div>
                        <h3>Payment Received</h3>
                        <p>Thank you! This invoice has been paid in full.</p>
                    </div>
                ) : (
                    <div className='invoice-payment-block'>
                        {paying && <p className='invoice-processing'>Processing payment...</p>}
                        {payError && <p className='invoice-error'>{payError}</p>}
                        <div ref={containerRef} />
                    </div>
                )}
            </div>
        </div>
    )
}