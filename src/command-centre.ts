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
  pocketBaseConfigured: boolean;
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
  if (s.pocketBaseConfigured) actions.push({id:'migration',priority:'medium',department:'Technology',action:'Route production persistence through C6 SaaS Core',reason:'PocketBase is a migration-era runtime and must not be treated as final production persistence.'});
  if (!s.remotePayConfigured) actions.push({id:'remotepay-config',priority:'high',department:'Payments',action:'Configure the RemotePay integration server-side',reason:'Payment-link creation is not configured.'});
  if (lifecycleReady && actions.length === 0) actions.push({id:'evidence-complete',priority:'info',department:'CEO',action:'Record the completed evidence set',reason:'All supplied lifecycle conditions are present; external/legal outcomes remain evidence-bound.'});

  const completeDocs = sequence.filter(x => uploaded.has(x)).length;
  const metrics: CommandMetric[] = [
    {label:'Deal',value:s.dealId?'Selected':'None',state:s.dealId?'ready':'blocked',detail:s.dealId?'A deal is selected in this workspace.':'Create a persisted deal before evidence actions.'},
    {label:'KYC',value:s.kycVerified?'Verified':'Pending',state:s.kycVerified?'ready':'attention',detail:s.kycVerified?'Authorized verification recorded.':'No verified KYC record supplied to the workspace.'},
    {label:'Documents',value:`${completeDocs}/${sequence.length}`,state:completeDocs===sequence.length?'ready':'attention',detail:missing.length?`Missing: ${missing.join(', ')}`:'Required document sequence uploaded.'},
    {label:'Commission',value:s.locked?'Locked':'Open',state:s.locked?'ready':'attention',detail:s.locked?'Application lock recorded.':'Lock requires the required signed evidence and authorization.'},
    {label:'Payment',value:s.paymentStatus,state:paymentConfirmed?'ready':'attention',detail:paymentConfirmed?'Provider status supplied as paid/confirmed.':'Provider reconciliation is still required.'},
    {label:'Persistence',value:s.pocketBaseConfigured?'Legacy':'C6 target',state:s.pocketBaseConfigured?'attention':'ready',detail:s.pocketBaseConfigured?'PocketBase is migration-only.':'C6 PostgreSQL is the target platform; runtime proof still required.'},
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
