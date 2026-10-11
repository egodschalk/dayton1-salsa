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
import MerchCheckout from './MerchCheckout'

const emptyPerson = { firstName: '', lastName: '', phone: '', email: '' }

export default function Classes() {
    const { passTypes } = usePassTypes()
    const { schedule, loading: scheduleLoading } = useSchedule()
    const { products } = useProducts()
    const [step, setStep] = useState(1)
    const [selectedPass, setSelectedPass] = useState(null)
    const [formData, setFormData] = useState(emptyPerson)
    const [cart, setCart] = useState([]) // [{ id, firstName, lastName, phone, email, passKey }]
    const [errors, setErrors] = useState({})
    const [paymentDetails, setPaymentDetails] = useState(null)

    const visiblePasses = passTypes.filter(p => isPassVisible(p))
    const activeProducts = products.filter(p => p.active)

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

    const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(passFor(item.passKey)?.amount) || 0), 0)

    function formatExpiry(pass) {
        if (!pass) return ''
        return new Date(getExpiryDate(pass)).toLocaleDateString()
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    function validate() {
        const newErrors = {}
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
        else if (formData.phone.length < 10) newErrors.phone = 'Please enter a valid 10 digit phone number'
        if (!selectedPass) newErrors.selectedPass = 'Please select a pass'
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
        setErrors({})
    }

    function handleAddToOrder() {
        const newErrors = validate()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        setCart([...cart, buildCartItem()])
        resetForm()
    }

    function removeFromCart(id) {
        setCart(cart.filter(item => item.id !== id))
    }

    function handleContinue() {
        let nextCart = cart

        // If a person is filled in but not added yet, add them automatically
        if (!formIsBlank()) {
            const newErrors = validate()
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                return
            }
            nextCart = [...cart, buildCartItem()]
            setCart(nextCart)
            resetForm()
        }

        if (nextCart.length === 0) {
            setErrors(validate())
            return
        }
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

    function renderCartList(showRemove) {
        return (
            <div className='cart-list'>
                {cart.map(item => {
                    const pass = passFor(item.passKey)
                    return (
                        <div key={item.id} className='cart-item'>
                            <div className='cart-item-info'>
                                <p className='cart-item-name'>{item.firstName} {item.lastName}</p>
                                <p className='cart-item-detail'>
                                    {pass ? `${pass.label} — $${pass.amount}` : 'Pass unavailable'}
                                </p>
                                <p className='cart-item-detail'>{item.phone}{item.email ? ` · ${item.email}` : ''}</p>
                                {pass && <p className='cart-item-detail'>Valid until {formatExpiry(pass)}</p>}
                            </div>
                            {showRemove && (
                                <button className='cart-remove' onClick={() => removeFromCart(item.id)}>Remove</button>
                            )}
                        </div>
                    )
                })}
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
                                    <div className='schedule'>
                                        <div className='times'>
                                            <p>{event.description}</p>
                                        </div>
                                    </div>
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
                            <div className='checkout-form'>
                                <h3>Register & Pay</h3>

                                {cart.length > 0 && (
                                    <div className='cart-section'>
                                        <h4 className='cart-title'>Your Order ({cart.length})</h4>
                                        {renderCartList(true)}
                                        <p className='cart-total'>Total: ${cartTotal.toFixed(2)}</p>
                                    </div>
                                )}

                                <h4 className='cart-title'>
                                    {cart.length === 0 ? 'Who is this pass for?' : 'Add another person'}
                                </h4>

                                <div className='form-group'>
                                    <label>First Name</label>
                                    <input
                                        type='text'
                                        name='firstName'
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        placeholder='First name'
                                    />
                                    {errors.firstName && <span className='form-error'>{errors.firstName}</span>}
                                </div>

                                <div className='form-group'>
                                    <label>Last Name</label>
                                    <input
                                        type='text'
                                        name='lastName'
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        placeholder='Last name'
                                    />
                                    {errors.lastName && <span className='form-error'>{errors.lastName}</span>}
                                </div>

                                <div className='form-group'>
                                    <label>Phone Number</label>
                                    <input
                                        type='tel'
                                        name='phone'
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/[^0-9]/g, '')
                                            setFormData({ ...formData, phone: value })
                                            setErrors({ ...errors, phone: '' })
                                        }}
                                        placeholder='Phone number'
                                        maxLength={10}
                                    />
                                    {errors.phone && <span className='form-error'>{errors.phone}</span>}
                                </div>

                                <div className='form-group'>
                                    <label>Email (optional)</label>
                                    <input
                                        type='email'
                                        name='email'
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder='Email address'
                                    />
                                </div>

                                <div className='form-group'>
                                    <label>Select Pass</label>
                                    <div className='pass-options'>
                                        {visiblePasses.length === 0 ? (
                                            <p className='monthly-unavailable'>
                                                No passes are available right now. Please check back soon or see the front desk.
                                            </p>
                                        ) : (
                                            visiblePasses.map(pass => (
                                                <div
                                                    key={pass.id}
                                                    className={`pass-option ${selectedPass === pass.key ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setSelectedPass(pass.key)
                                                        setErrors({ ...errors, selectedPass: '' })
                                                    }}
                                                >
                                                    <p>{pass.label}</p>
                                                    <p>${pass.amount}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {errors.selectedPass && <span className='form-error'>{errors.selectedPass}</span>}
                                </div>

                                <button className='add-btn' onClick={handleAddToOrder}>
                                    + Add to Order
                                </button>

                                <button className='continue-btn' onClick={handleContinue}>
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className='checkout-payment'>
                                <h3>Complete Your Payment</h3>
                                <div className='checkout-summary'>
                                    {renderCartList(false)}
                                    <p className='cart-total'><strong>Total:</strong> ${cartTotal.toFixed(2)}</p>
                                </div>
                                <PayPalButton
                                    cart={cart}
                                    onSuccess={handlePaymentSuccess}
                                />
                                <button className='back-btn' onClick={() => setStep(1)}>
                                    Go Back
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className='checkout-confirmation'>
                                <div className='confirmation-icon'>✓</div>
                                <h3>Payment Successful!</h3>
                                <div className='checkout-summary'>
                                    {renderCartList(false)}
                                    <p className='cart-total'><strong>Total paid:</strong> ${cartTotal.toFixed(2)}</p>
                                    {paymentDetails && (
                                        <p><strong>Transaction ID:</strong> {paymentDetails.id}</p>
                                    )}
                                </div>
                                <p className='confirmation-message'>
                                    A receipt has been sent to your PayPal email.
                                    Please show this confirmation when you arrive.
                                </p>
                                <button className='continue-btn' onClick={() => {
                                    setStep(1)
                                    setCart([])
                                    resetForm()
                                    setPaymentDetails(null)
                                }}>
                                    Register More People
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

            {activeProducts.length > 0 && (
                <div className='merch-section'>
                    <h2>DaytOn1 Merch</h2>
                    <p className='merch-subtitle'>Pickup only — pay online, grab it at class.</p>
                    <MerchCheckout products={activeProducts} />
                </div>
            )}
        </div>
    )
}