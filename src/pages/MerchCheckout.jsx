import { useState, useRef } from 'react'

const CLIENT_ID = 'AVI4LpJe46rQQcObnfSR6qyf9dzp3ypfM9HI4pqp61LZLE5cynC16Z5ASlu73y5ggpX7tQTbE-exYM1l'

export default function MerchCheckout({ products }) {
    const [cart, setCart] = useState([]) // [{ productId, productName, size, quantity, unitPrice }]
    const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '')
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedQty, setSelectedQty] = useState(1)
    const [addError, setAddError] = useState('')

    const [buyer, setBuyer] = useState({ name: '', phone: '', email: '' })
    const [buyerErrors, setBuyerErrors] = useState({})
    const [showCheckout, setShowCheckout] = useState(false)
    const [paying, setPaying] = useState(false)
    const [payError, setPayError] = useState('')
    const [orderComplete, setOrderComplete] = useState(false)

    const containerRef = useRef(null)
    const cartRef = useRef(cart)
    const buyerRef = useRef(buyer)
    cartRef.current = cart
    buyerRef.current = buyer

    const selectedProduct = products.find(p => p.id === selectedProductId)
    const availableSizes = (selectedProduct?.variants || []).filter(v => v.stock > 0)

    function addToCart() {
        if (!selectedProduct) return
        if (!selectedSize) { setAddError('Please select a size.'); return }
        const variant = selectedProduct.variants.find(v => v.size === selectedSize)
        const alreadyInCart = cart
            .filter(c => c.productId === selectedProduct.id && c.size === selectedSize)
            .reduce((sum, c) => sum + c.quantity, 0)
        if (!variant || variant.stock < alreadyInCart + selectedQty) {
            setAddError(`Only ${variant ? variant.stock - alreadyInCart : 0} left in that size.`)
            return
        }
        setAddError('')

        setCart(prev => {
            const existingIndex = prev.findIndex(c => c.productId === selectedProduct.id && c.size === selectedSize)
            if (existingIndex >= 0) {
                const updated = [...prev]
                updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + selectedQty }
                return updated
            }
            return [...prev, {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                size: selectedSize,
                quantity: selectedQty,
                unitPrice: selectedProduct.price
            }]
        })
        setSelectedSize('')
        setSelectedQty(1)
    }

    function removeFromCart(index) {
        setCart(prev => prev.filter((_, i) => i !== index))
    }

    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0)

    function validateBuyer() {
        const errs = {}
        if (!buyer.name.trim()) errs.name = 'Name is required'
        if (!buyer.phone.trim()) errs.phone = 'Phone number is required'
        if (buyer.phone.length < 10) errs.phone = 'Please enter a valid 10 digit phone number'
        return errs
    }

    function handleProceedToPay() {
        if (cart.length === 0) { setAddError('Add at least one item to your order.'); return }
        const errs = validateBuyer()
        if (Object.keys(errs).length > 0) { setBuyerErrors(errs); return }
        setBuyerErrors({})
        setShowCheckout(true)
    }

    // Render PayPal button once checkout is shown
    function ensurePayPalLoaded(onReady) {
        if (window.paypal) { onReady(); return }
        const existingScript = document.querySelector(`script[src*="paypal.com/sdk"]`)
        if (existingScript) {
            existingScript.addEventListener('load', onReady)
            return
        }
        const script = document.createElement('script')
        script.src = `https://www.paypal.com/sdk/js?client-id=${CLIENT_ID}&currency=USD`
        script.async = true
        script.onload = onReady
        script.onerror = () => setPayError('Could not load payment system. Please refresh and try again.')
        document.body.appendChild(script)
    }

    function renderPayPalButtons() {
        if (!window.paypal || !containerRef.current) return
        containerRef.current.innerHTML = ''

        window.paypal.Buttons({
            createOrder: (data, actions) => {
                const total = cartRef.current.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0)
                return actions.order.create({
                    purchase_units: [{
                        description: 'DaytOn1 Salsa Merch Order',
                        amount: {
                            value: total.toFixed(2),
                            currency_code: 'USD',
                            breakdown: {
                                item_total: { currency_code: 'USD', value: total.toFixed(2) }
                            }
                        },
                        items: cartRef.current.map(item => ({
                            name: `${item.productName} (${item.size})`.slice(0, 127),
                            unit_amount: { currency_code: 'USD', value: item.unitPrice },
                            quantity: String(item.quantity),
                            category: 'PHYSICAL_GOODS'
                        }))
                    }]
                })
            },
            onApprove: async (data) => {
                setPaying(true)
                setPayError('')
                try {
                    const res = await fetch('/.netlify/functions/capture-merch-order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            orderID: data.orderID,
                            items: cartRef.current,
                            buyer: buyerRef.current
                        })
                    })
                    const result = await res.json()
                    if (!res.ok || !result.success) {
                        throw new Error(result.error || 'Payment could not be verified.')
                    }
                    setOrderComplete(true)
                } catch (err) {
                    console.error('Merch order capture failed:', err)
                    setPayError(err.message || 'Payment was not completed. Please try again.')
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

    function handleShowCheckoutButtons(node) {
        containerRef.current = node
        if (node) {
            ensurePayPalLoaded(renderPayPalButtons)
        }
    }

    function resetOrder() {
        setCart([])
        setBuyer({ name: '', phone: '', email: '' })
        setShowCheckout(false)
        setOrderComplete(false)
        setPayError('')
    }

    if (orderComplete) {
        return (
            <div className='merch-checkout-confirmation'>
                <div className='confirmation-icon'>✓</div>
                <h3>Order Placed!</h3>
                <p className='confirmation-message'>
                    Thanks, {buyer.name}! Your order is confirmed. We'll have it ready for pickup at class.
                </p>
                <button className='continue-btn' onClick={resetOrder}>Place Another Order</button>
            </div>
        )
    }

    return (
        <div className='merch-checkout'>
            {!showCheckout ? (
                <>
                    <div className='merch-picker'>
                        <div className='form-group'>
                            <label>Item</label>
                            <select
                                value={selectedProductId}
                                onChange={e => { setSelectedProductId(e.target.value); setSelectedSize(''); setAddError('') }}
                            >
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
                                ))}
                            </select>
                        </div>

                        <div className='form-group'>
                            <label>Size</label>
                            {availableSizes.length === 0 ? (
                                <p className='monthly-unavailable'>Out of stock in all sizes.</p>
                            ) : (
                                <div className='pass-options merch-size-options'>
                                    {availableSizes.map(v => (
                                        <div
                                            key={v.size}
                                            className={`pass-option ${selectedSize === v.size ? 'selected' : ''}`}
                                            onClick={() => { setSelectedSize(v.size); setAddError('') }}
                                        >
                                            <p>{v.size}</p>
                                            <p>{v.stock} left</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className='form-group merch-qty-group'>
                            <label>Quantity</label>
                            <div className='merch-qty-stepper'>
                                <button type='button' onClick={() => setSelectedQty(q => Math.max(1, q - 1))}>−</button>
                                <span>{selectedQty}</span>
                                <button type='button' onClick={() => setSelectedQty(q => q + 1)}>+</button>
                            </div>
                        </div>

                        {addError && <span className='form-error'>{addError}</span>}

                        <button className='continue-btn' onClick={addToCart} disabled={availableSizes.length === 0}>
                            Add to Order
                        </button>
                    </div>

                    {cart.length > 0 && (
                        <div className='merch-cart'>
                            <h4>Your Order</h4>
                            {cart.map((item, i) => (
                                <div key={i} className='merch-cart-row'>
                                    <span>{item.quantity}x {item.productName} ({item.size})</span>
                                    <span>${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
                                    <button className='merch-remove-btn' onClick={() => removeFromCart(i)}>Remove</button>
                                </div>
                            ))}
                            <div className='merch-cart-total'>
                                <span>Total</span>
                                <span>${cartTotal.toFixed(2)}</span>
                            </div>
                        </div>
                    )}

                    {cart.length > 0 && (
                        <div className='checkout-form merch-buyer-form'>
                            <div className='form-group'>
                                <label>Name</label>
                                <input
                                    type='text'
                                    value={buyer.name}
                                    onChange={e => { setBuyer({ ...buyer, name: e.target.value }); setBuyerErrors({ ...buyerErrors, name: '' }) }}
                                    placeholder='Full name'
                                />
                                {buyerErrors.name && <span className='form-error'>{buyerErrors.name}</span>}
                            </div>
                            <div className='form-group'>
                                <label>Phone Number</label>
                                <input
                                    type='tel'
                                    value={buyer.phone}
                                    onChange={e => {
                                        const value = e.target.value.replace(/[^0-9]/g, '')
                                        setBuyer({ ...buyer, phone: value })
                                        setBuyerErrors({ ...buyerErrors, phone: '' })
                                    }}
                                    placeholder='Phone number'
                                    maxLength={10}
                                />
                                {buyerErrors.phone && <span className='form-error'>{buyerErrors.phone}</span>}
                            </div>
                            <div className='form-group'>
                                <label>Email (optional)</label>
                                <input
                                    type='email'
                                    value={buyer.email}
                                    onChange={e => setBuyer({ ...buyer, email: e.target.value })}
                                    placeholder='Email address'
                                />
                            </div>
                            <button className='continue-btn' onClick={handleProceedToPay}>
                                Continue to Payment
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className='checkout-payment'>
                    <h3>Complete Your Payment</h3>
                    <div className='checkout-summary'>
                        {cart.map((item, i) => (
                            <p key={i}><strong>{item.quantity}x {item.productName} ({item.size}):</strong> ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</p>
                        ))}
                        <p><strong>Total:</strong> ${cartTotal.toFixed(2)}</p>
                        <p><strong>Name:</strong> {buyer.name}</p>
                        <p><strong>Phone:</strong> {buyer.phone}</p>
                    </div>
                    {paying && <p className='invoice-processing'>Processing payment...</p>}
                    {payError && <p className='form-error'>{payError}</p>}
                    <div ref={handleShowCheckoutButtons} />
                    <button className='back-btn' onClick={() => setShowCheckout(false)}>Go Back</button>
                </div>
            )}
        </div>
    )
}