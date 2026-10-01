import type { FireDepartment, FireFinding } from './fire';

export type AgentDepartment = Exclude<FireDepartment, 'CEO'>;
export type AgentRole = 'observer' | 'operator' | 'approver';
export type HandoffStatus = 'ready' | 'approval_required' | 'blocked';

export interface AgentDefinition { id: string; department: AgentDepartment; role: AgentRole; capabilities: string[]; forbidden: string[]; }
export interface AgentHandoff { id: string; findingId: string; from: 'FIRE'; to: AgentDepartment; status: HandoffStatus; action: string; requiredApproval?: 'CEO' | 'Risk & Compliance' | 'Finance' | 'Payments' | 'Verification'; }

const agents: AgentDefinition[] = [
 {id:'trade-ops',department:'Trade Operations',role:'operator',capabilities:['deal coordination','delivery-evidence follow-up'],forbidden:['release funds','declare payment confirmed']},
 {id:'risk-compliance',department:'Risk & Compliance',role:'approver',capabilities:['KYC review routing','risk escalation'],forbidden:['self-approve KYC','release funds']},
 {id:'verification',department:'Verification',role:'operator',capabilities:['document review routing','evidence completeness'],forbidden:['declare evidence authentic without authorized verification']},
 {id:'finance',department:'Finance',role:'approver',capabilities:['commission-chain review'],forbidden:['invent commission entitlement','release funds']},
 {id:'payments',department:'Payments',role:'operator',capabilities:['provider-status reconciliation'],forbidden:['mark provider payment paid','release funds']},
 {id:'technology',department:'Technology',role:'operator',capabilities:['runtime migration routing','integration diagnostics'],forbidden:['alter financial truth']},
 {id:'commercial',department:'Commercial',role:'operator',capabilities:['buyer/seller workflow follow-up'],forbidden:['override risk gates']},
 {id:'data-intelligence',department:'Data & Intelligence',role:'observer',capabilities:['evidence-backed reporting'],forbidden:['change source-of-truth state']},
];

export function getAgent(department: AgentDepartment) { return agents.find(a => a.department === department); }
export function routeFireFinding(finding: FireFinding): AgentHandoff {
 const department = finding.department === 'CEO' ? 'Trade Operations' : finding.department;
 const agent = getAgent(department);
 if (!agent) return {id:`handoff-${finding.id}`,findingId:finding.id,from:'FIRE',to:department,status:'blocked',action:finding.nextAction};
 const needsApproval = agent.role === 'approver' || finding.severity === 'critical';
 const approval = department === 'Risk & Compliance' ? 'Risk & Compliance' : department === 'Finance' ? 'Finance' : department === 'Payments' ? 'Payments' : department === 'Verification' ? 'Verification' : undefined;
 return {id:`handoff-${finding.id}`,findingId:finding.id,from:'FIRE',to:department,status:needsApproval ? 'approval_required' : 'ready',action:finding.nextAction,requiredApproval:needsApproval ? approval : undefined};
}
export function routeFindings(findings: FireFinding[]): AgentHandoff[] { return findings.map(routeFireFinding); }
export function agentCompanyHeadline(handoffs: AgentHandoff[]): string {
 const blocked = handoffs.filter(h => h.status === 'blocked').length;
 const approvals = handoffs.filter(h => h.status === 'approval_required').length;
 if (blocked) return `${blocked} handoff(s) blocked`;
 if (approvals) return `${approvals} handoff(s) require authorized approval`;
 return handoffs.length ? `${handoffs.length} operational handoff(s) ready` : 'No operational handoffs';
}