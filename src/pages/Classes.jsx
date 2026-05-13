import './Classes.css'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import classesPagePic from '../assets/tim-teaching.png'
import level1 from '../assets/noel-1.png'
import level2 from '../assets/group-2.png'
import level3 from '../assets/rj-teaching.png'
import PayPalButton from './PayPalButton'

const today = new Date()
const dayOfMonth = today.getDate()
const isFirstWeek = dayOfMonth <= 7 // Change this value if you wish for the monthly options to show up pass seven days

function getExpiryDate(passType) {
    const now = new Date()
    if (passType === 'day') {
        const expiry = new Date(now)
        expiry.setMonth(expiry.getMonth() + 3)
        return expiry.toLocaleDateString()
    }
    const expiry = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return expiry.toLocaleDateString()
}

function getPassLabel(passType) {
    if (passType === 'day') return 'Day Pass — $25'
    if (passType === 'one_style') return 'Monthly 1 Style — $60'
    if (passType === 'both_styles') return 'Monthly Both Styles — $80'
}

export default function Classes() {
    const [step, setStep] = useState(1)
    const [selectedPass, setSelectedPass] = useState(null)
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: ''
    })
    const [errors, setErrors] = useState({})
    const [paymentDetails, setPaymentDetails] = useState(null)

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: '' })
    }

    function validate() {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (formData.phone.length < 10) newErrors.phone = 'Please enter a valid 10 digit phone number'
    if (!selectedPass) newErrors.selectedPass = 'Please select a pass'
    return newErrors
}

    function handleContinue() {
        const newErrors = validate()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        setStep(2)
    }

    function handlePaymentSuccess(details) {
        setPaymentDetails(details)
        setStep(3)
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
                            <h3>Mondays</h3>
                            <p>May 4, 11, 18, 25</p>
                        </div>
                        <div className='class-schedule'>
                            <h3>Class Schedule</h3>
                            <div className='schedule'>
                                <div className='times'>
                                    <p>6:30</p>
                                    <p>7:15</p>
                                    <p>7:45</p>
                                </div>
                                <div className='classes'>
                                    <p>Bachata (all levels)</p>
                                    <p>Social Dancing</p>
                                    <p>Salsa (all levels)</p>
                                </div>
                            </div>
                            <div className='class-schedule'>
                                <h3>May 25:</h3>
                                <div className='schedule'>
                                    <div className='times'>
                                        <p>6:30</p>
                                        <p>7:30</p>
                                        <p>8:30</p>
                                    </div>
                                   {/* <div className='classes'>
                                        <p>Bachata (all levels)</p>
                                        <p>Salsa (all levels)</p>
                                        <p>Social until 10:30</p>
                                    </div>*/}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='team-info'></div>
                </div>
            </div>

            <div className='classes-membership-section'>
                <div className='classes-rates'>
                    <h3>Monthly Rates:</h3>
                    <h4>April</h4>
                    <p>We offer classes in monthly cycles</p>
                    <div className='rates'>
                        <div className='rate-category'>
                            <p>1 Style:</p>
                            <p>Both Styles:</p>
                            <p>Day Pass:</p>
                        </div>
                        <div className='rate-cost'>
                            <p>$60</p>
                            <p>$80</p>
                          {/*}  <p>$25</p> */}
                        </div>
                    </div>

                    {/* PAYMENT FORM */}
                    <div className='classes-paypal'>

                        {/* STEP 1 - Initial Form */}
                        {step === 1 && (
                            <div className='checkout-form'>
                                <h3>Register & Pay</h3>

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
                                    <label>Select Your Pass</label>
                                    <div className='pass-options'>
                                        <div
                                            className={`pass-option ${selectedPass === 'day' ? 'selected' : ''}`}
                                            onClick={() => setSelectedPass('day')}
                                        >
                                            <p>Day Pass</p>
                                            <p>$25</p>
                                        </div>
                                        {isFirstWeek ? (
                                            <>
                                                <div
                                                    className={`pass-option ${selectedPass === 'one_style' ? 'selected' : ''}`}
                                                    onClick={() => setSelectedPass('one_style')}
                                                >
                                                    <p>Monthly — 1 Style</p>
                                                    <p>$60</p>
                                                </div>
                                                <div
                                                    className={`pass-option ${selectedPass === 'both_styles' ? 'selected' : ''}`}
                                                    onClick={() => setSelectedPass('both_styles')}
                                                >
                                                    <p>Monthly — Both Styles</p>
                                                    <p>$80</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className='monthly-unavailable'>
                                                Monthly passes are only available during
                                                the first week of the month.
                                            </p>
                                        )}
                                    </div>
                                    {errors.selectedPass && <span className='form-error'>{errors.selectedPass}</span>}
                                </div>

                                <button className='continue-btn' onClick={handleContinue}>
                                    Continue to Payment
                                </button>
                            </div>
                        )}

                        {/* STEP 2 - Payppal screen with values */}
                        {step === 2 && (
                            <div className='checkout-payment'>
                                <h3>Complete Your Payment</h3>
                                <div className='checkout-summary'>
                                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                                    <p><strong>Phone:</strong> {formData.phone}</p>
                                    {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
                                    <p><strong>Pass:</strong> {getPassLabel(selectedPass)}</p>
                                    <p><strong>Valid until:</strong> {getExpiryDate(selectedPass)}</p>
                                </div>
                                <PayPalButton
                                    selectedPass={selectedPass}
                                    formData={formData}
                                    onSuccess={handlePaymentSuccess}
                                />
                                <button className='back-btn' onClick={() => setStep(1)}>
                                    Go Back
                                </button>
                            </div>
                        )}

                        {/* STEP 3 - Payment Confirmation */}
                        {step === 3 && (
                            <div className='checkout-confirmation'>
                                <div className='confirmation-icon'>✓</div>
                                <h3>Payment Successful!</h3>
                                <div className='checkout-summary'>
                                    <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
                                    <p><strong>Phone:</strong> {formData.phone}</p>
                                    {formData.email && <p><strong>Email:</strong> {formData.email}</p>}
                                    <p><strong>Pass:</strong> {getPassLabel(selectedPass)}</p>
                                    <p><strong>Valid until:</strong> {getExpiryDate(selectedPass)}</p>
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
                                    setSelectedPass(null)
                                    setFormData({ firstName: '', lastName: '', phone: '', email: '' })
                                    setPaymentDetails(null)
                                }}>
                                    Register Another Person
                                </button>
                            </div>
                        )}

                    </div>
                </div>
                <div className='classes-picture'>
                    <img src={classesPagePic} alt="picture of couples dancing in a circle" />
                </div>
            </div>

            <div className='classes-first-time'>
                <h3>First time? No problem!</h3>
                <div className='first-time-info'>
                    <p>Message us each person's name, phone number, and preferred payment method to be registered if it's your first time attending our classes</p>
                    <Link to="/FAQs" onClick={() => {
                        window.scroll(0, 0);
                    }}>
                        <button>Check out our FAQs</button>
                    </Link>
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