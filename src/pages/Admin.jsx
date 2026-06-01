import { useState, useEffect } from 'react'
import { db, auth } from '../firebase'
import { collection, doc, updateDoc, addDoc, orderBy, query, deleteDoc, onSnapshot } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import './Admin.css'

export default function Admin() {
    const [user, setUser] = useState(null)
    const [members, setMembers] = useState([])
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [showManualEntry, setShowManualEntry] = useState(false)
    const [manualForm, setManualForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        passType: 'day'
    })
    const [manualErrors, setManualErrors] = useState({})

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            setLoading(false)
        })
        return unsubscribe
    }, [])

    useEffect(() => {
        if (!user) return
        const q = query(collection(db, 'members'), orderBy('purchaseDate', 'desc'))
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
            setMembers(data)
        })
        return unsubscribe
    }, [user])

    function getExpiryDate(passType) {
        const now = new Date()
        if (passType === 'day') {
            const expiry = new Date(now)
            expiry.setMonth(expiry.getMonth() + 3)
            return expiry.toISOString()
        }
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        const diffDays = (nextMonth - now) / (1000 * 60 * 60 * 24)
        if (diffDays < 5) {
            return new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString()
        }
        return nextMonth.toISOString()
    }

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

    function validateManualForm() {
        const errors = {}
        if (!manualForm.firstName.trim()) errors.firstName = 'First name is required'
        if (!manualForm.lastName.trim()) errors.lastName = 'Last name is required'
        if (!manualForm.phone.trim()) errors.phone = 'Phone number is required'
        if (manualForm.phone.length < 10) errors.phone = 'Please enter a valid 10 digit phone number'
        return errors
    }

    async function handleManualEntry(e) {
        e.preventDefault()
        const errors = validateManualForm()
        if (Object.keys(errors).length > 0) {
            setManualErrors(errors)
            return
        }

        const now = new Date()
        const expiryDate = getExpiryDate(manualForm.passType)

        await addDoc(collection(db, 'members'), {
            firstName: manualForm.firstName,
            lastName: manualForm.lastName,
            phone: manualForm.phone,
            email: manualForm.email || '',
            passType: manualForm.passType,
            passLabel: PASS_LABELS[manualForm.passType],
            amount: PASS_AMOUNTS[manualForm.passType],
            purchaseDate: now.toISOString(),
            expiryDate,
            originalExpiryDate: expiryDate,
            transactionId: 'CASH',
            isActive: true,
            checkedIn: false,
            createdAt: now
        })

        setManualForm({ firstName: '', lastName: '', phone: '', email: '', passType: 'day' })
        setManualErrors({})
        setShowManualEntry(false)
    }

    async function handleLogin(e) {
        e.preventDefault()
        setLoginError('')
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
            setLoginError('Invalid email or password. Please try again.')
        }
    }

    async function handleCheckIn(memberId, passType) {
        const memberRef = doc(db, 'members', memberId)
        if (passType === 'day') {
            await updateDoc(memberRef, {
                checkedIn: true,
                isActive: false,
                expiryDate: new Date().toISOString()
            })
        } else {
            await updateDoc(memberRef, {
                checkedIn: true
            })
        }
    }

    async function handleUndoCheckIn(memberId, passType, member) {
        const memberRef = doc(db, 'members', memberId)
        if (passType === 'day') {
            const restoreDate = member.originalExpiryDate
                ? member.originalExpiryDate
                : (() => {
                    const expiry = new Date(member.purchaseDate)
                    expiry.setMonth(expiry.getMonth() + 3)
                    return expiry.toISOString()
                })()

            await updateDoc(memberRef, {
                checkedIn: false,
                isActive: true,
                expiryDate: restoreDate
            })
        } else {
            await updateDoc(memberRef, {
                checkedIn: false
            })
        }
    }

    async function handleDelete(memberId) {
        if (window.confirm('Are you sure you want to delete this member? This cannot be undone.')) {
            await deleteDoc(doc(db, 'members', memberId))
        }
    }

    function isActive(member) {
        if (member.passType === 'day') {
            return !member.checkedIn && new Date(member.expiryDate) >= new Date()
        }
        return new Date(member.expiryDate) >= new Date()
    }

    function getStatusLabel(member) {
        if (member.passType === 'day' && member.checkedIn) return 'Used'
        if (!isActive(member)) return 'Expired'
        return 'Active'
    }

    function getStatusClass(member) {
        if (member.passType === 'day' && member.checkedIn) return 'status-used'
        if (!isActive(member)) return 'status-expired'
        return 'status-active'
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString()
    }

    function exportToCSV() {
        const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Pass Type', 'Amount', 'Purchase Date', 'Expiry Date', 'Status', 'Checked In', 'Payment']
        const rows = filteredMembers.map(m => [
            m.firstName,
            m.lastName,
            m.phone,
            m.email || '',
            m.passLabel,
            `$${m.amount}`,
            formatDate(m.purchaseDate),
            formatDate(m.expiryDate),
            getStatusLabel(m),
            m.checkedIn ? 'Yes' : 'No',
            m.transactionId === 'CASH' ? 'Cash' : 'PayPal'
        ])

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `dayton1-members-${new Date().toLocaleDateString()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const filteredMembers = members.filter(m => {
        if (filter === 'active') return isActive(m)
        if (filter === 'expired') return !isActive(m)
        if (filter === 'day') return m.passType === 'day'
        if (filter === 'monthly') return m.passType !== 'day'
        return true
    })

    if (loading) return <div className='admin-loading'>Loading...</div>

    if (!user) return (
        <div className='admin-login'>
            <h2>Admin Login</h2>
            <form onSubmit={handleLogin}>
                <div className='admin-form-group'>
                    <label>Email</label>
                    <input
                        type='email'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder='Email address'
                        required
                    />
                </div>
                <div className='admin-form-group'>
                    <label>Password</label>
                    <input
                        type='password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder='Password'
                        required
                    />
                </div>
                {loginError && <p className='admin-error'>{loginError}</p>}
                <button type='submit' className='admin-btn'>Login</button>
            </form>
        </div>
    )

    return (
        <div className='admin-page'>
            <div className='admin-header'>
                <h2>DaytOn1 Members</h2>
                <button className='admin-btn-outline' onClick={() => signOut(auth)}>
                    Log Out
                </button>
            </div>

            <div className='admin-stats'>
                <div className='admin-stat'>
                    <p>Total Members</p>
                    <h3>{members.length}</h3>
                </div>
                <div className='admin-stat'>
                    <p>Active</p>
                    <h3>{members.filter(m => isActive(m)).length}</h3>
                </div>
                <div className='admin-stat'>
                    <p>Expired</p>
                    <h3>{members.filter(m => !isActive(m)).length}</h3>
                </div>
                <div className='admin-stat'>
                    <p>Checked In Today</p>
                    <h3>{members.filter(m => m.checkedIn).length}</h3>
                </div>
            </div>

            <div className='admin-controls'>
                <div className='admin-filters'>
                    {['all', 'active', 'expired', 'day', 'monthly'].map(f => (
                        <button
                            key={f}
                            className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div className='admin-actions'>
                    <button className='admin-btn' onClick={() => setShowManualEntry(!showManualEntry)}>
                        {showManualEntry ? 'Cancel' : '+ Add Member'}
                    </button>
                    <button className='admin-btn' onClick={exportToCSV}>
                        Export CSV
                    </button>
                </div>
            </div>

            {showManualEntry && (
                <div className='admin-manual-entry'>
                    <h3>Add Member (Cash Payment)</h3>
                    <div className='manual-entry-form'>
                        <div className='admin-form-group'>
                            <label>First Name</label>
                            <input
                                type='text'
                                value={manualForm.firstName}
                                onChange={e => {
                                    setManualForm({ ...manualForm, firstName: e.target.value })
                                    setManualErrors({ ...manualErrors, firstName: '' })
                                }}
                                placeholder='First name'
                            />
                            {manualErrors.firstName && <span className='form-error'>{manualErrors.firstName}</span>}
                        </div>
                        <div className='admin-form-group'>
                            <label>Last Name</label>
                            <input
                                type='text'
                                value={manualForm.lastName}
                                onChange={e => {
                                    setManualForm({ ...manualForm, lastName: e.target.value })
                                    setManualErrors({ ...manualErrors, lastName: '' })
                                }}
                                placeholder='Last name'
                            />
                            {manualErrors.lastName && <span className='form-error'>{manualErrors.lastName}</span>}
                        </div>
                        <div className='admin-form-group'>
                            <label>Phone</label>
                            <input
                                type='tel'
                                value={manualForm.phone}
                                onChange={e => {
                                    const value = e.target.value.replace(/[^0-9]/g, '')
                                    setManualForm({ ...manualForm, phone: value })
                                    setManualErrors({ ...manualErrors, phone: '' })
                                }}
                                placeholder='Phone number'
                                maxLength={10}
                            />
                            {manualErrors.phone && <span className='form-error'>{manualErrors.phone}</span>}
                        </div>
                        <div className='admin-form-group'>
                            <label>Email (optional)</label>
                            <input
                                type='email'
                                value={manualForm.email}
                                onChange={e => setManualForm({ ...manualForm, email: e.target.value })}
                                placeholder='Email address'
                            />
                        </div>
                        <div className='admin-form-group'>
                            <label>Pass Type</label>
                            <select
                                value={manualForm.passType}
                                onChange={e => setManualForm({ ...manualForm, passType: e.target.value })}
                            >
                                <option value='day'>Day Pass — $25</option>
                                <option value='one_style'>Monthly 1 Style — $60</option>
                                <option value='both_styles'>Monthly Both Styles — $80</option>
                            </select>
                        </div>
                        <button className='admin-btn' onClick={handleManualEntry}>
                            Add Member
                        </button>
                    </div>
                </div>
            )}

            <div className='admin-table-wrapper'>
                <table className='admin-table'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Pass</th>
                            <th>Expires</th>
                            <th>Status</th>
                            <th>Payment</th>
                            <th>Checked In</th>
                            <th>Action</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredMembers.length === 0 ? (
                            <tr>
                                <td colSpan='9' className='admin-empty'>No members found</td>
                            </tr>
                        ) : (
                            filteredMembers.map(member => (
                                <tr key={member.id} className={!isActive(member) ? 'expired-row' : ''}>
                                    <td>{member.firstName} {member.lastName}</td>
                                    <td>{member.phone}</td>
                                    <td>{member.passLabel}</td>
                                    <td>{formatDate(member.expiryDate)}</td>
                                    <td>
                                        <span className={`status-badge ${getStatusClass(member)}`}>
                                            {getStatusLabel(member)}
                                        </span>
                                    </td>
                                    <td>{member.transactionId === 'CASH' ? 'Cash' : 'PayPal'}</td>
                                    <td>{member.checkedIn ? '✓ Yes' : 'No'}</td>
                                    <td>
                                        {member.checkedIn ? (
                                            <button
                                                className='checkin-btn checkin-btn-undo'
                                                onClick={() => handleUndoCheckIn(member.id, member.passType, member)}
                                            >
                                                Undo
                                            </button>
                                        ) : (
                                            <button
                                                className='checkin-btn'
                                                onClick={() => handleCheckIn(member.id, member.passType)}
                                                disabled={!isActive(member)}
                                                style={{ opacity: !isActive(member) ? 0.4 : 1, cursor: !isActive(member) ? 'not-allowed' : 'pointer' }}
                                            >
                                                Check In
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className='delete-btn'
                                            onClick={() => handleDelete(member.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}