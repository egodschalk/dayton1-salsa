import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase'
import { collection, doc, updateDoc, addDoc, orderBy, query, deleteDoc, onSnapshot, arrayUnion, arrayRemove, setDoc, getDoc, getDocs, where } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { usePassTypes, getExpiryDate } from '../hooks/usePassTypes'
import { useInstructors } from '../hooks/useInstructors'
import './Admin.css'

const STAFF_VIEW_EMAILS = ['dayton1salsa@gmail.com', 'ahiciano@icanoki.com']
const MAX_RESULTS = 15

function getTodayString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getStaffName(email) {
    if (!email) return 'Unknown'
    const namePart = email.split('@')[0]
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
}

function formatPhone(phone) {
    const digits = (phone || '').replace(/\D/g, '')
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    return phone || ''
}

// Matches a member against what staff typed. Digits search the phone number;
// anything else searches first name, last name and email (every word must match).
function matchesQuery(member, text) {
    const q = (text || '').trim().toLowerCase()
    if (!q) return true
    const looksLikePhone = /^[\d\s\-().+]+$/.test(q)
    if (looksLikePhone) {
        const digits = q.replace(/\D/g, '')
        if (digits.length === 0) return true
        const phoneDigits = (member.phone || '').replace(/\D/g, '')
        return phoneDigits.includes(digits)
    }
    const hay = `${member.firstName || ''} ${member.lastName || ''} ${member.email || ''}`.toLowerCase()
    return q.split(/\s+/).every(word => hay.includes(word))
}

export default function Admin() {
    const navigate = useNavigate()
    const { passTypes } = usePassTypes()
    const { instructors } = useInstructors()
    const [user, setUser] = useState(null)
    const [members, setMembers] = useState([])
    const [shifts, setShifts] = useState([])
    const [checkInLog, setCheckInLog] = useState([])
    const [instructorLog, setInstructorLog] = useState([])
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('members')
    const [filter, setFilter] = useState('all')
    const [sortBy, setSortBy] = useState('alpha')
    const [search, setSearch] = useState('')
    const [memberSearch, setMemberSearch] = useState('')
    const [showManualEntry, setShowManualEntry] = useState(false)
    const [fromCheckIn, setFromCheckIn] = useState(false)
    const [attendanceDate, setAttendanceDate] = useState(getTodayString())
    const [checkInDate, setCheckInDate] = useState(getTodayString())
    const [showDatePicker, setShowDatePicker] = useState(false)
    const [staffDate, setStaffDate] = useState(getTodayString())
    const [busyId, setBusyId] = useState(null)
    const [toast, setToast] = useState(null)
    const [manualForm, setManualForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        passType: '',
        paymentMethod: 'cash'
    })
    const [manualErrors, setManualErrors] = useState({})

    const searchRef = useRef(null)
    const toastTimer = useRef(null)

    // All active passes, for the manual-entry dropdown
    const activePasses = passTypes.filter(p => p.active)

    // Default the manual form's passType to the first active pass once loaded
    useEffect(() => {
        if (!manualForm.passType && activePasses.length > 0) {
            setManualForm(f => ({ ...f, passType: activePasses[0].key }))
        }
    }, [activePasses, manualForm.passType])

    useEffect(() => {
        return () => clearTimeout(toastTimer.current)
    }, [])

    // Auth + shift logging
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)
            setLoading(false)
            if (currentUser) {
                const today = getTodayString()
                const shiftId = `${currentUser.email}_${today}`
                const shiftRef = doc(db, 'shifts', shiftId)
                try {
                    const existing = await getDoc(shiftRef)
                    if (!existing.exists()) {
                        await setDoc(shiftRef, {
                            email: currentUser.email,
                            date: today,
                            signInTime: new Date().toISOString()
                        })
                    }
                } catch (e) {
                    console.error('Error logging shift:', e)
                }
            }
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

    useEffect(() => {
        if (!user) return
        const unsubShifts = onSnapshot(collection(db, 'shifts'), (snapshot) => {
            setShifts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        const unsubLog = onSnapshot(collection(db, 'checkInLog'), (snapshot) => {
            setCheckInLog(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return () => { unsubShifts(); unsubLog() }
    }, [user])

    useEffect(() => {
        if (!user) return
        const unsubInstructorLog = onSnapshot(collection(db, 'instructorLog'), (snapshot) => {
            setInstructorLog(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return unsubInstructorLog
    }, [user])

    function isCheckedInToday(member) {
        const checkIns = member.checkIns || []
        return checkIns.includes(getTodayString())
    }

    function isCheckedInOnDate(member, date) {
        const checkIns = member.checkIns || []
        return checkIns.includes(date)
    }

    function getAttendanceCount(member) {
        return (member.checkIns || []).length
    }

    function validateManualForm() {
        const errors = {}
        if (!manualForm.firstName.trim()) errors.firstName = 'First name is required'
        if (!manualForm.lastName.trim()) errors.lastName = 'Last name is required'
        if (!manualForm.phone.trim()) errors.phone = 'Phone number is required'
        if (manualForm.phone.length < 10) errors.phone = 'Please enter a valid 10 digit phone number'
        if (!manualForm.passType) errors.passType = 'Please select a pass'
        return errors
    }

    async function handleManualEntry(e) {
        e.preventDefault()
        const errors = validateManualForm()
        if (Object.keys(errors).length > 0) {
            setManualErrors(errors)
            return
        }

        const pass = passTypes.find(p => p.key === manualForm.passType)
        if (!pass) {
            setManualErrors({ passType: 'Selected pass is no longer available.' })
            return
        }

        const now = new Date()
        const expiryDate = getExpiryDate(pass)

        let transactionId = 'CASH'
        if (manualForm.paymentMethod === 'venmo') transactionId = 'VENMO'
        if (manualForm.paymentMethod === 'paypal') transactionId = 'PAYPAL'

        try {
            await addDoc(collection(db, 'members'), {
                firstName: manualForm.firstName,
                lastName: manualForm.lastName,
                phone: manualForm.phone,
                email: manualForm.email || '',
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
        } catch (err) {
            console.error('Error adding member:', err)
            alert('Could not add this member. Please check your connection and try again.')
            return
        }

        const addedPhone = manualForm.phone
        setManualForm({ firstName: '', lastName: '', phone: '', email: '', passType: activePasses[0]?.key || '', paymentMethod: 'cash' })
        setManualErrors({})
        setShowManualEntry(false)

        // If staff started this from the check-in screen, go straight back so they can tap Check in
        if (fromCheckIn) {
            setFromCheckIn(false)
            setSearch(addedPhone)
            setTab('checkin')
        }
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

    async function handleCheckIn(memberId, passType, date) {
        const memberRef = doc(db, 'members', memberId)
        const member = members.find(m => m.id === memberId)
        const memberName = member ? `${member.firstName} ${member.lastName}` : ''

        if (passType === 'day') {
            await updateDoc(memberRef, {
                checkIns: arrayUnion(date),
                isActive: false,
                expiryDate: new Date(date + 'T23:59:59').toISOString()
            })
        } else {
            await updateDoc(memberRef, {
                checkIns: arrayUnion(date)
            })
        }

        try {
            await addDoc(collection(db, 'checkInLog'), {
                memberId,
                memberName,
                date,
                adminEmail: user?.email || 'unknown',
                loggedAt: new Date().toISOString()
            })
        } catch (e) {
            console.error('Error logging check-in:', e)
        }
    }

    async function handleUndoCheckIn(memberId, passType, member, date) {
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
                checkIns: arrayRemove(date),
                isActive: true,
                expiryDate: restoreDate
            })
        } else {
            await updateDoc(memberRef, {
                checkIns: arrayRemove(date)
            })
        }

        try {
            const logQuery = query(
                collection(db, 'checkInLog'),
                where('memberId', '==', memberId),
                where('date', '==', date)
            )
            const snapshot = await getDocs(logQuery)
            for (const docSnap of snapshot.docs) {
                await deleteDoc(doc(db, 'checkInLog', docSnap.id))
            }
        } catch (e) {
            console.error('Error removing check-in log:', e)
        }
    }

    // ---- Check-in screen helpers ----

    function clearToast() {
        clearTimeout(toastTimer.current)
        setToast(null)
    }

    function showToast(member) {
        clearTimeout(toastTimer.current)
        setToast({ memberId: member.id, name: `${member.firstName} ${member.lastName}`, date: checkInDate })
        toastTimer.current = setTimeout(() => setToast(null), 7000)
    }

    // One tap: check in, confirm with a banner, clear the search for the next person.
    // It doesn't wait for the server, so a slow connection never freezes the screen.
    function runCheckIn(member) {
        if (busyId === member.id) return
        setBusyId(member.id)
        setTimeout(() => setBusyId(null), 800)

        handleCheckIn(member.id, member.passType, checkInDate).catch(err => {
            console.error('Check-in failed:', err)
            alert(`Check-in for ${member.firstName} ${member.lastName} may not have saved. Please check the connection and try again.`)
        })

        showToast(member)
        setSearch('')
        if (searchRef.current) searchRef.current.focus()
    }

    function runUndo(member, date) {
        handleUndoCheckIn(member.id, member.passType, member, date).catch(err => {
            console.error('Undo failed:', err)
            alert('Could not undo that check-in. Please try again.')
        })
    }

    function undoFromToast() {
        if (!toast) return
        const member = members.find(m => m.id === toast.memberId)
        if (member) runUndo(member, toast.date)
        clearToast()
    }

    // Kiosk registrations arrive as "PENDING". Staff mark them paid when money is collected.
    function markPaid(member) {
        const method = (member.paymentMethod || 'cash').toUpperCase()
        return updateDoc(doc(db, 'members', member.id), {
            transactionId: method,
            paidAt: new Date().toISOString(),
            markedPaidBy: user?.email || 'unknown'
        }).catch(err => {
            console.error('Mark paid failed:', err)
            alert('Could not mark this member as paid. Please try again.')
        })
    }

    function runPaidCheckIn(member) {
        markPaid(member)
        runCheckIn(member)
    }

    function startAddMember(prefill = {}, fromCheckInScreen = false) {
        setManualForm({
            firstName: prefill.firstName || '',
            lastName: prefill.lastName || '',
            phone: (prefill.phone || '').replace(/\D/g, '').slice(0, 10),
            email: prefill.email || '',
            passType: activePasses[0]?.key || '',
            paymentMethod: 'cash'
        })
        setManualErrors({})
        setShowManualEntry(true)
        setFromCheckIn(fromCheckInScreen)
        setTab('members')
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function addFromSearch() {
        const text = search.trim()
        const prefill = {}
        if (/^[\d\s\-().+]+$/.test(text)) {
            prefill.phone = text
        } else {
            const words = text.split(/\s+/)
            prefill.firstName = words[0] || ''
            prefill.lastName = words.slice(1).join(' ')
        }
        startAddMember(prefill, true)
    }

    async function handleToggleInstructor(instructorName, date) {
        const safeId = `${instructorName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}`
        const ref = doc(db, 'instructorLog', safeId)
        const alreadyTaught = instructorLog.some(l => l.id === safeId)
        try {
            if (alreadyTaught) {
                await deleteDoc(ref)
            } else {
                await setDoc(ref, {
                    name: instructorName,
                    date,
                    loggedBy: user?.email || 'unknown',
                    loggedAt: new Date().toISOString()
                })
            }
        } catch (e) {
            console.error('Error toggling instructor:', e)
        }
    }

    function taughtOnDate(instructorName, date) {
        const safeId = `${instructorName.replace(/[^a-zA-Z0-9]/g, '_')}_${date}`
        return instructorLog.some(l => l.id === safeId)
    }

    async function handleDelete(memberId) {
        if (window.confirm('Are you sure you want to delete this member? This cannot be undone.')) {
            await deleteDoc(doc(db, 'members', memberId))
        }
    }

    function isActive(member) {
        if (member.passType === 'day') {
            const checkIns = member.checkIns || []
            return checkIns.length === 0 && new Date(member.expiryDate) >= new Date()
        }
        return new Date(member.expiryDate) >= new Date()
    }

    function isPending(member) {
        return member.transactionId === 'PENDING'
    }

    function getStatusLabel(member) {
        if (isPending(member)) return 'Pending payment'
        if (member.passType === 'day' && (member.checkIns || []).length > 0) return 'Used'
        if (!isActive(member)) return 'Expired'
        return 'Active'
    }

    function getStatusClass(member) {
        if (isPending(member)) return 'status-pending'
        if (member.passType === 'day' && (member.checkIns || []).length > 0) return 'status-used'
        if (!isActive(member)) return 'status-expired'
        return 'status-active'
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString()
    }

    function formatTime(dateString) {
        return new Date(dateString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    }

    function getDaysLeft(member) {
        const exp = new Date(member.expiryDate)
        if (isNaN(exp)) return null
        return Math.ceil((exp - new Date()) / (1000 * 60 * 60 * 24))
    }

    function isExpiringSoon(member) {
        if (!isActive(member)) return false
        const days = getDaysLeft(member)
        return days !== null && days <= 5
    }

    function getExpiryNote(member) {
        if (member.passType === 'day' && (member.checkIns || []).length > 0) return 'Pass already used'
        const days = getDaysLeft(member)
        if (days === null) return ''
        if (!isActive(member)) return `Expired ${formatDate(member.expiryDate)}`
        if (days <= 5) return `Expires in ${Math.max(days, 0)} day${days === 1 ? '' : 's'}`
        return `Expires ${formatDate(member.expiryDate)}`
    }

    function getPaymentLabel(member) {
        if (member.transactionId === 'CASH') return 'Cash'
        if (member.transactionId === 'VENMO') return 'Venmo'
        if (member.transactionId === 'PAYPAL') return 'PayPal'
        if (member.transactionId === 'PENDING') {
            const labels = { cash: 'Cash', venmo: 'Venmo', paypal: 'PayPal' }
            return `Pending (${labels[member.paymentMethod] || '?'})`
        }
        return 'PayPal'
    }

    function getOwedNote(member) {
        const labels = { cash: 'Cash', venmo: 'Venmo', paypal: 'PayPal' }
        return `Owes $${member.amount} (${labels[member.paymentMethod] || 'method not chosen'})`
    }

    function getCheckInCountForAdmin(adminEmail, date) {
        return checkInLog.filter(l => l.adminEmail === adminEmail && l.date === date).length
    }

    function exportToCSV() {
        const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Pass Type', 'Amount', 'Purchase Date', 'Expiry Date', 'Status', 'Total Attendance', 'Payment']
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
            getAttendanceCount(m),
            getPaymentLabel(m)
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

    // ---- Derived data ----

    const filteredMembers = members
        .filter(m => {
            if (!matchesQuery(m, memberSearch)) return false
            if (filter === 'active') return isActive(m)
            if (filter === 'expired') return !isActive(m)
            if (filter === 'day') return m.passType === 'day'
            if (filter === 'monthly') return m.passType !== 'day'
            if (filter === 'today') return isCheckedInToday(m)
            return true
        })
        .sort((a, b) => {
            if (sortBy === 'alpha') {
                const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
                const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
                return nameA.localeCompare(nameB)
            }
            if (sortBy === 'date') {
                return new Date(b.purchaseDate) - new Date(a.purchaseDate)
            }
            return 0
        })

    const todayCount = members.filter(m => isCheckedInToday(m)).length
    const attendanceDateCount = members.filter(m => isCheckedInOnDate(m, attendanceDate)).length
    const isCheckInDateToday = checkInDate === getTodayString()
    const checkInDateLabel = new Date(checkInDate + 'T12:00:00').toLocaleDateString()
    const canViewStaff = user && STAFF_VIEW_EMAILS.includes(user.email)

    const staffOnDate = shifts.filter(s => s.date === staffDate)
    const checkInsOnStaffDate = checkInLog.filter(l => l.date === staffDate)
    const staffEmailsOnDate = [...new Set([
        ...staffOnDate.map(s => s.email),
        ...checkInsOnStaffDate.map(l => l.adminEmail)
    ])]

    // Check-in screen data
    const searchText = search.trim()
    const allMatches = searchText === ''
        ? []
        : members
            .filter(m => matchesQuery(m, searchText))
            .sort((a, b) => {
                const aActive = isActive(a) ? 0 : 1
                const bActive = isActive(b) ? 0 : 1
                if (aActive !== bActive) return aActive - bActive
                return `${a.firstName} ${a.lastName}`.toLowerCase().localeCompare(`${b.firstName} ${b.lastName}`.toLowerCase())
            })
    const searchResults = allMatches.slice(0, MAX_RESULTS)

    const loggedTimes = {}
    checkInLog.forEach(l => {
        if (l.date === checkInDate && l.memberId) loggedTimes[l.memberId] = l.loggedAt || ''
    })
    const checkedInList = members
        .filter(m => isCheckedInOnDate(m, checkInDate))
        .sort((a, b) => (loggedTimes[b.id] || '').localeCompare(loggedTimes[a.id] || ''))

    const activeInstructors = instructors.filter(i => i.active)
    const taughtNames = activeInstructors.filter(i => taughtOnDate(i.name, checkInDate)).map(i => i.name)

    function renderCheckInCard(member) {
        const checkedIn = isCheckedInOnDate(member, checkInDate)
        const blocked = !isActive(member) && isCheckInDateToday && !checkedIn
        const soon = isExpiringSoon(member)
        const pending = isPending(member) && !checkedIn

        return (
            <div
                key={member.id}
                className={`ci-card ${checkedIn ? 'ci-card-done' : ''} ${blocked ? 'ci-card-blocked' : ''}`}
            >
                <div className='ci-card-info'>
                    <div className='ci-card-name'>{member.firstName} {member.lastName}</div>
                    <div className='ci-card-sub'>{member.passLabel} · {formatPhone(member.phone)}</div>
                    <div className='ci-card-sub'>
                        <span className={`status-badge ${getStatusClass(member)}`}>{getStatusLabel(member)}</span>
                        <span className={soon ? 'ci-warn' : ''}>{getExpiryNote(member)}</span>
                        <span>{getAttendanceCount(member)} visit{getAttendanceCount(member) === 1 ? '' : 's'}</span>
                    </div>
                    {pending && <div className='ci-card-sub ci-warn'>{getOwedNote(member)}</div>}
                </div>
                <div className='ci-card-action'>
                    {checkedIn ? (
                        <>
                            <span className='ci-done'>✓ Checked in</span>
                            <button className='checkin-btn checkin-btn-undo' onClick={() => runUndo(member, checkInDate)}>
                                Undo
                            </button>
                        </>
                    ) : blocked ? (
                        <button className='ci-btn ci-btn-renew' onClick={() => startAddMember(member, true)}>
                            Renew / new pass
                        </button>
                    ) : pending ? (
                        <button
                            className='ci-btn'
                            onClick={() => runPaidCheckIn(member)}
                            disabled={busyId === member.id}
                        >
                            Paid · check in
                        </button>
                    ) : (
                        <button
                            className='ci-btn'
                            onClick={() => runCheckIn(member)}
                            disabled={busyId === member.id}
                        >
                            Check in
                        </button>
                    )}
                </div>
            </div>
        )
    }

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
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className='admin-current-user'>{getStaffName(user.email)}</span>
                    <button className='admin-btn' onClick={() => navigate('/kiosk')}>
                        Kiosk Mode
                    </button>
                    <button className='admin-btn-outline' onClick={() => signOut(auth)}>
                        Log Out
                    </button>
                </div>
            </div>

            <div className='ci-tabs'>
                <button
                    type='button'
                    className={`ci-tab ${tab === 'members' ? 'active' : ''}`}
                    onClick={() => setTab('members')}
                >
                    Members
                </button>
                <button
                    type='button'
                    className={`ci-tab ${tab === 'checkin' ? 'active' : ''}`}
                    onClick={() => setTab('checkin')}
                >
                    Check In
                </button>
                <button
                    type='button'
                    className={`ci-tab ${tab === 'activity' ? 'active' : ''}`}
                    onClick={() => setTab('activity')}
                >
                    Activity
                </button>
            </div>

            {/* ============ CHECK IN ============ */}
            {tab === 'checkin' && (
                <div className='ci-screen'>
                    <div className={`ci-datebar ${!isCheckInDateToday ? 'ci-datebar-warn' : ''}`}>
                        <span className='ci-datebar-text'>
                            {isCheckInDateToday ? 'Checking in for today' : `Checking in for ${checkInDateLabel}`}
                        </span>
                        <span className='ci-count-chip'>{checkedInList.length} checked in</span>
                        <div className='ci-datebar-actions'>
                            {!isCheckInDateToday && (
                                <button
                                    type='button'
                                    className='ci-link'
                                    onClick={() => { setCheckInDate(getTodayString()); setShowDatePicker(false) }}
                                >
                                    Back to today
                                </button>
                            )}
                            <button type='button' className='ci-link' onClick={() => setShowDatePicker(v => !v)}>
                                {showDatePicker ? 'Done' : 'Change date'}
                            </button>
                        </div>
                    </div>
                    {showDatePicker && (
                        <div className='ci-datepicker'>
                            <input
                                type='date'
                                value={checkInDate}
                                max={getTodayString()}
                                onChange={e => setCheckInDate(e.target.value || getTodayString())}
                            />
                        </div>
                    )}

                    <div className='admin-search ci-search'>
                        <input
                            ref={searchRef}
                            type='text'
                            inputMode='search'
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder='Search name or phone number'
                            className='admin-search-input ci-search-input'
                        />
                        {search && (
                            <button type='button' className='ci-clear' onClick={() => { setSearch(''); if (searchRef.current) searchRef.current.focus() }}>
                                ✕
                            </button>
                        )}
                    </div>

                    {searchText !== '' ? (
                        <div className='ci-results'>
                            {searchResults.length === 0 ? (
                                <div className='ci-noresults'>
                                    <p>No member found for "{searchText}".</p>
                                    <button type='button' className='ci-btn' onClick={addFromSearch}>
                                        + Add as new member
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {searchResults.map(renderCheckInCard)}
                                    {allMatches.length > MAX_RESULTS && (
                                        <p className='staff-empty'>
                                            Showing the first {MAX_RESULTS} of {allMatches.length}. Keep typing to narrow it down.
                                        </p>
                                    )}
                                    <button type='button' className='ci-link ci-link-center' onClick={addFromSearch}>
                                        Not listed? Add a new member
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className='ci-recent'>
                            <h3 className='ci-section-title'>
                                Checked in {isCheckInDateToday ? 'today' : `on ${checkInDateLabel}`}
                                <span className='ci-count'>{checkedInList.length}</span>
                            </h3>
                            {checkedInList.length === 0 ? (
                                <p className='staff-empty'>No one yet. Search above to check someone in.</p>
                            ) : (
                                <div className='ci-recent-list'>
                                    {checkedInList.map(member => (
                                        <div key={member.id} className='ci-recent-row'>
                                            <div>
                                                <span className='ci-recent-name'>{member.firstName} {member.lastName}</span>
                                                <span className='ci-recent-meta'>
                                                    {member.passLabel}{loggedTimes[member.id] ? ` · ${formatTime(loggedTimes[member.id])}` : ''}
                                                </span>
                                            </div>
                                            <button
                                                className='checkin-btn checkin-btn-undo'
                                                onClick={() => runUndo(member, checkInDate)}
                                            >
                                                Undo
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <details className='ci-details'>
                        <summary>
                            Who taught {isCheckInDateToday ? 'today' : `on ${checkInDateLabel}`}:{' '}
                            <strong>{taughtNames.length > 0 ? taughtNames.join(', ') : 'not set'}</strong>
                        </summary>
                        {activeInstructors.length === 0 ? (
                            <p className='staff-empty'>No instructors set up yet. Add them in the Owner Portal.</p>
                        ) : (
                            <div className='instructor-toggle-list'>
                                {activeInstructors.map(inst => {
                                    const taught = taughtOnDate(inst.name, checkInDate)
                                    return (
                                        <button
                                            key={inst.id}
                                            className={`instructor-toggle-btn ${taught ? 'taught' : ''}`}
                                            onClick={() => handleToggleInstructor(inst.name, checkInDate)}
                                        >
                                            {taught ? '✓ ' : ''}{inst.name}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </details>
                </div>
            )}

            {/* ============ MEMBERS ============ */}
            {tab === 'members' && (
                <div className='ci-members'>
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
                            <h3>{todayCount}</h3>
                        </div>
                    </div>

                    <div className='admin-search'>
                        <input
                            type='text'
                            value={memberSearch}
                            onChange={e => setMemberSearch(e.target.value)}
                            placeholder='Search members by name, phone or email...'
                            className='admin-search-input'
                        />
                    </div>

                    <div className='admin-controls'>
                        <div className='admin-filters'>
                            {['all', 'active', 'expired', 'today', 'day', 'monthly'].map(f => (
                                <button
                                    key={f}
                                    className={`admin-filter-btn ${filter === f ? 'active' : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'today' ? 'Checked In Today' : f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                        <div className='admin-actions'>
                            <div className='admin-sort'>
                                <button
                                    className={`admin-filter-btn ${sortBy === 'alpha' ? 'active' : ''}`}
                                    onClick={() => setSortBy('alpha')}
                                >
                                    A–Z
                                </button>
                                <button
                                    className={`admin-filter-btn ${sortBy === 'date' ? 'active' : ''}`}
                                    onClick={() => setSortBy('date')}
                                >
                                    By Date
                                </button>
                            </div>
                            <button
                                className='admin-btn'
                                onClick={() => {
                                    if (showManualEntry) {
                                        setShowManualEntry(false)
                                        setFromCheckIn(false)
                                    } else {
                                        startAddMember({}, false)
                                    }
                                }}
                            >
                                {showManualEntry ? 'Cancel' : '+ Add Member'}
                            </button>
                            <button className='admin-btn' onClick={exportToCSV}>
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {showManualEntry && (
                        <div className='admin-manual-entry'>
                            <h3>Add Member</h3>
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
                                        onChange={e => {
                                            setManualForm({ ...manualForm, passType: e.target.value })
                                            setManualErrors({ ...manualErrors, passType: '' })
                                        }}
                                    >
                                        <option value='' disabled>Select a pass</option>
                                        {activePasses.map(pass => (
                                            <option key={pass.id} value={pass.key}>
                                                {pass.label} — ${pass.amount}
                                            </option>
                                        ))}
                                    </select>
                                    {manualErrors.passType && <span className='form-error'>{manualErrors.passType}</span>}
                                </div>
                                <div className='admin-form-group'>
                                    <label>Payment Method</label>
                                    <select
                                        value={manualForm.paymentMethod}
                                        onChange={e => setManualForm({ ...manualForm, paymentMethod: e.target.value })}
                                    >
                                        <option value='cash'>Cash</option>
                                        <option value='venmo'>Venmo</option>
                                        <option value='paypal'>PayPal</option>
                                    </select>
                                </div>
                                <button className='admin-btn' onClick={handleManualEntry}>
                                    Add Member
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Desktop table */}
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
                                    <th>Attendance</th>
                                    <th>{isCheckInDateToday ? 'Today' : 'Selected Date'}</th>
                                    <th>Action</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan='10' className='admin-empty'>No members found</td>
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
                                            <td>{getPaymentLabel(member)}</td>
                                            <td>{getAttendanceCount(member)}</td>
                                            <td>{isCheckedInOnDate(member, checkInDate) ? '✓ Yes' : 'No'}</td>
                                            <td>
                                                {isCheckedInOnDate(member, checkInDate) ? (
                                                    <button
                                                        className='checkin-btn checkin-btn-undo'
                                                        onClick={() => runUndo(member, checkInDate)}
                                                    >
                                                        Undo
                                                    </button>
                                                ) : isPending(member) ? (
                                                    <button className='checkin-btn' onClick={() => markPaid(member)}>
                                                        Mark paid
                                                    </button>
                                                ) : (
                                                    <button
                                                        className='checkin-btn'
                                                        onClick={() => runCheckIn(member)}
                                                        disabled={!isActive(member) && isCheckInDateToday}
                                                        style={{ opacity: (!isActive(member) && isCheckInDateToday) ? 0.4 : 1, cursor: (!isActive(member) && isCheckInDateToday) ? 'not-allowed' : 'pointer' }}
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

                    {/* Mobile list */}
                    <div className='admin-mobile-list'>
                        {filteredMembers.length === 0 ? (
                            <p className='admin-empty'>No members found</p>
                        ) : (
                            filteredMembers.map(member => (
                                <div key={member.id} className={`admin-mobile-card ${!isActive(member) ? 'expired-card' : ''}`}>
                                    <div>
                                        <div className='admin-mobile-top'>
                                            <span className='admin-mobile-name'>{member.firstName} {member.lastName}</span>
                                            <span className={`status-badge ${getStatusClass(member)}`}>
                                                {getStatusLabel(member)}
                                            </span>
                                        </div>
                                        <div className='admin-mobile-meta'>
                                            <span>{member.passLabel}</span>
                                            <span>Exp: {formatDate(member.expiryDate)}</span>
                                            <span>{getPaymentLabel(member)}</span>
                                            <span>Attended: {getAttendanceCount(member)}x</span>
                                        </div>
                                    </div>
                                    <div className='admin-mobile-buttons'>
                                        {isCheckedInOnDate(member, checkInDate) ? (
                                            <button
                                                className='checkin-btn checkin-btn-undo'
                                                onClick={() => runUndo(member, checkInDate)}
                                            >
                                                Undo
                                            </button>
                                        ) : isPending(member) ? (
                                            <button className='checkin-btn' onClick={() => markPaid(member)}>
                                                Mark paid
                                            </button>
                                        ) : (
                                            <button
                                                className='checkin-btn'
                                                onClick={() => runCheckIn(member)}
                                                disabled={!isActive(member) && isCheckInDateToday}
                                                style={{ opacity: (!isActive(member) && isCheckInDateToday) ? 0.4 : 1, cursor: (!isActive(member) && isCheckInDateToday) ? 'not-allowed' : 'pointer' }}
                                            >
                                                Check In
                                            </button>
                                        )}
                                        <button
                                            className='delete-btn'
                                            onClick={() => handleDelete(member.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ============ ACTIVITY ============ */}
            {tab === 'activity' && (
                <div className='ci-activity'>
                    {/* Staff Activity — only visible to authorized emails */}
                    {canViewStaff && (
                        <div className='admin-staff'>
                            <h3>Staff Activity</h3>
                            <div className='staff-lookup'>
                                <input
                                    type='date'
                                    value={staffDate}
                                    max={getTodayString()}
                                    onChange={e => setStaffDate(e.target.value)}
                                />
                            </div>
                            {staffEmailsOnDate.length === 0 ? (
                                <p className='staff-empty'>No staff activity on {new Date(staffDate + 'T12:00:00').toLocaleDateString()}</p>
                            ) : (
                                <div className='staff-list'>
                                    {staffEmailsOnDate.map(emailAddr => {
                                        const shift = staffOnDate.find(s => s.email === emailAddr)
                                        return (
                                            <div key={emailAddr} className='staff-row'>
                                                <span className='staff-name'>{getStaffName(emailAddr)}</span>
                                                <span className='staff-meta'>
                                                    {shift ? `Signed in ${formatTime(shift.signInTime)}` : 'No sign-in record'}
                                                </span>
                                                <span className='staff-count'>{getCheckInCountForAdmin(emailAddr, staffDate)} check-ins</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    <div className='admin-attendance'>
                        <h3>Attendance Lookup</h3>
                        <div className='attendance-lookup'>
                            <input
                                type='date'
                                value={attendanceDate}
                                onChange={e => setAttendanceDate(e.target.value)}
                            />
                            <p>{attendanceDateCount} member{attendanceDateCount !== 1 ? 's' : ''} checked in on {new Date(attendanceDate + 'T12:00:00').toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className='ci-toast' role='status'>
                    <span>✓ {toast.name} checked in</span>
                    <button type='button' onClick={undoFromToast}>Undo</button>
                </div>
            )}
        </div>
    )
}