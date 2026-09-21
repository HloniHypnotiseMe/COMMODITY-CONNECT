import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDollarSign, FileCheck2, FileUp, KeyRound, LockKeyhole, LogOut, Search, ShieldCheck, UserPlus, Wallet, RefreshCw } from 'lucide-react';
import { commodities, demoDeal } from './data';
import { commissionAmount, dealValue, money } from './lib';
import { canAdvanceDeal, commissionSnapshot } from './domain';
import { isConfigured } from './config';
import { createRemotePayPaymentLink, getRemotePayPaymentLink, pb } from './services';
import type { CommissionParticipant, DealStatus, Role } from './types';

const roles: { value: Role; label: string }[] = [
  { value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller' },
  { value: 'buyer_mandate', label: 'Buyer Mandate' }, { value: 'seller_mandate', label: 'Seller Mandate' },
  { value: 'facilitator', label: 'Facilitator' }, { value: 'intermediary', label: 'Intermediary' },
];

const defaultParticipants: CommissionParticipant[] = [
  { role: 'facilitator', name: 'Facilitator', percentage: 1.5, amount: 0, walletReady: false },
  { role: 'seller_mandate', name: 'Seller Mandate', percentage: 1, amount: 0, walletReady: false },
  { role: 'buyer_mandate', name: 'Buyer Mandate', percentage: 1, amount: 0, walletReady: false },
];

const demoEnabled = import.meta.env.VITE_DEMO_MODE === 'true';

export default function App() {
  const [commodity, setCommodity] = useState(demoDeal.commodity);
  const [volume, setVolume] = useState(demoDeal.volume);
  const [unitPrice, setUnitPrice] = useState(demoDeal.unitPrice);
  const [grade, setGrade] = useState(demoDeal.grade);
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState<DealStatus>('open');
  const [locked, setLocked] = useState(false);
  const [documents, setDocuments] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [dealId, setDealId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('not_created');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [escrowId, setEscrowId] = useState('');
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [adminKyc, setAdminKyc] = useState<Array<{ id: string; legal_name: string; role: string }>>([]);
  const [adminDocs, setAdminDocs] = useState<Array<{ id: string; type: string; deal: string }>>([]);

  const total = useMemo(() => dealValue(volume, unitPrice), [volume, unitPrice]);
  const chain = useMemo(() => commissionSnapshot(total, defaultParticipants), [total]);
  const commissionTotal = commissionAmount(total, 3.5);
  const filtered = commodities.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  const signedEvidence = documents.includes('NCNDA') && documents.includes('IMFPA');
  const paymentConfirmed = paymentStatus === 'paid';
  const deliveryEvidence = documents.includes('BL');
  const canAdvance = canAdvanceDeal(status, { paymentConfirmed, deliveryEvidence, chainLocked: locked });

  const notice = (text: string) => setMessage(text);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage('');
    try {
      if (authMode === 'signin') {
        await pb.collection('_pb_users_auth_').authWithPassword(email, password);
        notice(`Signed in as ${pb.authStore.record?.email || email}.`);
      } else {
        await pb.collection('_pb_users_auth_').create({ email, password, passwordConfirm: password, name });
        await pb.collection('_pb_users_auth_').authWithPassword(email, password);
        await pb.collection('kyc_profiles').create({ owner: pb.authStore.record?.id, legal_name: name, role, status: 'pending' });
        notice('Account created. KYC is pending verification.');
      }
    } catch (error) { notice(error instanceof Error ? error.message : 'Authentication failed.'); }
    finally { setBusy(false); }
  }

  async function saveDeal() {
    if (!pb.authStore.isValid) return notice('Sign in before saving a production deal.');
    setBusy(true); setMessage('');
    try {
      const reference = `CC-${Date.now().toString(36).toUpperCase()}`;
      const record = await pb.collection('deals').create({
        reference, created_by: pb.authStore.record?.id, commodity, grade, volume, unit: 'MT',
        unit_price: unitPrice, currency, total_value: total, status: 'open', total_commission_pct: 3.5,
        commission_locked: false,
      });
      setDealId(record.id);
      notice(`Deal ${reference} saved to PocketBase.`);
    } catch (error) { notice(error instanceof Error ? error.message : 'Could not save deal.'); }
    finally { setBusy(false); }
  }

  async function uploadDocument(file: File, type: string) {
    if (!dealId || !pb.authStore.isValid) return notice('Save the deal and sign in before uploading evidence.');
    const sequence = ['LOI','FCO','BCL','POP','SGS','NCNDA','IMFPA','BL'];
    const index = sequence.indexOf(type);
    setBusy(true); setMessage('');
    try {
      const existing = await pb.collection('documents').getFullList({ filter: `deal = "\${dealId}"`, fields: 'type' });
      const existingTypes = new Set(existing.map((doc) => String(doc.type)));
      const missing = sequence.slice(0, index).filter(step => !existingTypes.has(step));
      if (missing.length) throw new Error(`Sequence gate: upload ${missing.join(', ')} before ${type}.`);
      const form = new FormData();
      form.append('deal', dealId); form.append('type', type); form.append('sequence_index', String(index)); form.append('file', file); form.append('verified', 'false');
      await pb.collection('documents').create(form);
      setDocuments(prev => prev.includes(type) ? prev : [...prev, type]);
      notice(`${type} uploaded. Upload does not mean verified.`);
    } catch (error) { notice(error instanceof Error ? error.message : `Could not upload ${type}.`); }
    finally { setBusy(false); }
  }

  async function lockChain() {
    if (!dealId || !signedEvidence || !pb.authStore.isValid) return notice('NCNDA and IMFPA must be uploaded before the commission chain can be locked.');
    setBusy(true); setMessage('');
    try {
      const snapshot = { locked_at: new Date().toISOString(), participants: chain };
      await pb.collection('deals').update(dealId, { commission_locked: true, lock_evidence: [] });
      const rows = chain.map(p => pb.collection('deal_participants').create({ deal: dealId, user: pb.authStore.record?.id, role: p.role, commission_pct: p.percentage, commission_amount: p.amount, wallet_ready: p.walletReady, locked_snapshot: snapshot }));
      await Promise.all(rows);
      setLocked(true);
      notice('Commission chain locked in the application. Legal enforceability still depends on the signed agreements and applicable law.');
    } catch (error) { notice(error instanceof Error ? error.message : 'Could not lock commission chain.'); }
    finally { setBusy(false); }
  }

  async function requestPayment() {
    if (!dealId || !isConfigured.remotePay) return notice('Save the deal and configure RemotePay before requesting a payment link.');
    setBusy(true); setMessage('');
    try {
      const payment = await createRemotePayPaymentLink({
        customerReference: dealId,
        description: `${commodity} deal ${dealId}`,
        amountMinor: Math.round(total * 100),
        currency,
        idempotencyKey: `cc-${dealId}-${Math.round(total * 100)}`,
        metadata: { deal_id: dealId, commodity, source: 'commodity-connect' },
        returnUrl: window.location.href,
        cancelUrl: window.location.href,
      });
      await pb.collection('deals').update(dealId, { remote_pay_reference: payment.payment_id });
      const escrow = await pb.collection('escrows').create({
        deal: dealId,
        remote_pay_reference: payment.payment_id,
        status: 'pending',
        provider_status: payment.status,
        payment_evidence: { payment_id: payment.payment_id, status: payment.status, source: 'RemotePay' },
      });
      setEscrowId(escrow.id);
      setPaymentId(payment.payment_id); setPaymentStatus(payment.status); setPaymentUrl(payment.payment_url);
      notice(`RemotePay payment link created and linked to the deal. Status is ${payment.status}; this is not payment confirmation.`);
    } catch (error) { notice(error instanceof Error ? error.message : 'RemotePay payment-link request failed.'); }
    finally { setBusy(false); }
  }

  async function refreshPayment() {
    if (!paymentId) return notice('No RemotePay payment has been created.');
    setBusy(true); setMessage('');
    try {
      const payment = await getRemotePayPaymentLink(paymentId);
      setPaymentStatus(payment.status); setPaymentUrl(payment.payment_url || paymentUrl);
      if (escrowId) {
        notice(`RemotePay reports payment status: ${payment.status}. Escrow remains provider-reconciliation gated until an authorized operator records confirmation.`);
      } else {
        notice(`RemotePay reports payment status: ${payment.status}.`);
      }
    } catch (error) { notice(error instanceof Error ? error.message : 'Could not refresh RemotePay status.'); }
    finally { setBusy(false); }
  }

  async function verifyDocument(id: string) {
    if (pb.authStore.record?.platform_role !== 'admin') return notice('Admin verification permission is required.');
    setBusy(true); setMessage('');
    try {
      await pb.collection('documents').update(id, { verified: true, verified_by: pb.authStore.record?.id, verification_notes: 'Verified by authorized Commodity Connect operator.' });
      notice('Document verified.');
    } catch (error) { notice(error instanceof Error ? error.message : 'Document verification failed.'); }
    finally { setBusy(false); }
  }

  async function verifyKyc(id: string, approved: boolean) {
    if (pb.authStore.record?.platform_role !== 'admin') return notice('Admin verification permission is required.');
    setBusy(true); setMessage('');
    try {
      await pb.collection('kyc_profiles').update(id, { status: approved ? 'verified' : 'rejected', verification_notes: approved ? 'Verified by authorized Commodity Connect operator.' : 'Rejected by authorized Commodity Connect operator.' });
      notice(`KYC ${approved ? 'verified' : 'rejected'}.`);
    } catch (error) { notice(error instanceof Error ? error.message : 'KYC verification failed.'); }
    finally { setBusy(false); }
  }

  async function adminReview() {
    if (pb.authStore.record?.platform_role !== 'admin') return notice('Admin verification permission is required.');
    setBusy(true); setMessage('');
    try {
      const [kyc, docs] = await Promise.all([
        pb.collection('kyc_profiles').getFullList({ filter: 'status = "pending"', sort: '-created', fields: 'id,legal_name,role' }),
        pb.collection('documents').getFullList({ filter: 'verified = false', sort: '-created', fields: 'id,type,deal' }),
      ]);
      setAdminKyc(kyc as Array<{ id: string; legal_name: string; role: string }>);
      setAdminDocs(docs as Array<{ id: string; type: string; deal: string }>);
      notice(`Admin queue loaded: ${kyc.length} pending KYC profile(s), ${docs.length} unverified document(s).`);
    } catch (error) { notice(error instanceof Error ? error.message : 'Could not load admin queue.'); }
    finally { setBusy(false); }
  }

  function advanceDemo() {
    if (!demoEnabled) return notice('Lifecycle advancement is evidence-gated. Configure real payment and delivery evidence; demo controls are disabled.');
    if (status === 'open' && paymentConfirmed && locked) setStatus('escrow_secured');
    else if (status === 'escrow_secured' && deliveryEvidence && locked) setStatus('closed');
    else notice('Required evidence is missing for this lifecycle transition.');
  }

  return <div className="app">
    <header className="topbar">
      <div className="brand"><div className="mark">CC</div><div><strong>Commodity Connect</strong><span>C6 Group · Protected Deal Infrastructure</span></div></div>
      <div className="top-actions"><span className="status-dot">{pb.authStore.isValid ? 'Authenticated' : 'Evidence-first'}</span>{pb.authStore.isValid ? <button className="ghost" onClick={() => { pb.authStore.clear(); notice('Signed out.'); }}><LogOut size={16}/> Sign out</button> : <button className="ghost" onClick={() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })}><KeyRound size={16}/> Sign in</button>}<button className="primary" onClick={() => document.getElementById('deal')?.scrollIntoView({ behavior: 'smooth' })}>Build a deal <ArrowRight size={16}/></button></div>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><ShieldCheck size={15}/> DEAL-CHAIN PROTECTION</div>
        <h1>Move commodity deals through a <em>protected chain.</em></h1>
        <p>Coordinate buyers, sellers, mandates and facilitators with auditable documents, locked commission chains and payment evidence. Commodity Connect never treats a UI state as proof that money moved.</p>
        <div className="hero-actions"><button className="primary large" onClick={() => document.getElementById('deal')?.scrollIntoView({ behavior: 'smooth' })}>Create a deal <ArrowRight size={18}/></button><button className="ghost large" onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}>Explore workflow</button></div>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="workspace" id="deal">
        <div className="panel deal-builder">
          <div className="panel-head"><div><span className="kicker">DEAL BUILDER</span><h2>Commodity terms</h2></div><span className="pill">{status}</span></div>
          <label>Commodity<select value={commodity} onChange={e => setCommodity(e.target.value as typeof commodity)}>{commodities.map(c => <option key={c}>{c}</option>)}</select></label>
          <div className="two"><label>Volume<input type="number" min="0" value={volume} onChange={e => setVolume(Number(e.target.value))}/></label><label>Unit<input value="MT" readOnly/></label></div>
          <div className="two"><label>Grade<input value={grade} onChange={e => setGrade(e.target.value)}/></label><label>Currency<select value={currency} onChange={e => setCurrency(e.target.value)}><option>USD</option><option>ZAR</option><option>EUR</option></select></label></div>
          <label>Unit price<input type="number" min="0" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))}/></label>
          <div className="value-box"><span>Indicative deal value</span><strong>{money(total, currency)}</strong><small>Calculation only — not a payment confirmation.</small></div>
          <div className="two"><button className="primary full" disabled={busy} onClick={saveDeal}>{dealId ? 'Deal saved' : 'Save deal'} <CheckCircle2 size={16}/></button><button className="ghost full" disabled={busy || !dealId || !isConfigured.remotePay} onClick={requestPayment}>Request payment <CircleDollarSign size={16}/></button></div>
          {paymentId && <div className="payment-box"><strong>RemotePay payment</strong><span>{paymentId} · {paymentStatus}{escrowId ? ` · escrow ${escrowId}` : ''}</span>{paymentUrl && <a href={paymentUrl} target="_blank" rel="noreferrer">Open hosted checkout <ArrowRight size={14}/></a>}<button className="ghost full" disabled={busy} onClick={refreshPayment}><RefreshCw size={14}/> Refresh provider status</button></div>}
          <small className="config-line">PocketBase: {isConfigured.pocketBase ? 'configured' : 'not configured'} · RemotePay: {isConfigured.remotePay ? 'configured' : 'external configuration required'}</small>
        </div>

        <div className="panel chain">
          <div className="panel-head"><div><span className="kicker">COMMISSION CHAIN</span><h2>Protected allocation</h2></div><LockKeyhole size={20}/></div>
          <div className="lock-row"><div><strong>{locked ? 'NCNDA / IMFPA chain locked' : 'Chain not locked'}</strong><span>Lock requires evidence uploads and creates an auditable participant snapshot.</span></div><button className={locked ? 'toggle on' : 'toggle'} onClick={lockChain} aria-label="Lock commission chain" disabled={locked || busy}><span/></button></div>
          {chain.map(p => <div className="commission" key={p.role}><div><strong>{p.name}</strong><span>{p.percentage.toFixed(2)}% · wallet {p.walletReady ? 'ready' : 'required'}</span></div><strong>{money(p.amount, currency)}</strong></div>)}
          <div className="total-row"><span>Total commission</span><strong>{money(commissionTotal, currency)}</strong></div>
          <div className="evidence-list"><strong>Required chain evidence</strong><span className={documents.includes('NCNDA') ? 'ok' : ''}>{documents.includes('NCNDA') ? '✓' : '○'} NCNDA</span><span className={documents.includes('IMFPA') ? 'ok' : ''}>{documents.includes('IMFPA') ? '✓' : '○'} IMFPA</span></div>
        </div>
      </section>

      <section className="panel evidence-panel">
        <div className="panel-head"><div><span className="kicker">EVIDENCE VAULT</span><h2>Deal documents</h2></div><FileCheck2 size={20}/></div>
        <p className="muted">Upload evidence against a saved deal. Uploading a document does not mark it verified; verification belongs to the authorized verification workflow.</p>
        <div className="upload-grid">{['LOI','FCO','BCL','POP','SGS','BL','NCNDA','IMFPA'].map(type => <label className={`upload-card ${documents.includes(type) ? 'uploaded' : ''}`} key={type}><FileUp size={17}/><strong>{type}</strong><span>{documents.includes(type) ? 'Uploaded' : 'Choose file'}</span><input type="file" accept="application/pdf,image/jpeg,image/png" disabled={!dealId || busy} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadDocument(file, type); }}/></label>)}</div>
      </section>

      <section className="proof-grid">
        <div className="proof-card"><FileCheck2/><strong>Verified document chain</strong><span>LOI → FCO → BCL → POP → SGS → BL → NCNDA → IMFPA, with evidence and timestamps.</span></div>
        <div className="proof-card"><Wallet/><strong>RemotePay payment truth</strong><span>Payment status is read from the canonical RemotePay boundary/provider ledger. No local fake escrow flag.</span></div>
        <div className="proof-card"><CheckCircle2/><strong>Evidence-first release</strong><span>Release is gated by payment, locked chain and delivery evidence. A button cannot create financial proof.</span></div>
      </section>

      <section className="panel catalog">
        <div className="panel-head"><div><span className="kicker">COMMODITY CATALOGUE</span><h2>Supported commodities</h2></div><div className="search"><Search size={16}/><input placeholder="Search commodities" value={search} onChange={e => setSearch(e.target.value)}/></div></div>
        <div className="chips">{filtered.map(c => <span key={c}>{c}</span>)}</div>
      </section>

      {pb.authStore.record?.platform_role === 'admin' && <section className="panel auth-panel" id="admin">
        <div className="panel-head"><div><span className="kicker">ADMIN</span><h2>Verification controls</h2></div><ShieldCheck/></div>
        <p className="muted">Authorized operators can review pending KYC and document evidence. The server enforces the admin role; normal users cannot self-assign it.</p>
        <div className="hero-actions"><button className="primary" disabled={busy} onClick={adminReview}>Refresh verification queue <RefreshCw size={15}/></button></div>
        <div className="admin-queue"><div><strong>Pending KYC</strong>{adminKyc.length === 0 ? <span className="muted">Queue empty or not loaded.</span> : adminKyc.map(item => <div className="queue-row" key={item.id}><span>{item.legal_name} · {item.role}</span><button className="ghost" disabled={busy} onClick={() => verifyKyc(item.id, true)}>Verify</button><button className="ghost" disabled={busy} onClick={() => verifyKyc(item.id, false)}>Reject</button></div>)}</div><div><strong>Unverified documents</strong>{adminDocs.length === 0 ? <span className="muted">Queue empty or not loaded.</span> : adminDocs.map(item => <div className="queue-row" key={item.id}><span>{item.type} · deal {item.deal}</span><button className="ghost" disabled={busy} onClick={() => verifyDocument(item.id)}>Verify</button></div>)}</div></div>
      </section>}

      <section className="panel auth-panel" id="auth">
        <div className="panel-head"><div><span className="kicker">IDENTITY</span><h2>{authMode === 'signin' ? 'Sign in' : 'Create account'}</h2></div>{authMode === 'signin' ? <KeyRound/> : <UserPlus/>}</div>
        <form onSubmit={authenticate} className="auth-form">
          {authMode === 'register' && <label>Name<input required value={name} onChange={e => setName(e.target.value)} /></label>}
          <label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label>Password<input required type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></label>
          {authMode === 'register' && <label>Role<select value={role} onChange={e => setRole(e.target.value as Role)}>{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>}
          <button className="primary" disabled={busy}>{busy ? 'Working…' : authMode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={16}/></button>
        </form>
        <button className="ghost" onClick={() => setAuthMode(authMode === 'signin' ? 'register' : 'signin')}>{authMode === 'signin' ? 'Create an account' : 'I already have an account'}</button>
      </section>

      <section className="workflow" id="workflow">
        {['Open deal','Documents verified','NCNDA + IMFPA locked','RemotePay payment evidence','BL / delivery evidence','Release + close'].map((step, i) => <div className={i === 0 ? 'step active' : 'step'} key={step}><span>{String(i + 1).padStart(2,'0')}</span><strong>{step}</strong>{i < 5 && <ArrowRight size={15}/>}</div>)}
        <button className="ghost demo-guard" onClick={advanceDemo}>{demoEnabled ? 'Run demo lifecycle step' : 'Evidence-gated lifecycle'}</button>
      </section>
    </main>
    <footer>Commodity Connect · C6 Group · Evidence-first production build · No payment, escrow or legal status is implied by UI state alone.</footer>
  </div>;
}
