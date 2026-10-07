import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, auth } from '../firebase'
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { usePassTypes, createPassType, updatePassType } from '../hooks/usePassTypes'
import { useInstructors, createInstructor, setInstructorActive, seedInstructors } from '../hooks/useInstructors'
import { useSchedule, saveSchedule, defaultSchedule } from '../hooks/useSchedule'
import { useInvoices, createInvoice } from '../hooks/useInvoices'
import { useProducts, createProduct, updateProduct } from '../hooks/useProducts'
import { useOrders, markOrderDelivered } from '../hooks/useOrders'
import './Owner.css'

const OWNER_EMAILS = ['dayton1salsa@gmail.com', 'ahiciano@icanoki.com']

const DURATION_OPTIONS = [
    { value: 'day', label: 'Single Visit / Day Pass (used up after one visit)' },
    { value: 'month', label: 'Monthly Pass (valid for the month)' }
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHIRT_SIZES = ['S', 'M', 'L', 'XL', 'XXL']

// Which sections start open. The owner's choices are remembered in this browser.
const DEFAULT_OPEN = {
    stats: true,
    statDow: true,
    statPass: true,
    statTaught: true,
    statStaff: true,
    orders: true,
    merch: false,
    invoices: false,
    schedule: false,
    instructors: false,
    pricing: true
}
const OPEN_STORAGE_KEY = 'ownerOpenSections'

function loadOpenState() {
    try {
        const saved = localStorage.getItem(OPEN_STORAGE_KEY)
        if (saved) return { ...DEFAULT_OPEN, ...JSON.parse(saved) }
    } catch (e) { /* ignore */ }
    return DEFAULT_OPEN
}

const emptyForm = {
    label: '',
    amount: '',
    duration: 'day',
    visibility: { mode: 'always', windowStartDays: 9, windowEndDays: 5, startDate: '', endDate: '', days: [] }
}

const emptyInvoiceForm = {
    companyName: '',
    companyAddress: '',
    contactName: '',
    contactEmail: '',
    description: '',
    amount: '',
    eventDate: ''
}

const emptyProductForm = {
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    variants: SHIRT_SIZES.map(size => ({ size, stock: '0' }))
}

function getStaffName(email) {
    if (!email) return 'Unknown'
    const namePart = email.split('@')[0]
    return namePart.charAt(0).toUpperCase() + namePart.slice(1)
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString()
}

// First day of the current month as YYYY-MM-DD
function monthStart() {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${d.getFullYear()}-${m}-01`
}

function isConfirmed(member) {
    return member.transactionId && member.transactionId !== 'PENDING'
}

// Only reads documents inside the chosen date range (saves Firestore reads)
function rangeQuery(colName, field, start, end, newestFirst = false) {
    const parts = []
    if (start) parts.push(where(field, '>=', start))
    if (end) parts.push(where(field, '<=', end + '\uf8ff'))
    parts.push(orderBy(field, newestFirst ? 'desc' : 'asc'))
    return query(collection(db, colName), ...parts)
}

// Collapsible big section
function Section({ title, badge, open, onToggle, actions, children }) {
    return (
        <div className='owner-section'>
            <div className='owner-section-header owner-collapsible' onClick={onToggle}>
                <h3>
                    <span className='owner-expand-icon'>{open ? '▾' : '▸'}</span>
                    {title}
                    {badge ? <span className='owner-section-badge'>{badge}</span> : null}
                </h3>
                {open && actions && (
                    <div onClick={e => e.stopPropagation()}>{actions}</div>
                )}
            </div>
            {open && children}
        </div>
    )
}

// Collapsible block inside Statistics
function StatBlock({ title, open, onToggle, right, children }) {
    return (
        <div className='owner-stat-block'>
            <div className='owner-staff-header owner-collapsible' onClick={onToggle}>
                <h4 className='owner-stat-block-title'>
                    <span className='owner-expand-icon'>{open ? '▾' : '▸'}</span> {title}
                </h4>
                {open && right && <div onClick={e => e.stopPropagation()}>{right}</div>}
            </div>
            {open && children}
        </div>
    )
}

export default function Owner() {
    const navigate = useNavigate()
    const { passTypes, loading: passLoading } = usePassTypes()
    const { instructors, loading: instructorsLoading } = useInstructors()
    const { schedule, loading: scheduleLoading } = useSchedule()
    const { invoices, loading: invoicesLoading } = useInvoices()
    const { products, loading: productsLoading } = useProducts()
    const { orders, loading: ordersLoading } = useOrders()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loginError, setLoginError] = useState('')

    const isOwner = !!user && OWNER_EMAILS.includes(user.email)

    // Collapsed / expanded sections
    const [openSections, setOpenSections] = useState(loadOpenState)

    function isOpen(id) {
        return openSections[id] !== false
    }

    function toggleSection(id) {
        setOpenSections(prev => {
            const next = { ...prev, [id]: !(prev[id] !== false) }
            try { localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
            return next
        })
    }

    function setAllSections(value) {
        const next = {}
        Object.keys(DEFAULT_OPEN).forEach(k => { next[k] = value })
        setOpenSections(next)
        try { localStorage.setItem(OPEN_STORAGE_KEY, JSON.stringify(next)) } catch (e) { /* ignore */ }
    }

    // Pricing editor state
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)

    // Instructor editor state
    const [newInstructorName, setNewInstructorName] = useState('')
    const [instructorError, setInstructorError] = useState('')
    const [addingInstructor, setAddingInstructor] = useState(false)
    const [seededOnce, setSeededOnce] = useState(false)

    // Schedule editor state
    const [scheduleForm, setScheduleForm] = useState(null)
    const [scheduleSaving, setScheduleSaving] = useState(false)
    const [scheduleError, setScheduleError] = useState('')
    const [scheduleSuccess, setScheduleSuccess] = useState(false)

    // Invoice editor state
    const [showInvoiceForm, setShowInvoiceForm] = useState(false)
    const [invoiceForm, setInvoiceForm] = useState(emptyInvoiceForm)
    const [invoiceError, setInvoiceError] = useState('')
    const [invoiceSaving, setInvoiceSaving] = useState(false)
    const [newInvoiceLink, setNewInvoiceLink] = useState('')
    const [linkCopied, setLinkCopied] = useState(false)

    // Merch editor state
    const [editingProductId, setEditingProductId] = useState(null)
    const [productForm, setProductForm] = useState(emptyProductForm)
    const [productError, setProductError] = useState('')
    const [productSaving, setProductSaving] = useState(false)

    // Stats data
    const [members, setMembers] = useState([])
    const [shifts, setShifts] = useState([])
    const [checkInLog, setCheckInLog] = useState([])
    const [instructorLog, setInstructorLog] = useState([])
    const [statsLoading, setStatsLoading] = useState(false)
    const [statsError, setStatsError] = useState('')
    const [statsRefresh, setStatsRefresh] = useState(0)

    // Stats filters (defaults to this month to keep reads low)
    const [rangeStart, setRangeStart] = useState(monthStart())
    const [rangeEnd, setRangeEnd] = useState('')
    const [staffViewMode, setStaffViewMode] = useState('byStaff')
    const [expandedStaff, setExpandedStaff] = useState(null)
    const [expandedDate, setExpandedDate] = useState(null)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser)
            setAuthLoading(false)
        })
        return unsubscribe
    }, [])

    // Load stats for the chosen date range only
    useEffect(() => {
        if (!isOwner) return
        let cancelled = false
        setStatsLoading(true)
        setStatsError('')
        Promise.all([
            getDocs(rangeQuery('members', 'purchaseDate', rangeStart, rangeEnd, true)),
            getDocs(rangeQuery('shifts', 'date', rangeStart, rangeEnd)),
            getDocs(rangeQuery('checkInLog', 'date', rangeStart, rangeEnd)),
            getDocs(rangeQuery('instructorLog', 'date', rangeStart, rangeEnd))
        ]).then(([mSnap, sSnap, cSnap, iSnap]) => {
            if (cancelled) return
            setMembers(mSnap.docs.map(d => ({ id: d.id, ...d.data() })))
            setShifts(sSnap.docs.map(d => ({ id: d.id, ...d.data() })))
            setCheckInLog(cSnap.docs.map(d => ({ id: d.id, ...d.data() })))
            setInstructorLog(iSnap.docs.map(d => ({ id: d.id, ...d.data() })))
            setStatsLoading(false)
        }).catch(err => {
            if (cancelled) return
            console.error('Stats load error:', err)
            setStatsError('Could not load stats: ' + err.message)
            setStatsLoading(false)
        })
        return () => { cancelled = true }
    }, [isOwner, rangeStart, rangeEnd, statsRefresh])

    // Auto-seed instructors if the list is empty (once)
    useEffect(() => {
        if (!isOwner) return
        if (instructorsLoading || seededOnce) return
        if (instructors.length === 0) {
            setSeededOnce(true)
            seedInstructors().catch(e => console.error('Seed error:', e))
        }
    }, [isOwner, instructors, instructorsLoading, seededOnce])

    // Populate schedule form when data loads
    useEffect(() => {
        if (schedule && !scheduleForm) {
            setScheduleForm(schedule)
        } else if (!schedule && !scheduleLoading && !scheduleForm) {
            setScheduleForm(defaultSchedule)
        }
    }, [schedule, scheduleLoading])

    // ===== Stats computation (only recalculates when data changes) =====
    const stats = useMemo(() => {
        const totalRevenue = members
            .filter(isConfirmed)
            .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)

        const attendanceByDow = DAY_NAMES_FULL.map((name, dow) => {
            const rows = checkInLog.filter(l => new Date(l.date + 'T12:00:00').getDay() === dow)
            const classCount = new Set(rows.map(l => l.date)).size
            const total = rows.length
            const avg = classCount > 0 ? total / classCount : 0
            return { name, dow, total, classCount, avg }
        }).filter(row => row.total > 0)

        const passBreakdown = passTypes.map(pass => {
            const matching = members.filter(m => m.passType === pass.key)
            const confirmed = matching.filter(isConfirmed)
            const revenue = confirmed.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)
            return { label: pass.label, key: pass.key, count: matching.length, confirmedCount: confirmed.length, revenue }
        }).filter(row => row.count > 0)

        const knownKeys = passTypes.map(p => p.key)
        const orphanMembers = members.filter(m => !knownKeys.includes(m.passType))
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

        const staffEmails = [...new Set([
            ...shifts.map(s => s.email),
            ...checkInLog.map(l => l.adminEmail)
        ])]

        const activeDates = [...new Set([
            ...shifts.map(s => s.date),
            ...checkInLog.map(l => l.date)
        ])].sort().reverse()

        const counts = {}
        instructorLog.forEach(l => { counts[l.name] = (counts[l.name] || 0) + 1 })
        const teachingByInstructor = Object.entries(counts)
            .map(([name, days]) => ({ name, days }))
            .sort((a, b) => b.days - a.days)

        const teachingDates = [...new Set(instructorLog.map(l => l.date))].sort().reverse()

        return { totalRevenue, attendanceByDow, passBreakdown, staffEmails, activeDates, teachingByInstructor, teachingDates }
    }, [members, shifts, checkInLog, instructorLog, passTypes])

    const {
        totalRevenue, attendanceByDow, passBreakdown, staffEmails,
        activeDates, teachingByInstructor, teachingDates
    } = stats

    function checkInsForStaff(emailAddr) {
        return checkInLog.filter(l => l.adminEmail === emailAddr)
    }

    function staffOnDate(date) {
        return [...new Set([
            ...shifts.filter(s => s.date === date).map(s => s.email),
            ...checkInLog.filter(l => l.date === date).map(l => l.adminEmail)
        ])]
    }

    function checkInsForStaffOnDate(emailAddr, date) {
        return checkInLog.filter(l => l.adminEmail === emailAddr && l.date === date)
    }

    function instructorsOnDate(date) {
        return instructorLog.filter(l => l.date === date).map(l => l.name)
    }

    function showThisMonth() {
        setRangeStart(monthStart())
        setRangeEnd('')
    }

    function showAllTime() {
        setRangeStart('')
        setRangeEnd('')
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

    // ===== Instructor editor handlers =====
    async function handleAddInstructor() {
        const name = newInstructorName.trim()
        if (!name) { setInstructorError('Name is required.'); return }
        const dup = instructors.some(i => i.name.toLowerCase() === name.toLowerCase())
        if (dup) { setInstructorError('That instructor already exists.'); return }
        setAddingInstructor(true)
        setInstructorError('')
        try {
            await createInstructor(name, instructors)
            setNewInstructorName('')
        } catch (e) {
            setInstructorError('Error: ' + e.message)
        }
        setAddingInstructor(false)
    }

    async function handleToggleInstructor(inst) {
        const verb = inst.active ? 'deactivate' : 'reactivate'
        if (!window.confirm(`Are you sure you want to ${verb} "${inst.name}"?`)) return
        try {
            await setInstructorActive(inst.id, !inst.active)
        } catch (e) {
            alert('Error: ' + e.message)
        }
    }

    // ===== Schedule editor handlers =====
    function addSpecialEvent() {
        const newEvent = { id: Date.now().toString(), title: '', description: '' }
        setScheduleForm({ ...scheduleForm, specialEvents: [...(scheduleForm.specialEvents || []), newEvent] })
    }

    function updateSpecialEvent(id, field, value) {
        setScheduleForm({
            ...scheduleForm,
            specialEvents: scheduleForm.specialEvents.map(e => e.id === id ? { ...e, [field]: value } : e)
        })
    }

    function removeSpecialEvent(id) {
        setScheduleForm({
            ...scheduleForm,
            specialEvents: scheduleForm.specialEvents.filter(e => e.id !== id)
        })
    }

    async function handleSaveSchedule() {
        if (!scheduleForm.month.trim()) { setScheduleError('Month is required.'); return }
        if (!scheduleForm.dayName.trim()) { setScheduleError('Day name is required.'); return }
        if (!scheduleForm.datesList.trim()) { setScheduleError('Dates are required.'); return }
        setScheduleSaving(true)
        setScheduleError('')
        setScheduleSuccess(false)
        try {
            await saveSchedule(scheduleForm)
            setScheduleSuccess(true)
            setTimeout(() => setScheduleSuccess(false), 3000)
        } catch (e) {
            setScheduleError('Error saving: ' + e.message)
        }
        setScheduleSaving(false)
    }

    // ===== Invoice handlers =====
    function startNewInvoice() {
        setShowInvoiceForm(true)
        setInvoiceForm(emptyInvoiceForm)
        setInvoiceError('')
        setNewInvoiceLink('')
        setLinkCopied(false)
    }

    function cancelInvoiceForm() {
        setShowInvoiceForm(false)
        setInvoiceForm(emptyInvoiceForm)
        setInvoiceError('')
        setNewInvoiceLink('')
        setLinkCopied(false)
    }

    async function handleCreateInvoice() {
        if (!invoiceForm.companyName.trim()) { setInvoiceError('Company name is required.'); return }
        if (!invoiceForm.description.trim()) { setInvoiceError('Event description is required.'); return }
        const amt = parseFloat(invoiceForm.amount)
        if (isNaN(amt) || amt <= 0) { setInvoiceError('Amount must be greater than $0.'); return }

        setInvoiceSaving(true)
        setInvoiceError('')
        try {
            const invoiceId = await createInvoice({
                companyName: invoiceForm.companyName.trim(),
                companyAddress: invoiceForm.companyAddress.trim(),
                contactName: invoiceForm.contactName.trim(),
                contactEmail: invoiceForm.contactEmail.trim(),
                description: invoiceForm.description.trim(),
                amount: amt.toFixed(2),
                eventDate: invoiceForm.eventDate
            })
            const link = `${window.location.origin}/invoice/${invoiceId}`
            setNewInvoiceLink(link)
        } catch (e) {
            setInvoiceError('Error creating invoice: ' + e.message)
        }
        setInvoiceSaving(false)
    }

    function copyInvoiceLink() {
        navigator.clipboard.writeText(newInvoiceLink)
        setLinkCopied(true)
        setTimeout(() => setLinkCopied(false), 2000)
    }

    // ===== Merch editor handlers =====
    function startNewProduct() {
        setEditingProductId('new')
        setProductForm(emptyProductForm)
        setProductError('')
    }

    function startEditProduct(product) {
        setEditingProductId(product.id)
        setProductForm({
            name: product.name,
            price: product.price,
            description: product.description || '',
            imageUrl: product.imageUrl || '',
            variants: SHIRT_SIZES.map(size => {
                const existing = (product.variants || []).find(v => v.size === size)
                return { size, stock: existing ? String(existing.stock) : '0' }
            })
        })
        setProductError('')
    }

    function cancelProductEdit() {
        setEditingProductId(null)
        setProductForm(emptyProductForm)
        setProductError('')
    }

    function updateVariantStock(size, value) {
        setProductForm({
            ...productForm,
            variants: productForm.variants.map(v => v.size === size ? { ...v, stock: value } : v)
        })
    }

    async function handleSaveProduct() {
        if (!productForm.name.trim()) { setProductError('Product name is required.'); return }
        const priceNum = parseFloat(productForm.price)
        if (isNaN(priceNum) || priceNum <= 0) { setProductError('Price must be greater than $0.'); return }

        const variants = productForm.variants.map(v => ({
            size: v.size,
            stock: Math.max(0, parseInt(v.stock, 10) || 0)
        }))

        setProductSaving(true)
        setProductError('')
        try {
            const payload = {
                name: productForm.name.trim(),
                price: priceNum.toFixed(2),
                description: productForm.description.trim(),
                imageUrl: productForm.imageUrl.trim(),
                variants
            }
            if (editingProductId === 'new') {
                await createProduct(payload, products)
            } else {
                await updateProduct(editingProductId, payload)
            }
            cancelProductEdit()
        } catch (e) {
            setProductError('Error saving: ' + e.message)
        }
        setProductSaving(false)
    }

    async function toggleProductActive(product) {
        const verb = product.active ? 'deactivate' : 'reactivate'
        if (!window.confirm(`Are you sure you want to ${verb} "${product.name}"?`)) return
        try {
            await updateProduct(product.id, { active: !product.active })
        } catch (e) {
            alert('Error: ' + e.message)
        }
    }

    function totalStock(product) {
        return (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0)
    }

    async function handleMarkDelivered(orderId) {
        if (!window.confirm('Mark this order as delivered/picked up?')) return
        try {
            await markOrderDelivered(orderId)
        } catch (e) {
            alert('Error: ' + e.message)
        }
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

    if (!isOwner) return (
        <div className='owner-blocked'>
            <h2>Access Denied</h2>
            <p>This area is restricted to owners only.</p>
            <button className='owner-btn-outline' onClick={() => signOut(auth)}>Log Out</button>
        </div>
    )

    const unfulfilledCount = orders.filter(o => o.status !== 'delivered').length

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

    const renderProductForm = () => (
        <div className='owner-edit-form'>
            <div className='owner-form-group'>
                <label>Product Name</label>
                <input type='text' value={productForm.name}
                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder='e.g. DaytOn1 Logo Tee' />
            </div>
            <div className='owner-form-group'>
                <label>Price ($)</label>
                <input type='number' step='0.01' min='0' value={productForm.price}
                    onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder='20.00' />
            </div>
            <div className='owner-form-group'>
                <label>Photo Path <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional, e.g. /merch/black-tee.jpg)</span></label>
                <input type='text' value={productForm.imageUrl}
                    onChange={e => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    placeholder='/merch/black-tee.jpg' />
            </div>
            <div className='owner-form-group'>
                <label>Description <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional)</span></label>
                <input type='text' value={productForm.description}
                    onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder='Soft cotton tee with the DaytOn1 logo' />
            </div>
            <div className='owner-form-group'>
                <label>Stock by Size</label>
                <div className='owner-variant-grid'>
                    {productForm.variants.map(v => (
                        <div key={v.size} className='owner-variant-field'>
                            <span className='owner-variant-size'>{v.size}</span>
                            <input
                                type='number'
                                min='0'
                                value={v.stock}
                                onChange={e => updateVariantStock(v.size, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {productError && <p className='owner-error'>{productError}</p>}

            <div className='owner-form-buttons'>
                <button className='owner-btn-outline' onClick={cancelProductEdit} disabled={productSaving}>Cancel</button>
                <button className='owner-btn' onClick={handleSaveProduct} disabled={productSaving}>
                    {productSaving ? 'Saving...' : 'Save Product'}
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

            <div className='owner-collapse-bar'>
                <button className='owner-btn-small-outline' onClick={() => setAllSections(true)}>Expand All</button>
                <button className='owner-btn-small-outline' onClick={() => setAllSections(false)}>Collapse All</button>
            </div>

            {/* ===== STATS ===== */}
            <Section
                title='Statistics'
                open={isOpen('stats')}
                onToggle={() => toggleSection('stats')}
            >
                <div className='owner-filter-bar'>
                    <div className='owner-filter-group'>
                        <label>From</label>
                        <input type='date' value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
                    </div>
                    <div className='owner-filter-group'>
                        <label>To</label>
                        <input type='date' value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
                    </div>
                    <button className='owner-btn-small-outline' onClick={showThisMonth}>This Month</button>
                    <button className='owner-btn-small-outline' onClick={showAllTime}>All Time</button>
                    <button className='owner-btn-small-outline' onClick={() => setStatsRefresh(n => n + 1)} disabled={statsLoading}>
                        {statsLoading ? 'Loading...' : 'Refresh'}
                    </button>
                </div>

                {statsError && <p className='owner-error'>{statsError}</p>}
                {!rangeStart && !rangeEnd && (
                    <p className='owner-hint'>Showing all time. This reads every record, so use a date range for day-to-day checks.</p>
                )}

                <div className='owner-stat-cards'>
                    <div className='owner-stat-card'>
                        <p>Revenue</p>
                        <h4>${totalRevenue.toFixed(2)}</h4>
                    </div>
                    <div className='owner-stat-card'>
                        <p>Members</p>
                        <h4>{members.length}</h4>
                    </div>
                    <div className='owner-stat-card'>
                        <p>Check-Ins</p>
                        <h4>{checkInLog.length}</h4>
                    </div>
                    <div className='owner-stat-card'>
                        <p>Active Passes</p>
                        <h4>{passTypes.filter(p => p.active).length}</h4>
                    </div>
                </div>

                <StatBlock title='Attendance by Day of Week' open={isOpen('statDow')} onToggle={() => toggleSection('statDow')}>
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
                </StatBlock>

                <StatBlock title='Pass Type Breakdown' open={isOpen('statPass')} onToggle={() => toggleSection('statPass')}>
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
                </StatBlock>

                <StatBlock title='Who Taught' open={isOpen('statTaught')} onToggle={() => toggleSection('statTaught')}>
                    {teachingByInstructor.length === 0 ? (
                        <p className='owner-hint'>No teaching recorded in this period.</p>
                    ) : (
                        <div className='owner-breakdown-list'>
                            {teachingByInstructor.map(row => (
                                <div key={row.name} className='owner-breakdown-row'>
                                    <span className='owner-breakdown-label'>{row.name}</span>
                                    <span className='owner-breakdown-count'>{row.days} {row.days === 1 ? 'day' : 'days'}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {teachingDates.length > 0 && (
                        <div className='owner-teach-dates'>
                            {teachingDates.map(date => (
                                <div key={date} className='owner-teach-date-row'>
                                    <span className='owner-teach-date'>{formatDate(date + 'T12:00:00')}</span>
                                    <span className='owner-teach-names'>{instructorsOnDate(date).join(', ')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </StatBlock>

                <StatBlock
                    title='Staff Activity'
                    open={isOpen('statStaff')}
                    onToggle={() => toggleSection('statStaff')}
                    right={
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
                    }
                >
                    {staffViewMode === 'byStaff' ? (
                        staffEmails.length === 0 ? (
                            <p className='owner-hint'>No staff activity in this period.</p>
                        ) : (
                            <div className='owner-staff-list'>
                                {staffEmails.map(emailAddr => {
                                    const theirCheckIns = checkInsForStaff(emailAddr)
                                    const open = expandedStaff === emailAddr
                                    return (
                                        <div key={emailAddr} className='owner-staff-item'>
                                            <div className='owner-staff-row' onClick={() => setExpandedStaff(open ? null : emailAddr)}>
                                                <span className='owner-staff-name'>{getStaffName(emailAddr)}</span>
                                                <span className='owner-staff-count'>{theirCheckIns.length} check-ins</span>
                                                <span className='owner-expand-icon'>{open ? '▾' : '▸'}</span>
                                            </div>
                                            {open && (
                                                <div className='owner-staff-detail'>
                                                    {theirCheckIns.length === 0 ? (
                                                        <p className='owner-hint'>No check-ins.</p>
                                                    ) : (
                                                        [...theirCheckIns]
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
                                    const open = expandedDate === date
                                    const workers = staffOnDate(date)
                                    const teachers = instructorsOnDate(date)
                                    return (
                                        <div key={date} className='owner-staff-item'>
                                            <div className='owner-staff-row' onClick={() => setExpandedDate(open ? null : date)}>
                                                <span className='owner-staff-name'>{formatDate(date + 'T12:00:00')}</span>
                                                <span className='owner-staff-count'>{workers.length} {workers.length === 1 ? 'person' : 'people'}</span>
                                                <span className='owner-expand-icon'>{open ? '▾' : '▸'}</span>
                                            </div>
                                            {open && (
                                                <div className='owner-staff-detail'>
                                                    {teachers.length > 0 && (
                                                        <div className='owner-date-staff-block'>
                                                            <div className='owner-date-staff-name'>Taught: {teachers.join(', ')}</div>
                                                        </div>
                                                    )}
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
                </StatBlock>
            </Section>

            {/* ===== MERCH ORDERS ===== */}
            <Section
                title='Merch Orders'
                badge={unfulfilledCount > 0 ? `${unfulfilledCount} unfulfilled` : ''}
                open={isOpen('orders')}
                onToggle={() => toggleSection('orders')}
            >
                <p className='owner-hint'>Orders placed on the Classes and Shop pages. Mark as delivered once picked up.</p>

                {ordersLoading ? (
                    <p>Loading...</p>
                ) : orders.length === 0 ? (
                    <p className='owner-hint'>No orders yet.</p>
                ) : (
                    <div className='owner-pass-list'>
                        {orders.map(order => (
                            <div key={order.id} className={`owner-pass-card ${order.status === 'delivered' ? '' : 'inactive'}`}>
                                <div className='owner-pass-info'>
                                    <div className='owner-pass-top'>
                                        <span className='owner-pass-label'>{order.buyerName}</span>
                                        <span className='owner-pass-amount'>${order.totalAmount}</span>
                                        <span className={order.status === 'delivered' ? 'owner-invoice-paid-badge' : 'owner-pass-inactive-badge'}>
                                            {order.status === 'delivered' ? 'Delivered' : 'Unfulfilled'}
                                        </span>
                                    </div>
                                    <div className='owner-pass-detail'>
                                        <span>{(order.items || []).map(i => `${i.quantity}x ${i.productName} (${i.size})`).join(', ')}</span>
                                        <span>·</span>
                                        <span>{order.buyerPhone}</span>
                                    </div>
                                </div>
                                {order.status !== 'delivered' && (
                                    <div className='owner-pass-actions'>
                                        <button className='owner-btn-small' onClick={() => handleMarkDelivered(order.id)}>
                                            Mark Delivered
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ===== MERCH / T-SHIRTS ===== */}
            <Section
                title='T-Shirts & Merch'
                badge={products.length > 0 ? `${products.length} products` : ''}
                open={isOpen('merch')}
                onToggle={() => toggleSection('merch')}
                actions={editingProductId === null && (
                    <button className='owner-btn' onClick={startNewProduct}>+ Add Product</button>
                )}
            >
                <p className='owner-hint'>Appears on the Shop page and in the Classes page merch section. Pickup only for now.</p>

                {editingProductId === 'new' && renderProductForm()}

                {productsLoading ? (
                    <p>Loading...</p>
                ) : products.length === 0 ? (
                    <p className='owner-hint'>No products yet. Click "Add Product" to create one.</p>
                ) : (
                    <div className='owner-pass-list'>
                        {products.map(product => (
                            <div key={product.id} className={`owner-pass-card ${!product.active ? 'inactive' : ''}`}>
                                {editingProductId === product.id ? (
                                    renderProductForm()
                                ) : (
                                    <>
                                        <div className='owner-pass-info'>
                                            <div className='owner-pass-top'>
                                                <span className='owner-pass-label'>{product.name}</span>
                                                <span className='owner-pass-amount'>${product.price}</span>
                                                {!product.active && <span className='owner-pass-inactive-badge'>Inactive</span>}
                                            </div>
                                            <div className='owner-pass-detail'>
                                                <span>{totalStock(product)} total in stock</span>
                                                <span>·</span>
                                                <span>{(product.variants || []).map(v => `${v.size}: ${v.stock}`).join(', ')}</span>
                                            </div>
                                            {(product.imageUrl || product.description) && (
                                                <div className='owner-pass-detail'>
                                                    {product.imageUrl && <span>Photo: {product.imageUrl}</span>}
                                                    {product.imageUrl && product.description && <span>·</span>}
                                                    {product.description && <span>{product.description}</span>}
                                                </div>
                                            )}
                                        </div>
                                        <div className='owner-pass-actions'>
                                            <button className='owner-btn-small' onClick={() => startEditProduct(product)}>Edit</button>
                                            <button className='owner-btn-small-outline' onClick={() => toggleProductActive(product)}>
                                                {product.active ? 'Deactivate' : 'Reactivate'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ===== INVOICES ===== */}
            <Section
                title='Invoices'
                badge={invoices.filter(i => i.status !== 'paid').length > 0 ? `${invoices.filter(i => i.status !== 'paid').length} unpaid` : ''}
                open={isOpen('invoices')}
                onToggle={() => toggleSection('invoices')}
                actions={!showInvoiceForm && (
                    <button className='owner-btn' onClick={startNewInvoice}>+ New Invoice</button>
                )}
            >
                <p className='owner-hint'>Bill a company or client for a private event. Share the link — it updates to "Paid" automatically once they pay.</p>

                {showInvoiceForm && (
                    <div className='owner-edit-form'>
                        {!newInvoiceLink ? (
                            <>
                                <div className='owner-schedule-grid'>
                                    <div className='owner-form-group'>
                                        <label>Company Name</label>
                                        <input type='text' value={invoiceForm.companyName}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
                                            placeholder='e.g. Acme Corp' />
                                    </div>
                                    <div className='owner-form-group'>
                                        <label>Event Date <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional)</span></label>
                                        <input type='date' value={invoiceForm.eventDate}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, eventDate: e.target.value })} />
                                    </div>
                                    <div className='owner-form-group owner-schedule-full'>
                                        <label>Company Address <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional)</span></label>
                                        <input type='text' value={invoiceForm.companyAddress}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, companyAddress: e.target.value })}
                                            placeholder='e.g. 123 Main St, Dayton, OH 45402' />
                                    </div>
                                    <div className='owner-form-group'>
                                        <label>Contact Name <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional)</span></label>
                                        <input type='text' value={invoiceForm.contactName}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, contactName: e.target.value })}
                                            placeholder='e.g. Jane Smith' />
                                    </div>
                                    <div className='owner-form-group'>
                                        <label>Contact Email <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional)</span></label>
                                        <input type='email' value={invoiceForm.contactEmail}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, contactEmail: e.target.value })}
                                            placeholder='e.g. jane@acme.com' />
                                    </div>
                                    <div className='owner-form-group owner-schedule-full'>
                                        <label>Event Description</label>
                                        <input type='text' value={invoiceForm.description}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                                            placeholder='e.g. Private salsa lesson for company event' />
                                    </div>
                                    <div className='owner-form-group'>
                                        <label>Amount ($)</label>
                                        <input type='number' step='0.01' min='0' value={invoiceForm.amount}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                                            placeholder='500.00' />
                                    </div>
                                </div>

                                {invoiceError && <p className='owner-error'>{invoiceError}</p>}

                                <div className='owner-form-buttons'>
                                    <button className='owner-btn-outline' onClick={cancelInvoiceForm} disabled={invoiceSaving}>Cancel</button>
                                    <button className='owner-btn' onClick={handleCreateInvoice} disabled={invoiceSaving}>
                                        {invoiceSaving ? 'Creating...' : 'Create Invoice'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className='owner-schedule-success'>✓ Invoice created — share this link with the company:</p>
                                <div className='owner-invoice-link-row'>
                                    <input type='text' readOnly value={newInvoiceLink} className='owner-invoice-link-input' />
                                    <button className='owner-btn-small' onClick={copyInvoiceLink}>
                                        {linkCopied ? 'Copied!' : 'Copy Link'}
                                    </button>
                                </div>
                                <div className='owner-form-buttons'>
                                    <button className='owner-btn-outline' onClick={cancelInvoiceForm}>Done</button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {invoicesLoading ? (
                    <p>Loading...</p>
                ) : invoices.length === 0 ? (
                    <p className='owner-hint'>No invoices yet. Click "+ New Invoice" to create one.</p>
                ) : (
                    <div className='owner-pass-list'>
                        {invoices.map(inv => (
                            <div key={inv.id} className={`owner-pass-card ${inv.status === 'paid' ? '' : 'inactive'}`}>
                                <div className='owner-pass-info'>
                                    <div className='owner-pass-top'>
                                        <span className='owner-pass-label'>{inv.companyName}</span>
                                        <span className='owner-pass-amount'>${inv.amount}</span>
                                        <span className={inv.status === 'paid' ? 'owner-invoice-paid-badge' : 'owner-pass-inactive-badge'}>
                                            {inv.status === 'paid' ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </div>
                                    <div className='owner-pass-detail'>
                                        <span>{inv.description}</span>
                                        {inv.eventDate && <><span>·</span><span>{formatDate(inv.eventDate + 'T12:00:00')}</span></>}
                                        {inv.status === 'paid' && inv.paidAt && <><span>·</span><span>Paid {formatDate(inv.paidAt)}</span></>}
                                    </div>
                                </div>
                                <div className='owner-pass-actions'>
                                    <button
                                        className='owner-btn-small-outline'
                                        onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/invoice/${inv.id}`)
                                        }}
                                    >
                                        Copy Link
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ===== SCHEDULE ===== */}
            <Section
                title='Class Schedule'
                open={isOpen('schedule')}
                onToggle={() => toggleSection('schedule')}
            >
                <p className='owner-hint'>Updates the schedule on the public Classes page instantly.</p>

                {scheduleLoading || !scheduleForm ? (
                    <p>Loading...</p>
                ) : (
                    <>
                        <div className='owner-schedule-grid'>
                            <div className='owner-form-group'>
                                <label>Month Label</label>
                                <input
                                    type='text'
                                    value={scheduleForm.month}
                                    onChange={e => setScheduleForm({ ...scheduleForm, month: e.target.value })}
                                    placeholder='e.g. August'
                                />
                            </div>
                            <div className='owner-form-group'>
                                <label>Day Name</label>
                                <input
                                    type='text'
                                    value={scheduleForm.dayName}
                                    onChange={e => setScheduleForm({ ...scheduleForm, dayName: e.target.value })}
                                    placeholder='e.g. Mondays'
                                />
                            </div>
                            <div className='owner-form-group owner-schedule-full'>
                                <label>Dates</label>
                                <input
                                    type='text'
                                    value={scheduleForm.datesList}
                                    onChange={e => setScheduleForm({ ...scheduleForm, datesList: e.target.value })}
                                    placeholder='e.g. Aug 3, 10, 17, 24'
                                />
                            </div>
                            <div className='owner-form-group owner-schedule-full'>
                                <label>Cancellation Note <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional)</span></label>
                                <input
                                    type='text'
                                    value={scheduleForm.cancellationNote || ''}
                                    onChange={e => setScheduleForm({ ...scheduleForm, cancellationNote: e.target.value })}
                                    placeholder='e.g. (No classes Aug 31)'
                                />
                            </div>
                            <div className='owner-form-group owner-schedule-full'>
                                <label>Announcement Banner <span style={{ opacity: 0.5, fontSize: '9pt' }}>(optional — shows at top of Classes page)</span></label>
                                <input
                                    type='text'
                                    value={scheduleForm.announcement || ''}
                                    onChange={e => setScheduleForm({ ...scheduleForm, announcement: e.target.value })}
                                    placeholder='e.g. Classes start September 7th!'
                                />
                            </div>
                        </div>

                        <div className='owner-special-events'>
                            <div className='owner-special-events-header'>
                                <label>Special Events</label>
                                <button className='owner-btn-small' onClick={addSpecialEvent}>+ Add Event</button>
                            </div>
                            {(scheduleForm.specialEvents || []).length === 0 ? (
                                <p className='owner-hint'>No special events. Click "+ Add Event" to add one.</p>
                            ) : (
                                scheduleForm.specialEvents.map(event => (
                                    <div key={event.id} className='owner-special-event-row'>
                                        <div className='owner-form-group'>
                                            <input
                                                type='text'
                                                value={event.title}
                                                onChange={e => updateSpecialEvent(event.id, 'title', e.target.value)}
                                                placeholder='e.g. August 24th'
                                            />
                                        </div>
                                        <div className='owner-form-group'>
                                            <input
                                                type='text'
                                                value={event.description}
                                                onChange={e => updateSpecialEvent(event.id, 'description', e.target.value)}
                                                placeholder='e.g. Social 8:30 - 10:30 PM'
                                            />
                                        </div>
                                        <button className='owner-btn-small-outline owner-remove-event' onClick={() => removeSpecialEvent(event.id)}>
                                            Remove
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {scheduleError && <p className='owner-error'>{scheduleError}</p>}
                        {scheduleSuccess && <p className='owner-schedule-success'>✓ Schedule saved — Classes page updated.</p>}

                        <div className='owner-form-buttons'>
                            <button className='owner-btn' onClick={handleSaveSchedule} disabled={scheduleSaving}>
                                {scheduleSaving ? 'Saving...' : 'Save Schedule'}
                            </button>
                        </div>
                    </>
                )}
            </Section>

            {/* ===== INSTRUCTORS ===== */}
            <Section
                title='Instructors'
                badge={instructors.length > 0 ? `${instructors.filter(i => i.active).length} active` : ''}
                open={isOpen('instructors')}
                onToggle={() => toggleSection('instructors')}
            >
                <p className='owner-hint'>These names appear on the admin dashboard so staff can mark who taught each day.</p>

                <div className='owner-add-instructor'>
                    <input
                        type='text'
                        value={newInstructorName}
                        onChange={e => { setNewInstructorName(e.target.value); setInstructorError('') }}
                        placeholder='New instructor name'
                        onKeyDown={e => { if (e.key === 'Enter') handleAddInstructor() }}
                    />
                    <button className='owner-btn' onClick={handleAddInstructor} disabled={addingInstructor}>
                        {addingInstructor ? 'Adding...' : '+ Add'}
                    </button>
                </div>
                {instructorError && <p className='owner-error'>{instructorError}</p>}

                {instructorsLoading ? (
                    <p>Loading...</p>
                ) : instructors.length === 0 ? (
                    <p className='owner-hint'>No instructors yet. Add one above.</p>
                ) : (
                    <div className='owner-pass-list'>
                        {instructors.map(inst => (
                            <div key={inst.id} className={`owner-pass-card ${!inst.active ? 'inactive' : ''}`}>
                                <div className='owner-pass-info'>
                                    <div className='owner-pass-top'>
                                        <span className='owner-pass-label'>{inst.name}</span>
                                        {!inst.active && <span className='owner-pass-inactive-badge'>Inactive</span>}
                                    </div>
                                </div>
                                <div className='owner-pass-actions'>
                                    <button className='owner-btn-small-outline' onClick={() => handleToggleInstructor(inst)}>
                                        {inst.active ? 'Deactivate' : 'Reactivate'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Section>

            {/* ===== PRICING EDITOR ===== */}
            <Section
                title='Pass Types & Pricing'
                badge={passTypes.length > 0 ? `${passTypes.filter(p => p.active).length} active` : ''}
                open={isOpen('pricing')}
                onToggle={() => toggleSection('pricing')}
                actions={editingId === null && (
                    <button className='owner-btn' onClick={startNew}>+ Add New Pass</button>
                )}
            >
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
            </Section>
        </div>
    )
}