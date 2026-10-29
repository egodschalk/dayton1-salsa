import './Classes.css'
import { useState } from 'react'
import classesPagePic from '../assets/tim-teaching.png'
import level1 from '../assets/noel-1.png'
import level2 from '../assets/group-2.png'
import level3 from '../assets/rj-teaching.png'
import PayPalButton from './PayPalButton'
import { usePassTypes, isPassVisible, getExpiryDate } from '../hooks/usePassTypes'
import { useSchedule } from '../hooks/useSchedule'
import { useProducts } from '../hooks/useProducts'

const emptyPerson = { firstName: '', lastName: '', phone: '', email: '' }
const emptyPickup = { name: '', phone: '', email: '' }

export default function Classes() {
    const { passTypes } = usePassTypes()
    const { schedule, loading: scheduleLoading } = useSchedule()
    const { products } = useProducts()
    const [step, setStep] = useState(1)
    const [tab, setTab] = useState('passes')
    const [selectedPass, setSelectedPass] = useState(null)
    const [formData, setFormData] = useState(emptyPerson)
    const [showEmail, setShowEmail] = useState(false)
    const [cart, setCart] = useState([]) // [{ id, firstName, lastName, phone, email, passKey }]
    const [errors, setErrors] = useState({})
    const [orderError, setOrderError] = useState('')
    const [justAdded, setJustAdded] = useState('')
    const [paymentDetails, setPaymentDetails] = useState(null)

    // Merch
    const [merchCart, setMerchCart] = useState([]) // [{ productId, productName, size, quantity, unitPrice }]
    const [selectedProductId, setSelectedProductId] = useState('')
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedQty, setSelectedQty] = useState(1)
    const [merchError, setMerchError] = useState('')
    const [pickup, setPickup] = useState(emptyPickup)
    const [pickupErrors, setPickupErrors] = useState({})

    const visiblePasses = passTypes.filter(p => isPassVisible(p))
    const activeProducts = products.filter(p => p.active)

    const currentProductId = selectedProductId || activeProducts[0]?.id || ''
    const selectedProduct = activeProducts.find(p => p.id === currentProductId)

    // Fallback values while schedule loads or if doc doesn't exist yet
    const month = schedule?.month || 'August'
    const dayName = schedule?.dayName || 'Mondays'
    const datesList = schedule?.datesList || 'Aug 3, 10, 17, 24'
    const cancellationNote = schedule?.cancellationNote || ''
    const announcement = schedule?.announcement || ''
    const specialEvents = schedule?.specialEvents || []

    function passFor(key) {
        return passTypes.find(p => p.key === key)
    }

    const passTotal = cart.reduce((sum, item) => sum + (parseFloat(passFor(item.passKey)?.amount) || 0), 0)
    const merchTotal = merchCart.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0)
    const orderTotal = Math.round((passTotal + merchTotal) * 100) / 100
    const merchCount = merchCart.reduce((sum, item) => sum + item.quantity, 0)
    const hasOrder = cart.length > 0 || merchCart.length > 0

    // Pickup contact for merch: first person in the order, or the pickup fields if there are no passes
    const buyer = cart.length > 0
        ? { name: `${cart[0].firstName} ${cart[0].lastName}`, phone: cart[0].phone, email: cart[0].email }
        : { name: pickup.name.trim(), phone: pickup.phone, email: pickup.email.trim() }

    function formatExpiry(pass) {
        if (!pass) return ''
        return new Date(getExpiryDate(pass)).toLocaleDateString()
    }

    function flashAdded(text) {
        setJustAdded(text)
        setTimeout(() => setJustAdded(''), 4000)
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    function validate() {
        const newErrors = {}
        if (!formData.firstName.trim()) newErrors.firstName = 'Required'
        if (!formData.lastName.trim()) newErrors.lastName = 'Required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
        else if (formData.phone.length < 10) newErrors.phone = 'Enter a valid 10 digit phone number'
        if (!selectedPass) newErrors.selectedPass = 'Please choose a pass'
        return newErrors
    }

    function formIsBlank() {
        return !formData.firstName.trim() && !formData.lastName.trim() &&
            !formData.phone.trim() && !formData.email.trim() && !selectedPass
    }

    function buildCartItem() {
        return {
            id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            phone: formData.phone,
            email: formData.email.trim(),
            passKey: selectedPass
        }
    }

    function resetForm() {
        setFormData(emptyPerson)
        setSelectedPass(null)
        setShowEmail(false)
        setErrors({})
    }

    function handleAddToOrder() {
        const newErrors = validate()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        const item = buildCartItem()
        setCart([...cart, item])
        setOrderError('')
        flashAdded(`${item.firstName} ${item.lastName}`)
        resetForm()
    }

    function removeFromCart(id) {
        setCart(cart.filter(item => item.id !== id))
    }

    // ===== Merch =====
    function addMerch() {
        if (!selectedProduct) return
        if (!selectedSize) { setMerchError('Please choose a size.'); return }
        const variant = (selectedProduct.variants || []).find(v => v.size === selectedSize)
        const alreadyInCart = merchCart
            .filter(c => c.productId === selectedProduct.id && c.size === selectedSize)
            .reduce((sum, c) => sum + c.quantity, 0)
        if (!variant || variant.stock < alreadyInCart + selectedQty) {
            setMerchError(`Only ${variant ? Math.max(0, variant.stock - alreadyInCart) : 0} left in that size.`)
            return
        }
        setMerchError('')
        setOrderError('')

        setMerchCart(prev => {
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
        flashAdded(`${selectedQty}× ${selectedProduct.name} (${selectedSize})`)
        setSelectedSize('')
        setSelectedQty(1)
    }

    function removeMerch(index) {
        setMerchCart(prev => prev.filter((_, i) => i !== index))
    }

    function handleContinue() {
        let nextCart = cart

        // If a person is filled in but not added yet, add them automatically
        if (!formIsBlank()) {
            const newErrors = validate()
            if (Object.keys(newErrors).length > 0) {
                setTab('passes')
                setErrors(newErrors)
                return
            }
            nextCart = [...cart, buildCartItem()]
            setCart(nextCart)
            resetForm()
        }

        if (nextCart.length === 0 && merchCart.length === 0) {
            setOrderError('Add a pass or some merch to your order first.')
            return
        }

        // Merch only: we need a name and phone for pickup
        if (nextCart.length === 0 && merchCart.length > 0) {
            const pe = {}
            if (!pickup.name.trim()) pe.name = 'Name is required'
            if (!pickup.phone.trim()) pe.phone = 'Phone number is required'
            else if (pickup.phone.length < 10) pe.phone = 'Enter a valid 10 digit phone number'
            if (Object.keys(pe).length > 0) {
                setPickupErrors(pe)
                return
            }
        }

        setOrderError('')
        setStep(2)
    }

    function handlePaymentSuccess(details) {
        if (!details || !details.id) {
            alert('Payment could not be verified. Please try again.')
            return
        }
        setPaymentDetails(details)
        setStep(3)
    }

    function startOver() {
        setStep(1)
        setTab('passes')
        setCart([])
        setMerchCart([])
        resetForm()
        setPickup(emptyPickup)
        setPickupErrors({})
        setMerchError('')
        setOrderError('')
        setSelectedSize('')
        setSelectedQty(1)
        setPaymentDetails(null)
    }

    // One line per item. showRemove = editable list, detailed = review/confirmation view
    function renderLines(showRemove, detailed) {
        return (
            <div className='co-lines'>
                {cart.map(item => {
                    const pass = passFor(item.passKey)
                    return (
                        <div key={item.id} className='co-line'>
                            <div className='co-line-main'>
                                <span className='co-line-title'>{item.firstName} {item.lastName}</span>
                                <span className='co-line-sub'>{pass ? pass.label : 'Pass unavailable'}</span>
                                {detailed && (
                                    <span className='co-line-sub'>
                                        {item.phone}{item.email ? ` · ${item.email}` : ''}
                                    </span>
                                )}
                                {detailed && pass && (
                                    <span className='co-line-sub'>Valid until {formatExpiry(pass)}</span>
                                )}
                            </div>
                            <span className='co-line-price'>${pass ? pass.amount : '—'}</span>
                            {showRemove && (
                                <button type='button' className='co-x' aria-label='Remove' onClick={() => removeFromCart(item.id)}>×</button>
                            )}
                        </div>
                    )
                })}
                {merchCart.map((item, i) => (
                    <div key={`m${i}`} className='co-line'>
                        <div className='co-line-main'>
                            <span className='co-line-title'>{item.quantity}× {item.productName}</span>
                            <span className='co-line-sub'>Size {item.size} · pickup at class</span>
                        </div>
                        <span className='co-line-price'>${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</span>
                        {showRemove && (
                            <button type='button' className='co-x' aria-label='Remove' onClick={() => removeMerch(i)}>×</button>
                        )}
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="classes-page">
            <div className='classes-content'>
                <div className='classes-location'>
                    <h3>NEW Location</h3>
                    <p>On Par Entertainment</p>
                    <p>4464 Indian Ripple Rd</p>
                    <p>Beavercreek, OH 45440</p>
                </div>
                <div className='classes-schedules'>
                    <div className='classes-schedule-section'>
                        <div className='days'>
                            <h3>{dayName}</h3>
                            <p>{datesList}</p>
                            {cancellationNote && <p>{cancellationNote}</p>}
                            {announcement && <p className='classes-announcement'>🔔 {announcement}</p>}
                        </div>
                        <div className='class-schedule'>
                            <h3>Class Schedule</h3>
                            <div className='schedule'>
                                <div className='times'>
                                    <p>6:30</p>
                                    <p>7:25</p>
                                    <p>7:45</p>
                                </div>
                                <div className='classes'>
                                    <p>Bachata (all levels)</p>
                                    <p>Social Dancing</p>
                                    <p>Salsa (all levels)</p>
                                </div>
                            </div>
                            {specialEvents.map(event => (
                                <div key={event.id} className='class-schedule special-event'>
                                    <h3>🔔 {event.title}</h3>
                                    <p className='special-event-desc'>{event.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className='team-info'></div>
                </div>
            </div>

            <div className='classes-membership-section'>
                <div className='classes-rates'>
                    <h3>Monthly Rates:</h3>
                    <h4>{month}</h4>
                    <p>We offer classes in monthly cycles</p>
                    <div className='rates'>
                        {passTypes.filter(p => p.active).map(pass => (
                            <div className='rate-row' key={pass.id}>
                                <span className='rate-label'>{pass.label}:</span>
                                <span className='rate-price'>${pass.amount}</span>
                            </div>
                        ))}
                    </div>

                    <div className='classes-paypal' id='register'>
                        {step === 1 && (
                            <div className='checkout-form co'>
                                <h3>Register & Pay</h3>

                                {activeProducts.length > 0 && (
                                    <div className='co-tabs'>
                                        <button
                                            type='button'
                                            className={`co-tab ${tab === 'passes' ? 'active' : ''}`}
                                            onClick={() => setTab('passes')}
                                        >
                                            Class Passes
                                            {cart.length > 0 && <span className='co-badge'>{cart.length}</span>}
                                        </button>
                                        <button
                                            type='button'
                                            className={`co-tab ${tab === 'merch' ? 'active' : ''}`}
                                            onClick={() => setTab('merch')}
                                        >
                                            Merch
                                            {merchCount > 0 && <span className='co-badge'>{merchCount}</span>}
                                        </button>
                                    </div>
                                )}

                                {tab === 'passes' && (
                                    <div className='co-panel'>
                                        <div className='co-step'>1 · Choose a pass</div>
                                        {visiblePasses.length === 0 ? (
                                            <span className='monthly-unavailable'>
                                                No passes are available right now. Please check back soon or see the front desk.
                                            </span>
                                        ) : (
                                            <div className='co-pass-grid'>
                                                {visiblePasses.map(pass => (
                                                    <button
                                                        type='button'
                                                        key={pass.id}
                                                        className={`co-pass-card ${selectedPass === pass.key ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSelectedPass(pass.key)
                                                            setErrors({ ...errors, selectedPass: '' })
                                                        }}
                                                    >
                                                        <span className='co-pass-name'>{pass.label}</span>
                                                        <span className='co-pass-meta'>{pass.duration === 'day' ? 'Single visit' : 'Monthly'}</span>
                                                        <span className='co-pass-price'>${pass.amount}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {errors.selectedPass && <span className='form-error'>{errors.selectedPass}</span>}

                                        <div className='co-step'>2 · Who is it for?</div>
                                        <div className='co-row'>
                                            <div className='co-field'>
                                                <label>First name</label>
                                                <input
                                                    type='text'
                                                    name='firstName'
                                                    value={formData.firstName}
                                                    onChange={handleChange}
                                                    placeholder='First'
                                                />
                                                {errors.firstName && <span className='form-error'>{errors.firstName}</span>}
                                            </div>
                                            <div className='co-field'>
                                                <label>Last name</label>
                                                <input
                                                    type='text'
                                                    name='lastName'
                                                    value={formData.lastName}
                                                    onChange={handleChange}
                                                    placeholder='Last'
                                                />
                                                {errors.lastName && <span className='form-error'>{errors.lastName}</span>}
                                            </div>
                                        </div>
                                        <div className='co-field'>
                                            <label>Phone number</label>
                                            <input
                                                type='tel'
                                                name='phone'
                                                value={formData.phone}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                                    setFormData({ ...formData, phone: value })
                                                    setErrors({ ...errors, phone: '' })
                                                }}
                                                placeholder='10 digit phone number'
                                                maxLength={10}
                                            />
                                            {errors.phone && <span className='form-error'>{errors.phone}</span>}
                                        </div>
                                        {showEmail ? (
                                            <div className='co-field'>
                                                <label>Email (optional)</label>
                                                <input
                                                    type='email'
                                                    name='email'
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    placeholder='Email address'
                                                />
                                            </div>
                                        ) : (
                                            <button type='button' className='co-link' onClick={() => setShowEmail(true)}>
                                                + Add email (optional)
                                            </button>
                                        )}

                                        <button type='button' className='co-btn-primary' onClick={handleAddToOrder}>
                                            Add to order
                                        </button>
                                    </div>
                                )}

                                {tab === 'merch' && activeProducts.length > 0 && (
                                    <div className='co-panel'>
                                        <div className='co-step'>1 · Choose an item</div>
                                        <div className='co-chip-row'>
                                            {activeProducts.map(p => (
                                                <button
                                                    type='button'
                                                    key={p.id}
                                                    className={`co-chip ${currentProductId === p.id ? 'selected' : ''}`}
                                                    onClick={() => { setSelectedProductId(p.id); setSelectedSize(''); setMerchError('') }}
                                                >
                                                    {p.name} · ${p.price}
                                                </button>
                                            ))}
                                        </div>
                                        {selectedProduct?.description && (
                                            <span className='co-desc'>{selectedProduct.description}</span>
                                        )}

                                        <div className='co-step'>2 · Pick a size</div>
                                        <div className='co-size-row'>
                                            {(selectedProduct?.variants || []).map(v => (
                                                <button
                                                    type='button'
                                                    key={v.size}
                                                    disabled={v.stock <= 0}
                                                    className={`co-size ${selectedSize === v.size ? 'selected' : ''}`}
                                                    onClick={() => { setSelectedSize(v.size); setMerchError('') }}
                                                >
                                                    {v.size}
                                                    {v.stock > 0 && v.stock <= 3 && <small>{v.stock} left</small>}
                                                    {v.stock <= 0 && <small>sold out</small>}
                                                </button>
                                            ))}
                                        </div>

                                        <div className='co-step'>3 · How many?</div>
                                        <div className='co-merch-actions'>
                                            <div className='co-stepper'>
                                                <button type='button' onClick={() => setSelectedQty(q => Math.max(1, q - 1))}>−</button>
                                                <span>{selectedQty}</span>
                                                <button type='button' onClick={() => setSelectedQty(q => q + 1)}>+</button>
                                            </div>
                                            <button type='button' className='co-btn-primary co-grow' onClick={addMerch}>
                                                Add to order
                                            </button>
                                        </div>
                                        {merchError && <span className='form-error'>{merchError}</span>}
                                        <span className='co-note'>Pickup only. Pay online and grab it at class.</span>
                                    </div>
                                )}

                                {justAdded && <div className='co-added'>✓ Added {justAdded}</div>}

                                <div className='co-summary'>
                                    <div className='co-summary-head'>
                                        <span>Your order</span>
                                        {hasOrder && <span className='co-summary-count'>{cart.length + merchCount} {cart.length + merchCount === 1 ? 'item' : 'items'}</span>}
                                    </div>

                                    {!hasOrder ? (
                                        <span className='co-empty'>Nothing here yet. Add a pass or some merch above.</span>
                                    ) : (
                                        renderLines(true, false)
                                    )}

                                    {merchCart.length > 0 && cart.length === 0 && (
                                        <div className='co-pickup'>
                                            <div className='co-step'>Pickup contact</div>
                                            <div className='co-row'>
                                                <div className='co-field'>
                                                    <label>Name</label>
                                                    <input
                                                        type='text'
                                                        value={pickup.name}
                                                        onChange={e => { setPickup({ ...pickup, name: e.target.value }); setPickupErrors({ ...pickupErrors, name: '' }) }}
                                                        placeholder='Full name'
                                                    />
                                                    {pickupErrors.name && <span className='form-error'>{pickupErrors.name}</span>}
                                                </div>
                                                <div className='co-field'>
                                                    <label>Phone</label>
                                                    <input
                                                        type='tel'
                                                        value={pickup.phone}
                                                        onChange={e => {
                                                            const value = e.target.value.replace(/[^0-9]/g, '')
                                                            setPickup({ ...pickup, phone: value })
                                                            setPickupErrors({ ...pickupErrors, phone: '' })
                                                        }}
                                                        placeholder='10 digits'
                                                        maxLength={10}
                                                    />
                                                    {pickupErrors.phone && <span className='form-error'>{pickupErrors.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {hasOrder && (
                                        <div className='co-total'>
                                            <span>Total</span>
                                            <span>${orderTotal.toFixed(2)}</span>
                                        </div>
                                    )}

                                    {orderError && <span className='form-error'>{orderError}</span>}

                                    <button type='button' className='co-btn-primary co-btn-wide' onClick={handleContinue}>
                                        Continue to payment
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className='checkout-payment co'>
                                <h3>Review & Pay</h3>
                                <div className='co-summary co-review'>
                                    <div className='co-summary-head'>
                                        <span>Your order</span>
                                    </div>
                                    {renderLines(false, true)}
                                    <div className='co-total'>
                                        <span>Total</span>
                                        <span>${orderTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <PayPalButton
                                    cart={cart}
                                    merchItems={merchCart}
                                    buyer={buyer}
                                    onSuccess={handlePaymentSuccess}
                                />
                                <button type='button' className='co-btn-ghost' onClick={() => setStep(1)}>
                                    ← Back to edit order
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className='checkout-confirmation co'>
                                <div className='confirmation-icon'>✓</div>
                                <h3>Payment Successful!</h3>
                                <div className='co-summary co-review'>
                                    {renderLines(false, true)}
                                    <div className='co-total'>
                                        <span>Total paid</span>
                                        <span>${orderTotal.toFixed(2)}</span>
                                    </div>
                                    {paymentDetails && (
                                        <span className='co-note'>Transaction ID: {paymentDetails.id}</span>
                                    )}
                                </div>
                                <span className='confirmation-message'>
                                    A receipt has been sent to your PayPal email.
                                    {merchCart.length > 0 ? ' Your merch will be ready for pickup at class.' : ''}
                                    {' '}Please show this confirmation when you arrive.
                                </span>
                                <button type='button' className='co-btn-primary co-btn-wide' onClick={startOver}>
                                    Start a new order
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                <div className='classes-picture'>
                    <img src={classesPagePic} alt="picture of couples dancing in a circle" />
                </div>
            </div>

            <div className='classes-levels-section'>
                <h2>About Our Levels</h2>
                <div className='classes-levels'>
                    <div className='class-levels'>
                        <h3 className='class-level-heading'>Level 1</h3>
                        <img src={level1} alt="" />
                        <div className='level-desc'>
                            <p><strong>Beginner: </strong>dancers with little to no experience</p>
                        </div>
                    </div>
                    <div className='class-levels'>
                        <h3 className='class-level-heading'>Level 2</h3>
                        <img src={level2} alt="" />
                        <div className='level-desc'>
                            <p><strong>Beyond the Basics: </strong>dancers with 1-2 years of experience</p>
                        </div>
                    </div>
                    <div className='class-levels'>
                        <h3 className='class-level-heading'>Level 3</h3>
                        <img src={level3} alt="" />
                        <div className='level-desc'>
                            <p><strong>Team Experience: </strong>for advanced dancers with 3 years or more experience</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}