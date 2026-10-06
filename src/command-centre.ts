import type { DealStatus } from './types';

export type CommandPriority = 'critical' | 'high' | 'medium' | 'info';

export interface CommandCentreSnapshot {
  dealId: string;
  status: DealStatus;
  kycVerified: boolean;
  documents: string[];
  locked: boolean;
  paymentStatus: string;
  deliveryEvidence: boolean;
  remotePayConfigured: boolean;
  c6SaasCoreConfigured: boolean;
}

export interface CommandMetric {
  label: string;
  value: string;
  state: 'ready' | 'attention' | 'blocked';
  detail: string;
}

export interface CommandAction {
  id: string;
  priority: CommandPriority;
  department: string;
  action: string;
  reason: string;
}

export interface CommandCentreModel {
  headline: string;
  metrics: CommandMetric[];
  actions: CommandAction[];
  lifecycle: Array<{ label: string; state: 'complete' | 'current' | 'blocked' | 'pending' }>;
}

const sequence = ['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'];

export function buildCommandCentre(s: CommandCentreSnapshot): CommandCentreModel {
  const uploaded = new Set(s.documents);
  const missing = sequence.filter(x => !uploaded.has(x));
  const paymentConfirmed = ['paid','confirmed'].includes(s.paymentStatus.toLowerCase());
  const lifecycleReady = s.status === 'closed' && s.locked && s.deliveryEvidence && paymentConfirmed;

  const actions: CommandAction[] = [];
  if (!s.dealId) actions.push({id:'create-deal',priority:'critical',department:'Trade Operations',action:'Create and save the deal',reason:'No persisted deal is selected.'});
  if (!s.kycVerified) actions.push({id:'verify-kyc',priority:'high',department:'Risk & Compliance',action:'Complete authorized KYC verification',reason:'KYC is not recorded as verified.'});
  if (missing.length) actions.push({id:'documents',priority:'high',department:'Verification',action:`Complete document sequence: ${missing.join(', ')}`,reason:`${missing.length} required document(s) are not uploaded.`});
  if (!s.locked && uploaded.has('NCNDA') && uploaded.has('IMFPA')) actions.push({id:'lock-chain',priority:'high',department:'Finance',action:'Review and lock the commission chain',reason:'NCNDA and IMFPA are present but the application lock is not recorded.'});
  if (!paymentConfirmed) actions.push({id:'payment',priority:'high',department:'Payments',action:'Reconcile RemotePay/provider status',reason:`Provider status is ${s.paymentStatus}; local UI state is not payment proof.`});
  if (s.status === 'escrow_secured' && !s.deliveryEvidence) actions.push({id:'delivery',priority:'high',department:'Trade Operations',action:'Obtain verified BL / delivery evidence',reason:'Close/release cannot proceed without delivery evidence.'});
  if (s.c6SaasCoreConfigured) actions.push({id:'migration',priority:'medium',department:'Technology',action:'Route production persistence through C6 SaaS Core',reason:'C6 SaaS Core is the target persistence platform; runtime deployment is still required.'});
  if (!s.remotePayConfigured) actions.push({id:'remotepay-config',priority:'high',department:'Payments',action:'Configure the RemotePay integration server-side',reason:'Payment-link creation is not configured.'});
  if (lifecycleReady && actions.length === 0) actions.push({id:'evidence-complete',priority:'info',department:'CEO',action:'Record the completed evidence set',reason:'All supplied lifecycle conditions are present; external/legal outcomes remain evidence-bound.'});

  const completeDocs = sequence.filter(x => uploaded.has(x)).length;
  const metrics: CommandMetric[] = [
    {label:'Deal',value:s.dealId?'Selected':'None',state:s.dealId?'ready':'blocked',detail:s.dealId?'A deal is selected in this workspace.':'Create a persisted deal before evidence actions.'},
    {label:'KYC',value:s.kycVerified?'Verified':'Pending',state:s.kycVerified?'ready':'attention',detail:s.kycVerified?'Authorized verification recorded.':'No verified KYC record supplied to the workspace.'},
    {label:'Documents',value:`${completeDocs}/${sequence.length}`,state:completeDocs===sequence.length?'ready':'attention',detail:missing.length?`Missing: ${missing.join(', ')}`:'Required document sequence uploaded.'},
    {label:'Commission',value:s.locked?'Locked':'Open',state:s.locked?'ready':'attention',detail:s.locked?'Application lock recorded.':'Lock requires the required signed evidence and authorization.'},
    {label:'Payment',value:s.paymentStatus,state:paymentConfirmed?'ready':'attention',detail:paymentConfirmed?'Provider status supplied as paid/confirmed.':'Provider reconciliation is still required.'},
    {label:'Persistence',value:s.c6SaasCoreConfigured?'Legacy':'C6 target',state:s.c6SaasCoreConfigured?'attention':'ready',detail:s.c6SaasCoreConfigured?'C6 SaaS Core is the target platform.':'C6 PostgreSQL is the target platform; runtime proof still required.'},
  ];

  const lifecycle = [
    {label:'Open deal',state:s.dealId?'complete':'current'},
    {label:'Documents',state:completeDocs===sequence.length?'complete':s.dealId?'current':'pending'},
    {label:'Commission lock',state:s.locked?'complete':completeDocs===sequence.length?'current':'pending'},
    {label:'Payment evidence',state:paymentConfirmed?'complete':s.locked?'current':'pending'},
    {label:'Delivery / BL',state:s.deliveryEvidence?'complete':paymentConfirmed?'current':'pending'},
    {label:'Close',state:s.status==='closed'?'complete':s.status==='escrow_secured'?'current':'blocked'},
  ] as CommandCentreModel['lifecycle'];

  return {
    headline: actions.length ? `${actions.length} command item(s) require attention` : 'Command centre clear',
    metrics,
    actions: actions.slice(0,8),
    lifecycle,
  };
}


export interface RoleDashboard {
  role: string;
  mission: string;
  priorities: Array<{ priority: CommandPriority; action: string; reason: string }>;
  permissions: string[];
}

export function buildRoleDashboard(role: string, s: CommandCentreSnapshot): RoleDashboard {
  const paymentConfirmed = ['paid','confirmed'].includes(s.paymentStatus.toLowerCase());
  const missing = sequence.filter(x => !s.documents.includes(x));
  const priorities: RoleDashboard['priorities'] = [];

  const add = (priority: CommandPriority, action: string, reason: string) =>
    priorities.push({ priority, action, reason });

  switch (role) {
    case 'buyer':
      if (!s.kycVerified) add('high','Complete buyer KYC','Identity verification is required before protected deal progression.');
      if (missing.length) add('high','Review required trade documents',`Outstanding: ${missing.join(', ')}.`);
      if (!paymentConfirmed) add('medium','Review provider payment status','RemotePay/provider evidence remains the payment truth boundary.');
      break;
    case 'seller':
      if (!s.kycVerified) add('high','Complete seller KYC','Seller identity is not yet recorded as verified.');
      if (!s.documents.includes('POP')) add('high','Provide POP evidence','Proof-of-product evidence is still outstanding.');
      if (!s.documents.includes('BL')) add('medium','Prepare delivery evidence','Bill of Lading evidence is required for delivery/close gates.');
      break;
    case 'buyer_mandate':
      if (!s.documents.includes('BCL')) add('high','Review BCL','Buyer mandate requires the buyer-side commitment evidence.');
      if (!s.documents.includes('NCNDA')) add('medium','Review NCNDA','Commission-chain protection requires signed NCNDA evidence.');
      break;
    case 'seller_mandate':
      if (!s.documents.includes('FCO')) add('high','Review FCO','Seller mandate needs the commercial offer evidence.');
      if (!s.documents.includes('SCO')) add('high','Review SCO','Seller-side sequence is incomplete until SCO evidence is present.');
      if (!s.documents.includes('IMFPA')) add('medium','Review IMFPA','Commission-chain protection requires signed IMFPA evidence.');
      break;
    case 'facilitator':
      if (!s.locked && s.documents.includes('NCNDA') && s.documents.includes('IMFPA')) add('high','Review commission chain','Signed NCNDA and IMFPA are present; the application lock can now be authorized.');
      if (!s.locked) add('medium','Protect commission chain','Commission terms remain mutable until the authorized lock is recorded.');
      if (!paymentConfirmed) add('medium','Reconcile payment evidence','Do not treat local payment UI state as settlement evidence.');
      break;
    case 'intermediary':
      if (missing.length) add('high','Coordinate document completion',`Track the protected sequence; outstanding: ${missing.join(', ')}.`);
      if (!paymentConfirmed) add('medium','Coordinate payment reconciliation','Provider status must be refreshed before payment-dependent progression.');
      if (s.status === 'escrow_secured' && !s.documents.includes('BL')) add('high','Coordinate delivery evidence','Close remains blocked until delivery evidence is present.');
      break;
    default:
      add('info','Select a trading role','Choose one of the six trading roles to load its operating lens.');
  }

  if (!priorities.length) add('info','Role queue clear','No additional role-specific action is generated from the supplied evidence.');

  const missions: Record<string,string> = {
    buyer:'Protect the buyer-side mandate, evidence and payment readiness.',
    seller:'Protect seller-side product, offer and delivery evidence.',
    buyer_mandate:'Protect buyer mandate commitments and commission-chain evidence.',
    seller_mandate:'Protect seller mandate commitments, offer sequence and commission evidence.',
    facilitator:'Protect deal coordination and the locked commission chain.',
    intermediary:'Coordinate evidence, counterparties and progression without inventing settlement facts.',
  };

  return {
    role,
    mission: missions[role] ?? 'Role-specific operating view over verified application state.',
    priorities: priorities.slice(0,6),
    permissions: ['View deal state','View role-relevant evidence status','Coordinate next actions','No authority to manufacture payment, custody, verification or legal outcomes'],
  };
}
