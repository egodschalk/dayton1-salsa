import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { usePassTypes, createPassType, updatePassType } from '../hooks/usePassTypes'
import './Owner.css'

const OWNER_EMAILS = ['dayton1salsa@gmail.com', 'ahiciano@icanoki.com']

const DURATION_OPTIONS = [
    { value: 'day', label: 'Single Visit / Day Pass (used up after one visit)' },
    { value: 'month', label: 'Monthly Pass (valid for the month)' }
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const emptyForm = {
    label: '',
    amount: '',
    duration: 'day',
    visibility: { mode: 'always', windowStartDays: 9, windowEndDays: 5, startDate: '', endDate: '', days: [] }
}

function getStaffName(email) {
    if (!email) return 'Unknown'
    const namePart = email.split('@')[0]
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString()
}

export default function Owner() {
    const navigate = useNavigate()
    const { passTypes, loading: passLoading } = usePassTypes()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')

    // Pricing editor state
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)

    // Stats data
    const [members, setMembers] = useState([])
    const [shifts, setShifts] = useState([])
    const [checkInLog, setCheckInLog] = useState([])

    // Stats filters
    const [rangeStart, setRangeStart] = useState('')
    const [rangeEnd, setRangeEnd] = useState('')
    const [staffViewMode, setStaffViewMode] = useState('byStaff') // 'byStaff' | 'byDate'
    const [expandedStaff, setExpandedStaff] = useState(null)
    const [expandedDate, setExpandedDate] = useState(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            setAuthLoading(false)
        })
        return unsubscribe
    }, [])

    // Load stats collections once authed as owner
    useEffect(() => {
        if (!user || !OWNER_EMAILS.includes(user.email)) return
        const unsubMembers = onSnapshot(query(collection(db, 'members'), orderBy('purchaseDate', 'desc')), (snap) => {
            setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        const unsubShifts = onSnapshot(collection(db, 'shifts'), (snap) => {
            setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        const unsubLog = onSnapshot(collection(db, 'checkInLog'), (snap) => {
            setCheckInLog(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        })
        return () => { unsubMembers(); unsubShifts(); unsubLog() }
    }, [user])

    async function handleLogin(e) {
        e.preventDefault()
        setLoginError('')
        try {
            await signInWithEmailAndPassword(auth, email, password)
        } catch (error) {
            setLoginError('Invalid email or password. Please try again.')
        }
    }

    // ===== Pricing editor handlers =====
    function startNew() {
        setEditingId('new')
        setForm(emptyForm)
        setFormError('')
    }

    function startEdit(pass) {
        setEditingId(pass.id)
        setForm({
            label: pass.label,
            amount: pass.amount,
            duration: pass.duration,
            visibility: {
                mode: pass.visibility?.mode || 'always',
                windowStartDays: pass.visibility?.windowStartDays ?? 9,
                windowEndDays: pass.visibility?.windowEndDays ?? 5,
                startDate: pass.visibility?.startDate || '',
                endDate: pass.visibility?.endDate || '',
                days: pass.visibility?.days || []
            }
        })
        setFormError('')
    }

    function cancelEdit() {
        setEditingId(null)
        setForm(emptyForm)
        setFormError('')
    }

    function validateForm() {
        if (!form.label.trim()) return 'Pass name is required.'
        const amt = parseFloat(form.amount)
        if (isNaN(amt) || amt <= 0) return 'Price must be greater than $0.'
        if (form.visibility.mode === 'dateRange') {
            if (!form.visibility.startDate || !form.visibility.endDate) return 'Date range needs both a start and end date.'
            if (form.visibility.startDate > form.visibility.endDate) return 'Start date must be before end date.'
        }
        if (form.visibility.mode === 'daysOfWeek' && form.visibility.days.length === 0) {
            return 'Pick at least one day of the week.'
        }
        return ''
    }

    function buildVisibility(v) {
        if (v.mode === 'always') return { mode: 'always' }
        if (v.mode === 'monthlyWindow') return { mode: 'monthlyWindow', windowStartDays: Number(v.windowStartDays), windowEndDays: Number(v.windowEndDays) }
        if (v.mode === 'dateRange') return { mode: 'dateRange', startDate: v.startDate, endDate: v.endDate }
        if (v.mode === 'daysOfWeek') return { mode: 'daysOfWeek', days: v.days }
        return { mode: 'always' }
    }

    async function handleSave() {
        const err = validateForm()
        if (err) { setFormError(err); return }
        setSaving(true)
        try {
            const amount = parseFloat(form.amount).toFixed(2)
            const payload = {
                label: form.label.trim(),
                amount,
                duration: form.duration,
                visibility: buildVisibility(form.visibility)
            }
            if (editingId === 'new') {
                await createPassType(payload, passTypes)
            } else {
                await updatePassType(editingId, payload)
            }
            cancelEdit()
        } catch (e) {
            setFormError('Error saving: ' + e.message)
        }
        setSaving(false)
    }

    async function toggleActive(pass) {
        const verb = pass.active ? 'deactivate' : 'reactivate'
        if (!window.confirm(`Are you sure you want to ${verb} "${pass.label}"?`)) return
        try {
            await updatePassType(pass.id, { active: !pass.active })
        } catch (e) {
            alert('Error: ' + e.message)
        }
    }

    function visibilitySummary(pass) {
        const v = pass.visibility || { mode: 'always' }
        if (v.mode === 'always') return 'Always visible'
        if (v.mode === 'monthlyWindow') return `First ${v.windowStartDays} & last ${v.windowEndDays} days of month`
        if (v.mode === 'dateRange') return `${v.startDate} to ${v.endDate}`
        if (v.mode === 'daysOfWeek') return (v.days || []).map(d => DAY_NAMES[d]).join(', ')
        return ''
    }

    function toggleDay(dayIndex) {
        const days = form.visibility.days.includes(dayIndex)
            ? form.visibility.days.filter(d => d !== dayIndex)
            : [...form.visibility.days, dayIndex].sort()
        setForm({ ...form, visibility: { ...form.visibility, days } })
    }

    // ===== Stats computation =====
    function inRange(dateStr) {
        if (rangeStart && dateStr < rangeStart) return false
        if (rangeEnd && dateStr > rangeEnd) return false
        return true
    }

    // Member is confirmed (paid) if not PENDING
    function isConfirmed(member) {
        return member.transactionId && member.transactionId !== 'PENDING'
    }

    // Filter members by purchase date range
    const filteredMembers = members.filter(m => {
        const d = m.purchaseDate ? m.purchaseDate.slice(0, 10) : ''
        return inRange(d)
    })

    // Filter check-ins by date range
    const filteredCheckIns = checkInLog.filter(l => inRange(l.date))
    const filteredShifts = shifts.filter(s => inRange(s.date))

    // Revenue (confirmed only)
    const totalRevenue = filteredMembers
        .filter(isConfirmed)
        .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)

    // Attendance by day of week — counts unique check-in dates per weekday
    const attendanceByDow = DAY_NAMES_FULL.map((name, dow) => {
        const checkInsThisDow = filteredCheckIns.filter(l => {
            const d = new Date(l.date + 'T12:00:00')
            return d.getDay() === dow
        })
        const uniqueDates = [...new Set(checkInsThisDow.map(l => l.date))]
        const total = checkInsThisDow.length
        const classCount = uniqueDates.length
        const avg = classCount > 0 ? (total / classCount) : 0
        return { name, dow, total, classCount, avg }
    }).filter(row => row.total > 0)

    // Pass type breakdown — count + revenue per pass key
    const passBreakdown = passTypes.map(pass => {
        const matching = filteredMembers.filter(m => m.passType === pass.key)
        const confirmed = matching.filter(isConfirmed)
        const revenue = confirmed.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
        return { label: pass.label, key: pass.key, count: matching.length, confirmedCount: confirmed.length, revenue }
    }).filter(row => row.count > 0)

    // Any members with a passType no longer in passTypes (deleted pass) — group as "Other"
    const knownKeys = passTypes.map(p => p.key)
    const orphanMembers = filteredMembers.filter(m => !knownKeys.includes(m.passType))
    if (orphanMembers.length > 0) {
        const confirmed = orphanMembers.filter(isConfirmed)
        passBreakdown.push({
            label: 'Other / Removed passes',
            key: '_orphan',
            count: orphanMembers.length,
            confirmedCount: confirmed.length,
            revenue: confirmed.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
        })
    }

    // Staff list (emails) appearing in filtered shifts or check-ins
    const staffEmails = [...new Set([
        ...filteredShifts.map(s => s.email),
        ...filteredCheckIns.map(l => l.adminEmail)
    ])]

    // Per-staff: their check-ins
    function checkInsForStaff(emailAddr) {
        return filteredCheckIns.filter(l => l.adminEmail === emailAddr)
    }

    // Dates that had activity (for by-date view)
    const activeDates = [...new Set([
        ...filteredShifts.map(s => s.date),
        ...filteredCheckIns.map(l => l.date)
    ])].sort().reverse()

    function staffOnDate(date) {
        return [...new Set([
            ...filteredShifts.filter(s => s.date === date).map(s => s.email),
            ...filteredCheckIns.filter(l => l.date === date).map(l => l.adminEmail)
        ])]
    }

    function checkInsForStaffOnDate(emailAddr, date) {
        return filteredCheckIns.filter(l => l.adminEmail === emailAddr && l.date === date)
    }

    function clearFilters() {
        setRangeStart('')
        setRangeEnd('')
    }

    // ===== Render =====
    if (authLoading) return <div className='owner-loading'>Loading...</div>

    if (!user) return (
        <div className='owner-login'>
            <h2>Owner Login</h2>
            <form onSubmit={handleLogin}>
                <div className='owner-form-group'>
                    <label>Email</label>
                    <input type='email' value={email} onChange={e => setEmail(e.target.value)} placeholder='Email address' required />
                </div>
                <div className='owner-form-group'>
                    <label>Password</label>
                    <input type='password' value={password} onChange={e => setPassword(e.target.value)} placeholder='Password' required />
                </div>
                {loginError && <p className='owner-error'>{loginError}</p>}
                <button type='submit' className='owner-btn'>Login</button>
            </form>
        </div>
    )

    if (!OWNER_EMAILS.includes(user.email)) return (
        <div className='owner-blocked'>
            <h2>Access Denied</h2>
            <p>This area is restricted to owners only.</p>
            <button className='owner-btn-outline' onClick={() => signOut(auth)}>Log Out</button>
        </div>
    )

    const renderForm = () => (
        <div className='owner-edit-form'>
            <div className='owner-form-group'>
                <label>Pass Name</label>
                <input type='text' value={form.label}
                    onChange={e => setForm({ ...form, label: e.target.value })}
                    placeholder='e.g. Social Night, Day Pass, Monthly 1 Style' />
            </div>
            <div className='owner-form-group'>
                <label>Price ($)</label>
                <input type='number' step='0.01' min='0' value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })}
                    placeholder='25.00' />
            </div>
            <div className='owner-form-group'>
                <label>Pass Behavior</label>
                <select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
                    {DURATION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
            </div>
            <div className='owner-form-group'>
                <label>When Should This Pass Be Available?</label>
                <select value={form.visibility.mode}
                    onChange={e => setForm({ ...form, visibility: { ...form.visibility, mode: e.target.value } })}>
                    <option value='always'>Always</option>
                    <option value='monthlyWindow'>Start &amp; end of each month</option>
                    <option value='dateRange'>Specific date range</option>
                    <option value='daysOfWeek'>Specific days of the week</option>
                </select>
            </div>

            {form.visibility.mode === 'monthlyWindow' && (
                <div className='owner-visibility-fields'>
                    <div className='owner-form-group'>
                        <label>Show first ___ days of month</label>
                        <input type='number' min='1' max='28' value={form.visibility.windowStartDays}
                            onChange={e => setForm({ ...form, visibility: { ...form.visibility, windowStartDays: e.target.value } })} />
                    </div>
                    <div className='owner-form-group'>
                        <label>Show last ___ days of month</label>
                        <input type='number' min='1' max='28' value={form.visibility.windowEndDays}
                            onChange={e => setForm({ ...form, visibility: { ...form.visibility, windowEndDays: e.target.value } })} />
                    </div>
                </div>
            )}

            {form.visibility.mode === 'dateRange' && (
                <div className='owner-visibility-fields'>
                    <div className='owner-form-group'>
                        <label>Start Date</label>
                        <input type='date' value={form.visibility.startDate}
                            onChange={e => setForm({ ...form, visibility: { ...form.visibility, startDate: e.target.value } })} />
                    </div>
                    <div className='owner-form-group'>
                        <label>End Date</label>
                        <input type='date' value={form.visibility.endDate}
                            onChange={e => setForm({ ...form, visibility: { ...form.visibility, endDate: e.target.value } })} />
                    </div>
                </div>
            )}

            {form.visibility.mode === 'daysOfWeek' && (
                <div className='owner-form-group'>
                    <label>Days</label>
                    <div className='owner-day-toggles'>
                        {DAY_NAMES.map((name, idx) => (
                            <button type='button' key={idx}
                                className={`owner-day-toggle ${form.visibility.days.includes(idx) ? 'selected' : ''}`}
                                onClick={() => toggleDay(idx)}>
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {formError && <p className='owner-error'>{formError}</p>}

            <div className='owner-form-buttons'>
                <button className='owner-btn-outline' onClick={cancelEdit} disabled={saving}>Cancel</button>
                <button className='owner-btn' onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Pass'}
                </button>
            </div>
        </div>
    )

    return (
        <div className='owner-page'>
            <div className='owner-header'>
                <h2>Owner Portal</h2>
                <div className='owner-header-actions'>
                    <button className='owner-btn-outline' onClick={() => navigate('/admin')}>Admin Dashboard</button>
                    <button className='owner-btn-outline' onClick={() => signOut(auth)}>Log Out</button>
                </div>
            </div>

            {/* ===== STATS ===== */}
            <div className='owner-section'>
                <div className='owner-section-header'>
                    <h3>Statistics</h3>
                </div>

                {/* Filter bar */}
                <div className='owner-filter-bar'>
                    <div className='owner-filter-group'>
                        <label>From</label>
                        <input type='date' value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
                    </div>
                    <div className='owner-filter-group'>
                        <label>To</label>
                        <input type='date' value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
                    </div>
                    {(rangeStart || rangeEnd) && (
                        <button className='owner-btn-small-outline' onClick={clearFilters}>Clear (All Time)</button>
                    )}
                </div>

                {/* Summary cards */}
                <div className='owner-stat-cards'>
                    <div className='owner-stat-card'>
                        <p>Revenue</p>
                        <h4>${totalRevenue.toFixed(2)}</h4>
                    </div>
                    <div className='owner-stat-card'>
                        <p>Members</p>
                        <h4>{filteredMembers.length}</h4>
                    </div>
                    <div className='owner-stat-card'>
                        <p>Check-Ins</p>
                        <h4>{filteredCheckIns.length}</h4>
                    </div>
                    <div className='owner-stat-card'>
                        <p>Active Passes</p>
                        <h4>{passTypes.filter(p => p.active).length}</h4>
                    </div>
                </div>

                {/* Attendance by day of week */}
                <div className='owner-stat-block'>
                    <h4 className='owner-stat-block-title'>Attendance by Day of Week</h4>
                    {attendanceByDow.length === 0 ? (
                        <p className='owner-hint'>No check-ins in this period.</p>
                    ) : (
                        <div className='owner-dow-list'>
                            {attendanceByDow.map(row => (
                                <div key={row.dow} className='owner-dow-row'>
                                    <span className='owner-dow-name'>{row.name}s</span>
                                    <span className='owner-dow-stat'>{row.avg.toFixed(1)} avg</span>
                                    <span className='owner-dow-meta'>{row.total} total · {row.classCount} {row.classCount === 1 ? 'class' : 'classes'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pass type breakdown */}
                <div className='owner-stat-block'>
                    <h4 className='owner-stat-block-title'>Pass Type Breakdown</h4>
                    {passBreakdown.length === 0 ? (
                        <p className='owner-hint'>No passes sold in this period.</p>
                    ) : (
                        <div className='owner-breakdown-list'>
                            {passBreakdown.map(row => (
                                <div key={row.key} className='owner-breakdown-row'>
                                    <span className='owner-breakdown-label'>{row.label}</span>
                                    <span className='owner-breakdown-count'>{row.count} sold</span>
                                    <span className='owner-breakdown-rev'>${row.revenue.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Staff detail with toggle */}
                <div className='owner-stat-block'>
                    <div className='owner-staff-header'>
                        <h4 className='owner-stat-block-title'>Staff Activity</h4>
                        <div className='owner-toggle'>
                            <button
                                className={`owner-toggle-btn ${staffViewMode === 'byStaff' ? 'active' : ''}`}
                                onClick={() => { setStaffViewMode('byStaff'); setExpandedStaff(null); setExpandedDate(null) }}
                            >
                                By Staff
                            </button>
                            <button
                                className={`owner-toggle-btn ${staffViewMode === 'byDate' ? 'active' : ''}`}
                                onClick={() => { setStaffViewMode('byDate'); setExpandedStaff(null); setExpandedDate(null) }}
                            >
                                By Date
                            </button>
                        </div>
                    </div>

                    {staffViewMode === 'byStaff' ? (
                        staffEmails.length === 0 ? (
                            <p className='owner-hint'>No staff activity in this period.</p>
                        ) : (
                            <div className='owner-staff-list'>
                                {staffEmails.map(emailAddr => {
                                    const theirCheckIns = checkInsForStaff(emailAddr)
                                    const isOpen = expandedStaff === emailAddr
                                    return (
                                        <div key={emailAddr} className='owner-staff-item'>
                                            <div className='owner-staff-row' onClick={() => setExpandedStaff(isOpen ? null : emailAddr)}>
                                                <span className='owner-staff-name'>{getStaffName(emailAddr)}</span>
                                                <span className='owner-staff-count'>{theirCheckIns.length} check-ins</span>
                                                <span className='owner-expand-icon'>{isOpen ? '▾' : '▸'}</span>
                                            </div>
                                            {isOpen && (
                                                <div className='owner-staff-detail'>
                                                    {theirCheckIns.length === 0 ? (
                                                        <p className='owner-hint'>No check-ins.</p>
                                                    ) : (
                                                        theirCheckIns
                                                            .sort((a, b) => b.date.localeCompare(a.date))
                                                            .map(l => (
                                                                <div key={l.id} className='owner-detail-row'>
                                                                    <span>{l.memberName}</span>
                                                                    <span className='owner-detail-date'>{formatDate(l.date + 'T12:00:00')}</span>
                                                                </div>
                                                            ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    ) : (
                        activeDates.length === 0 ? (
                            <p className='owner-hint'>No activity in this period.</p>
                        ) : (
                            <div className='owner-staff-list'>
                                {activeDates.map(date => {
                                    const isOpen = expandedDate === date
                                    const workers = staffOnDate(date)
                                    return (
                                        <div key={date} className='owner-staff-item'>
                                            <div className='owner-staff-row' onClick={() => setExpandedDate(isOpen ? null : date)}>
                                                <span className='owner-staff-name'>{formatDate(date + 'T12:00:00')}</span>
                                                <span className='owner-staff-count'>{workers.length} {workers.length === 1 ? 'person' : 'people'}</span>
                                                <span className='owner-expand-icon'>{isOpen ? '▾' : '▸'}</span>
                                            </div>
                                            {isOpen && (
                                                <div className='owner-staff-detail'>
                                                    {workers.map(emailAddr => {
                                                        const theirs = checkInsForStaffOnDate(emailAddr, date)
                                                        return (
                                                            <div key={emailAddr} className='owner-date-staff-block'>
                                                                <div className='owner-date-staff-name'>
                                                                    {getStaffName(emailAddr)} — {theirs.length} check-ins
                                                                </div>
                                                                {theirs.map(l => (
                                                                    <div key={l.id} className='owner-detail-row owner-detail-indent'>
                                                                        <span>{l.memberName}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* ===== PRICING EDITOR ===== */}
            <div className='owner-section'>
                <div className='owner-section-header'>
                    <h3>Pass Types &amp; Pricing</h3>
                    {editingId === null && (
                        <button className='owner-btn' onClick={startNew}>+ Add New Pass</button>
                    )}
                </div>

                {editingId === 'new' && renderForm()}

                {passLoading ? (
                    <p>Loading...</p>
                ) : passTypes.length === 0 ? (
                    <p className='owner-hint'>No pass types yet. Click "Add New Pass" to create one.</p>
                ) : (
                    <div className='owner-pass-list'>
                        {passTypes.map(pass => (
                            <div key={pass.id} className={`owner-pass-card ${!pass.active ? 'inactive' : ''}`}>
                                {editingId === pass.id ? (
                                    renderForm()
                                ) : (
                                    <>
                                        <div className='owner-pass-info'>
                                            <div className='owner-pass-top'>
                                                <span className='owner-pass-label'>{pass.label}</span>
                                                <span className='owner-pass-amount'>${pass.amount}</span>
                                                {!pass.active && <span className='owner-pass-inactive-badge'>Inactive</span>}
                                            </div>
                                            <div className='owner-pass-detail'>
                                                <span>{pass.duration === 'day' ? 'Single visit' : 'Monthly'}</span>
                                                <span>·</span>
                                                <span>{visibilitySummary(pass)}</span>
                                            </div>
                                        </div>
                                        <div className='owner-pass-actions'>
                                            <button className='owner-btn-small' onClick={() => startEdit(pass)}>Edit</button>
                                            <button className='owner-btn-small-outline' onClick={() => toggleActive(pass)}>
                                                {pass.active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}