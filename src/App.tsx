import { FormEvent, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleDollarSign, FileCheck2, FileUp, KeyRound, LockKeyhole, LogOut, Search, ShieldCheck, UserPlus, Wallet, RefreshCw } from 'lucide-react';
import { commodities, demoDeal } from './data';
import { commissionAmount, dealValue, money } from './lib';
import { canAdvanceDeal, canUploadDocument, commissionSnapshot, DOCUMENT_SEQUENCE, getCommoditySpec, validateTradeTerms, type TradeUnit } from './domain';
import { buildFireIntelligence, fireHeadline } from './fire';
import { agentCompanyHeadline, routeFindings } from './agent-company';
import { isConfigured } from './config';
import { buildCommandCentre } from './command-centre';
import { createRemotePayPaymentLink, getRemotePayPaymentLink } from './services';
import { createDeal, addDealDocument, lockCommissionChain } from './runtime-client';
import { createKyc, listMyKyc, loginIdentity, registerIdentity, uploadDocumentEvidence, uploadKycEvidence } from './secure-client';
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
  const [unit, setUnit] = useState<TradeUnit>(demoDeal.unit as TradeUnit);
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
  const [authenticated, setAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [adminKyc, setAdminKyc] = useState<Array<{ id: string; legal_name: string; role: string }>>([]);
  const [adminDocs, setAdminDocs] = useState<Array<{ id: string; type: string; deal: string }>>([]);
  const [kycVerified, setKycVerified] = useState(false);
  const [identityToken, setIdentityToken] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [kycProfiles, setKycProfiles] = useState<Array<{ id: string; legal_name: string; role: string; status: string; mandate_document_evidence_id?: string | null }>>([]);
  const [kycId, setKycId] = useState('');

  const total = useMemo(() => dealValue(volume, unitPrice), [volume, unitPrice]);
  const chain = useMemo(() => commissionSnapshot(total, defaultParticipants), [total]);
  const commissionTotal = commissionAmount(total, 3.5);
  const filtered = commodities.filter(c => c.toLowerCase().includes(search.toLowerCase()));
  const signedEvidence = documents.includes('NCNDA') && documents.includes('IMFPA');
  const unitOptions = getCommoditySpec(commodity).allowedUnits;
  const nextDocument = DOCUMENT_SEQUENCE.find(type => !documents.includes(type)) ?? null;
  const paymentConfirmed = paymentStatus === 'paid';
  const deliveryEvidence = documents.includes('BL');
  const canAdvance = canAdvanceDeal(status, { paymentConfirmed, deliveryEvidence, chainLocked: locked });
  const commandCentre = buildCommandCentre({ dealId, status, kycVerified, documents, locked, paymentStatus, deliveryEvidence, remotePayConfigured: isConfigured.remotePay, c6SaasCoreConfigured: isConfigured.c6SaasCore });

  const notice = (text: string) => setMessage(text);

  async function authenticate(event: FormEvent) {
    event.preventDefault();
    if (!isConfigured.c6SaasCore) return notice('C6 SaaS Core is not configured for this environment.');
    setBusy(true); setMessage('');
    try {
      const result = authMode === 'register'
        ? await registerIdentity({ email, password, displayName: name, role })
        : await loginIdentity(email, password);
      setIdentityToken(result.access_token); setAuthenticated(true);
      const profiles = await listMyKyc(result.access_token);
      setKycProfiles(profiles); setKycId(profiles[0]?.id || '');
      setKycVerified(profiles.some(profile => profile.status === 'verified'));
      if (authMode === 'register') {
        if (!idNumber.trim()) throw new Error('Government/identity number is required to create the initial KYC profile.');
        const kyc = await createKyc(result.access_token, { legalName: name, role, idNumber });
        setKycProfiles([kyc]); setKycId(kyc.id); setKycVerified(kyc.status === 'verified');
      }
      notice(authMode === 'register' ? 'Account and identity created in C6 SaaS Core.' : 'Signed in through C6 SaaS Core.');
    } catch (error) {
      setAuthenticated(false); setIdentityToken('');
      notice(error instanceof Error ? error.message : 'Identity operation failed.');
    } finally { setBusy(false); }
  }

  async function saveDeal() {
    if (dealId) return notice(`Deal ${dealId} is already persisted in C6 SaaS Core.`);
    if (!isConfigured.c6SaasCore) return notice('C6 SaaS Core is not configured for this environment.');
    setBusy(true); setMessage('');
    try {
      const saved = await createDeal({ reference: dealId || `CC-${Date.now()}`, commodity, grade, volume, unit, unitPrice, currency, totalValue: total, totalCommissionPct: 3.5, participants: chain.map(p => ({ userId: p.name, role: p.role, commissionPct: p.percentage, commissionAmount: p.amount, walletReady: p.walletReady })) });
      setDealId(saved.id); setStatus(saved.status as DealStatus); setLocked(saved.commission_locked); notice(`Deal ${saved.reference} persisted in C6 SaaS Core.`);
    } catch (error) { notice(error instanceof Error ? error.message : 'Could not persist deal.'); }
    finally { setBusy(false); }
  }

  async function uploadDocument(file: File, type: string) {
    if (!dealId) return notice('Save the deal before uploading evidence.');
    setBusy(true); setMessage('');
    try {
      if (!identityToken) return notice('Sign in before uploading evidence.');
      const saved = await addDealDocument(dealId, { type, filename: file.name, sizeBytes: file.size, contentType: file.type || 'application/octet-stream' });
      await uploadDocumentEvidence(identityToken, dealId, saved.id, file);
      setDocuments(prev => prev.includes(type) ? prev : [...prev, type]); notice(type + ' evidence bytes and metadata persisted in C6 SaaS Core evidence storage.');
    } catch (error) { notice(error instanceof Error ? error.message : `Could not persist ${type}.`); }
    finally { setBusy(false); }
  }

  async function lockChain() {
    if (!dealId) return notice('Save the deal before locking the commission chain.');
    setBusy(true); setMessage('');
    try { const saved = await lockCommissionChain(dealId); setLocked(saved.commission_locked); notice('Commission chain lock persisted and enforced by C6 SaaS Core.'); }
    catch (error) { notice(error instanceof Error ? error.message : 'Commission-chain lock failed.'); }
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

  async function verifyDocument(_id: string) {
    notice('C6 SaaS Core verification persistence is not deployed for this browser build yet.');
  }

  async function verifyKyc(_id: string, _approved: boolean) {
    notice('C6 SaaS Core KYC verification persistence is not deployed for this browser build yet.');
  }

  async function adminReview() {
    notice('C6 SaaS Core admin verification workspace is not deployed for this browser build yet.');
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
      <div className="top-actions"><span className="status-dot">{authenticated ? 'Authenticated' : 'Evidence-first'}</span>{authenticated ? <button className="ghost" onClick={() => { setAuthenticated(false); setIdentityToken(''); setKycProfiles([]); setKycId(''); setKycVerified(false); notice('Signed out.'); }}><LogOut size={16}/> Sign out</button> : <button className="ghost" onClick={() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })}><KeyRound size={16}/> Sign in</button>}<button className="primary" onClick={() => document.getElementById('deal')?.scrollIntoView({ behavior: 'smooth' })}>Build a deal <ArrowRight size={16}/></button></div>
    </header>

    <main>
      <section className="hero">
        <div className="eyebrow"><ShieldCheck size={15}/> DEAL-CHAIN PROTECTION</div>
        <h1>Move commodity deals through a <em>protected chain.</em></h1>
        <p>Coordinate buyers, sellers, mandates and facilitators with auditable documents, locked commission chains and payment evidence. Commodity Connect never treats a UI state as proof that money moved.</p>
        <div className="hero-actions"><button className="primary large" onClick={() => document.getElementById('deal')?.scrollIntoView({ behavior: 'smooth' })}>Create a deal <ArrowRight size={18}/></button><button className="ghost large" onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}>Explore workflow</button></div>
      </section>

      {message && <div className="notice">{message}</div>}

      <section className="panel fire-panel" id="fire">
        <div className="panel-head"><div><span className="kicker">FIRE CORE</span><h2>Operational intelligence</h2></div><span className="pill">LIVE STATE</span></div>
        <p className="muted">{fireHeadline(buildFireIntelligence({ dealId, status, kycVerified, documents, locked, paymentStatus, deliveryEvidence, remotePayConfigured: isConfigured.remotePay, c6SaasCoreConfigured: isConfigured.c6SaasCore }))}</p>
        <div className="fire-grid">
          {buildFireIntelligence({ dealId, status, kycVerified, documents, locked, paymentStatus, deliveryEvidence, remotePayConfigured: isConfigured.remotePay, c6SaasCoreConfigured: isConfigured.c6SaasCore }).map(finding => <article className="fire-card" key={finding.id}>
            <div className="fire-card-head"><span className={`fire-severity ${finding.severity}`}>{finding.severity}</span><span className="fire-dept">{finding.department}</span></div>
            <strong>{finding.title}</strong>
            <span>{finding.reason}</span>
            <small><b>Next action:</b> {finding.nextAction}</small>
            <small><b>Evidence:</b> {finding.evidence.join(' · ')}</small>
          </article>)}
        </div>
        <small className="config-line">FIRE is deterministic in Wave 2: it reads supplied application/provider state and does not invent payment, legal, verification or custody facts.</small>
        {(() => { const handoffs = routeFindings(buildFireIntelligence({ dealId, status, kycVerified, documents, locked, paymentStatus, deliveryEvidence, remotePayConfigured: isConfigured.remotePay, c6SaasCoreConfigured: isConfigured.c6SaasCore })); return <div className="agent-company-box"><div className="panel-head"><div><span className="kicker">AGENT COMPANY</span><strong>{agentCompanyHeadline(handoffs)}</strong></div><span className="pill">PERMISSIONED</span></div><div className="handoff-list">{handoffs.slice(0,6).map(h => <div className="handoff-row" key={h.id}><span>{h.to}</span><strong>{h.status.replace('_',' ')}</strong><small>{h.action}{h.requiredApproval ? ` · approval: ${h.requiredApproval}` : ''}</small></div>)}</div></div> })()}
      </section>

      <section className="panel command-centre" id="command-centre">
        <div className="panel-head"><div><span className="kicker">COMMAND CENTRE</span><h2>What needs to happen next</h2></div><span className="pill">{commandCentre.headline}</span></div>
        <div className="command-metrics">{commandCentre.metrics.map(metric => <article className={`command-metric ${metric.state}`} key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.detail}</small></article>)}</div>
        <div className="command-actions"><strong>Action queue</strong>{commandCentre.actions.length === 0 ? <span className="muted">No command items generated from the supplied state.</span> : commandCentre.actions.map(item => <div className="command-row" key={item.id}><span className={`command-priority ${item.priority}`}>{item.priority}</span><div><strong>{item.department}: {item.action}</strong><small>{item.reason}</small></div></div>)}</div>
        <div className="command-lifecycle"><strong>Lifecycle</strong><div className="lifecycle-track">{commandCentre.lifecycle.map((step,i) => <div className={`lifecycle-step ${step.state}`} key={step.label}><span>{String(i+1).padStart(2,"0")}</span><small>{step.label}</small></div>)}</div></div>
        <small className="config-line">Command Centre is a decision-support view over supplied application/provider evidence. It cannot create payment, custody, verification, release or legal outcomes.</small>
      </section>

      <section className="workspace" id="deal">
        <div className="panel deal-builder">
          <div className="panel-head"><div><span className="kicker">DEAL BUILDER</span><h2>Commodity terms</h2></div><span className="pill">{status}</span></div>
          <label>Commodity<select value={commodity} onChange={e => setCommodity(e.target.value as typeof commodity)}>{commodities.map(c => <option key={c}>{c}</option>)}</select></label>
          <div className="two"><label>Volume<input type="number" min="0" value={volume} onChange={e => setVolume(Number(e.target.value))}/></label><label>Unit<select value={unit} onChange={e => setUnit(e.target.value as TradeUnit)}>{unitOptions.map(option => <option key={option}>{option}</option>)}</select></label></div>
          <div className="two"><label>Grade/specification<input required value={grade} onChange={e => setGrade(e.target.value)}/></label><label>Currency<select value={currency} onChange={e => setCurrency(e.target.value)}><option>USD</option><option>ZAR</option><option>EUR</option></select></label></div>
          <label>Unit price<input type="number" min="0" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))}/></label>
          <div className="value-box"><span>Indicative deal value</span><strong>{money(total, currency)}</strong><small>Calculation only — not a payment confirmation.</small></div>
          <div className="two"><button className="primary full" disabled={busy} onClick={saveDeal}>{dealId ? 'Deal saved' : 'Save deal'} <CheckCircle2 size={16}/></button><button className="ghost full" disabled={busy || !dealId || !isConfigured.remotePay} onClick={requestPayment}>Request payment <CircleDollarSign size={16}/></button></div>
          {paymentId && <div className="payment-box"><strong>RemotePay payment</strong><span>{paymentId} · {paymentStatus}{escrowId ? ` · escrow ${escrowId}` : ''}</span>{paymentUrl && <a href={paymentUrl} target="_blank" rel="noreferrer">Open hosted checkout <ArrowRight size={14}/></a>}<button className="ghost full" disabled={busy} onClick={refreshPayment}><RefreshCw size={14}/> Refresh provider status</button></div>}
          <small className="config-line">C6 persistence: {isConfigured.c6SaasCore ? 'configured' : 'not deployed'} · RemotePay: {isConfigured.remotePay ? 'configured' : 'external configuration required'}</small>
        </div>

        <div className="panel chain">
          <div className="panel-head"><div><span className="kicker">COMMISSION CHAIN</span><h2>Protected allocation</h2></div><LockKeyhole size={20}/></div>
          <div className="lock-row"><div><strong>{locked ? 'NCNDA / IMFPA chain locked' : 'Chain not locked'}</strong><span>Lock requires evidence uploads and creates an auditable participant snapshot.</span></div><button className={locked ? 'toggle on' : 'toggle'} onClick={lockChain} aria-label="Lock commission chain" disabled={locked || busy}><span/></button></div>
          {chain.map(p => <div className="commission" key={p.role}><div><strong>{p.name}</strong><span>{p.percentage.toFixed(2)}% · wallet {p.walletReady ? 'ready' : 'required'}</span></div><strong>{money(p.amount, currency)}</strong></div>)}
          <div className="total-row"><span>Total commission</span><strong>{money(commissionTotal, currency)}</strong></div>
          <div className="evidence-list"><strong>Required chain evidence</strong><span className={documents.includes('NCNDA') ? 'ok' : ''}>{documents.includes('NCNDA') ? '✓' : '○'} NCNDA</span><span className={documents.includes('IMFPA') ? 'ok' : ''}>{documents.includes('IMFPA') ? '✓' : '○'} IMFPA</span></div>
        </div>
      </section>

      <section className="panel auth-panel" id="kyc">
        <div className="panel-head"><div><span className="kicker">KYC</span><h2>Identity verification</h2></div><ShieldCheck/></div>
        <p className="muted">Identity records are stored in C6 SaaS Core. Raw identity numbers are never stored; the server stores a one-way hash. Verification remains operator-controlled.</p>
        {!authenticated ? <span className="muted">Sign in to manage KYC.</span> : <div className="admin-queue">
          {kycProfiles.length === 0 ? <span className="muted">No KYC profile yet.</span> : kycProfiles.map(profile => <div className="queue-row" key={profile.id}><span>{profile.legal_name} · {profile.role} · {profile.status}</span>{profile.status !== 'verified' && <label className="ghost">Upload ID/mandate evidence<input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadKycEvidence(identityToken, profile.id, file).then(() => notice('KYC evidence uploaded and awaiting operator verification.')).catch(err => notice(err instanceof Error ? err.message : 'KYC evidence upload failed.')); }}/></label>}</div>)}
        </div>}
      </section>

      <section className="panel evidence-panel">
        <div className="panel-head"><div><span className="kicker">EVIDENCE VAULT</span><h2>Deal documents</h2></div><FileCheck2 size={20}/></div>
        <p className="muted">Upload evidence against a saved deal. Uploading a document does not mark it verified; verification belongs to the authorized verification workflow.</p>
        <div className="upload-grid">{DOCUMENT_SEQUENCE.map(type => <label className={`upload-card ${documents.includes(type) ? 'uploaded' : ''}`} key={type}><FileUp size={17}/><strong>{type}</strong><span>{documents.includes(type) ? 'Uploaded' : 'Choose file'}</span><input type="file" accept="application/pdf,image/jpeg,image/png" disabled={!dealId || busy} onChange={e => { const file = e.target.files?.[0]; if (file) void uploadDocument(file, type); }}/></label>)}</div>
      </section>

      <section className="proof-grid">
        <div className="proof-card"><FileCheck2/><strong>Verified document chain</strong><span>LOI → BCL → FCO → SCO → POP → SGS → BL → NCNDA → IMFPA, with evidence and timestamps.</span></div>
        <div className="proof-card"><Wallet/><strong>RemotePay payment truth</strong><span>Payment status is read from the canonical RemotePay boundary/provider ledger. No local fake escrow flag.</span></div>
        <div className="proof-card"><CheckCircle2/><strong>Evidence-first release</strong><span>Release is gated by payment, locked chain and delivery evidence. A button cannot create financial proof.</span></div>
      </section>

      <section className="panel catalog">
        <div className="panel-head"><div><span className="kicker">COMMODITY CATALOGUE</span><h2>Supported commodities</h2></div><div className="search"><Search size={16}/><input placeholder="Search commodities" value={search} onChange={e => setSearch(e.target.value)}/></div></div>
        <div className="chips">{filtered.map(c => <span key={c}>{c}</span>)}</div>
      </section>

      {false && <section className="panel auth-panel" id="admin">
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
          <label>Password<input required type="password" minLength={12} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} /></label>
          {authMode === 'register' && <label>Identity/Government number<input required value={idNumber} onChange={e => setIdNumber(e.target.value)} /></label>}{authMode === 'register' && <label>Role<select value={role} onChange={e => setRole(e.target.value as Role)}>{roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label>}
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
