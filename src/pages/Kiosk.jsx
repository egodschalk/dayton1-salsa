import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase'
import { collection, query, onSnapshot, addDoc } from 'firebase/firestore'
import { signOut, onAuthStateChanged } from 'firebase/auth'
import { usePassTypes, isPassVisible, getExpiryDate } from '../hooks/usePassTypes'
import './Kiosk.css'

const PAYMENT_LABELS = {
    cash: 'Cash',
    venmo: 'Venmo',
    paypal: 'PayPal'
}

export default function Kiosk() {
    const navigate = useNavigate()
    const { passTypes } = usePassTypes()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [members, setMembers] = useState([])
    const [search, setSearch] = useState('')
    const [selected, setSelected] = useState(null)
    const [countdown, setCountdown] = useState(null)
    const [showRegister, setShowRegister] = useState(false)
    const [registerForm, setRegisterForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        passType: '',
        paymentMethod: 'cash'
    })
    const [registerErrors, setRegisterErrors] = useState({})

    // Passes a customer can currently self-register for
    const visiblePasses = passTypes.filter(p => isPassVisible(p))

    // Auth check — redirect to admin login if not authenticated
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/admin')
            } else {
                setUser(currentUser)
                setAuthLoading(false)
            }
        })
        return unsubscribe
    }, [navigate])

    // Members listener — only runs once authenticated
    useEffect(() => {
        if (!user) return
        const q = query(collection(db, 'members'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setMembers(data)
        })
        return unsubscribe
    }, [user])

    useEffect(() => {
        if (countdown === null) return
        if (countdown === 0) {
            setSelected(null)
            setSearch('')
            setCountdown(null)
            return
        }
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        return () => clearTimeout(timer)
    }, [countdown])

    function handleSelect(member) {
        setSelected(member)
        setSearch('')
        setCountdown(5)
    }

    async function handleExit() {
        await signOut(auth)
        navigate('/admin')
    }

    function validateRegisterForm() {
        const errors = {}
        if (!registerForm.firstName.trim()) errors.firstName = 'First name is required'
        if (!registerForm.lastName.trim()) errors.lastName = 'Last name is required'
        if (!registerForm.phone.trim()) errors.phone = 'Phone number is required'
        if (registerForm.phone.length < 10) errors.phone = 'Please enter a valid 10 digit phone number'
        if (!registerForm.passType) errors.passType = 'Please select a pass'
        return errors
    }

    async function handleRegisterSubmit(e) {
        e.preventDefault()
        const errors = validateRegisterForm()
        if (Object.keys(errors).length > 0) {
            setRegisterErrors(errors)
            return
        }

        const pass = passTypes.find(p => p.key === registerForm.passType)
        if (!pass) {
            setRegisterErrors({ passType: 'Selected pass is no longer available.' })
            return
        }

        const now = new Date()
        const expiryDate = getExpiryDate(pass)

        const docRef = await addDoc(collection(db, 'members'), {
            firstName: registerForm.firstName,
            lastName: registerForm.lastName,
            phone: registerForm.phone,
            email: registerForm.email || '',
            passType: pass.key,
            passLabel: pass.label,
            amount: pass.amount,
            paymentMethod: registerForm.paymentMethod,
            purchaseDate: now.toISOString(),
            expiryDate,
            originalExpiryDate: expiryDate,
            transactionId: 'PENDING',
            isActive: true,
            checkIns: [],
            createdAt: now
        })

        setSelected({
            id: docRef.id,
            firstName: registerForm.firstName,
            lastName: registerForm.lastName,
            passLabel: pass.label,
            expiryDate,
            passType: pass.key,
            paymentMethod: registerForm.paymentMethod,
            checkIns: [],
            transactionId: 'PENDING'
        })
        setShowRegister(false)
        setRegisterForm({ firstName: '', lastName: '', phone: '', email: '', passType: '', paymentMethod: 'cash' })
        setRegisterErrors({})
        setSearch('')
        setCountdown(5)
    }

    function isActive(member) {
        if (member.passType === 'day') {
            const checkIns = member.checkIns || []
            return checkIns.length === 0 && new Date(member.expiryDate) >= new Date()
        }
        return new Date(member.expiryDate) >= new Date()
    }

    function getStatusLabel(member) {
        if (member.transactionId === 'PENDING') return 'Pending Payment'
        if (member.passType === 'day' && (member.checkIns || []).length > 0) return 'Used'
        if (!isActive(member)) return 'Expired'
        return 'Active'
    }

    function getStatusClass(member) {
        if (member.transactionId === 'PENDING') return 'status-pending'
        if (member.passType === 'day' && (member.checkIns || []).length > 0) return 'status-used'
        if (!isActive(member)) return 'status-expired'
        return 'status-active'
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString()
    }

    const results = search.trim().length > 0
        ? members.filter(m =>
            `${m.firstName} ${m.lastName}`.toLowerCase().includes(search.toLowerCase())
        )
        : []

    if (authLoading) {
        return (
            <div className='kiosk-page'>
                <div className='kiosk-inner'>
                    <p style={{ textAlign: 'center' }}>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className='kiosk-page'>
            <div className='kiosk-inner'>
                <div className='kiosk-header'>
                    <h1>DaytOn1 Salsa</h1>
                    <button className='kiosk-exit-btn' onClick={handleExit}>Exit</button>
                </div>

                {!selected && !showRegister && (
                    <div className='kiosk-search-section'>
                        <h2>Type your name to check in</h2>
                        <input
                            type='text'
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder='Start typing your name...'
                            className='kiosk-search-input'
                            autoFocus
                        />
                        {results.length > 0 && (
                            <div className='kiosk-results'>
                                {results.map(member => (
                                    <div
                                        key={member.id}
                                        className='kiosk-result-item'
                                        onClick={() => handleSelect(member)}
                                    >
                                        <span className='kiosk-result-name'>
                                            {member.firstName} {member.lastName}
                                        </span>
                                        <span className={`kiosk-status-badge ${getStatusClass(member)}`}>
                                            {getStatusLabel(member)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {search.trim().length > 0 && results.length === 0 && (
                            <p className='kiosk-no-results'>No members found.</p>
                        )}
                        <button className='kiosk-register-btn' onClick={() => setShowRegister(true)}>
                            New here? Register
                        </button>
                    </div>
                )}

                {showRegister && (
                    <div className='kiosk-register-section'>
                        <div className='kiosk-register-card'>
                            <div className='kiosk-register-header'>
                                <h2>Welcome! 👋</h2>
                                <p className='kiosk-register-subtitle'>Let's get you set up — it only takes a minute</p>
                            </div>
                            <form className='kiosk-register-form' onSubmit={handleRegisterSubmit}>
                                <div className='kiosk-form-row'>
                                    <div className='kiosk-form-group'>
                                        <label>First Name</label>
                                        <input
                                            type='text'
                                            value={registerForm.firstName}
                                            onChange={e => {
                                                setRegisterForm({ ...registerForm, firstName: e.target.value })
                                                setRegisterErrors({ ...registerErrors, firstName: '' })
                                            }}
                                            placeholder='First name'
                                        />
                                        {registerErrors.firstName && <span className='kiosk-form-error'>{registerErrors.firstName}</span>}
                                    </div>
                                    <div className='kiosk-form-group'>
                                        <label>Last Name</label>
                                        <input
                                            type='text'
                                            value={registerForm.lastName}
                                            onChange={e => {
                                                setRegisterForm({ ...registerForm, lastName: e.target.value })
                                                setRegisterErrors({ ...registerErrors, lastName: '' })
                                            }}
                                            placeholder='Last name'
                                        />
                                        {registerErrors.lastName && <span className='kiosk-form-error'>{registerErrors.lastName}</span>}
                                    </div>
                                </div>

                                <div className='kiosk-form-group'>
                                    <label>Phone Number</label>
                                    <input
                                        type='tel'
                                        value={registerForm.phone}
                                        onChange={e => {
                                            const value = e.target.value.replace(/[^0-9]/g, '')
                                            setRegisterForm({ ...registerForm, phone: value })
                                            setRegisterErrors({ ...registerErrors, phone: '' })
                                        }}
                                        placeholder='(555) 555-5555'
                                        maxLength={10}
                                    />
                                    {registerErrors.phone && <span className='kiosk-form-error'>{registerErrors.phone}</span>}
                                </div>

                                <div className='kiosk-form-group'>
                                    <label>Email <span className='kiosk-optional'>(optional)</span></label>
                                    <input
                                        type='email'
                                        value={registerForm.email}
                                        onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                                        placeholder='you@example.com'
                                    />
                                </div>

                                <div className='kiosk-form-group'>
                                    <label>Choose Your Pass</label>
                                    <div className='kiosk-pass-options'>
                                        {visiblePasses.length === 0 ? (
                                            <p className='kiosk-no-results'>No passes available right now. Please see the front desk.</p>
                                        ) : (
                                            visiblePasses.map(pass => (
                                                <button
                                                    type='button'
                                                    key={pass.id}
                                                    className={`kiosk-pass-option ${registerForm.passType === pass.key ? 'selected' : ''}`}
                                                    onClick={() => {
                                                        setRegisterForm({ ...registerForm, passType: pass.key })
                                                        setRegisterErrors({ ...registerErrors, passType: '' })
                                                    }}
                                                >
                                                    {pass.label} — ${pass.amount}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                    {registerErrors.passType && <span className='kiosk-form-error'>{registerErrors.passType}</span>}
                                </div>

                                <div className='kiosk-form-group'>
                                    <label>How Will You Pay?</label>
                                    <div className='kiosk-payment-options'>
                                        {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
                                            <button
                                                type='button'
                                                key={key}
                                                className={`kiosk-payment-option ${registerForm.paymentMethod === key ? 'selected' : ''}`}
                                                onClick={() => setRegisterForm({ ...registerForm, paymentMethod: key })}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className='kiosk-register-note'>
                                     Please wait for one of the members to finish the process.
                                </div>

                                <div className='kiosk-register-buttons'>
                                    <button type='button' className='kiosk-cancel-btn' onClick={() => { setShowRegister(false); setRegisterErrors({}) }}>
                                        Cancel
                                    </button>
                                    <button type='submit' className='kiosk-submit-btn'>
                                        Register
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {selected && (
                    <div className='kiosk-confirmation'>
                        <div className='kiosk-confirm-card'>
                            <h2>{selected.firstName} {selected.lastName}</h2>
                            <div className='kiosk-confirm-details'>
                                <div className='kiosk-confirm-row'>
                                    <span>Pass</span>
                                    <span>{selected.passLabel}</span>
                                </div>
                                <div className='kiosk-confirm-row'>
                                    <span>Valid Until</span>
                                    <span>{formatDate(selected.expiryDate)}</span>
                                </div>
                                <div className='kiosk-confirm-row'>
                                    <span>Status</span>
                                    <span className={`kiosk-status-badge ${getStatusClass(selected)}`}>
                                        {getStatusLabel(selected)}
                                    </span>
                                </div>
                            </div>
                            <p className='kiosk-wait'>
                                {selected.transactionId === 'PENDING'
                                    ? 'Please see the front desk to complete payment.'
                                    : 'Please wait for the admin to check you in.'}
                            </p>
                            <p className='kiosk-countdown'>Clearing in {countdown}...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}