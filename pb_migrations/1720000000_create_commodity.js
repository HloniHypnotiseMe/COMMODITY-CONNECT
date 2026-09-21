/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  const users = db.findCollectionByNameOrId('_pb_users_auth_');
  if (users && !users.fields.getByName('platform_role')) {
    users.fields.add(new Field({ name: 'platform_role', type: 'select', options: { maxSelect: 1, values: ['user', 'admin'], default: 'user' } }));
    users.fields.getByName('platform_role').options = { maxSelect: 1, values: ['user', 'admin'], default: 'user' };
    users.createRule = '@request.body.platform_role != "admin"';
    db.saveCollection(users);
  }

  const authRule = '@request.auth.id != ""';
  const ownerRule = '@request.auth.id = owner';
  const adminRule = '@request.auth.id != "" && @request.auth.platform_role = "admin"';
  const dealMemberRule = `@request.auth.id != "" && (created_by = @request.auth.id || deal_participants_via_deal.user = @request.auth.id)`;
  const participantDealRule = `@request.auth.id != "" && (deal.created_by = @request.auth.id || user = @request.auth.id || @request.auth.platform_role = "admin")`;

  const kyc = new Collection({
    type: 'base', name: 'kyc_profiles', listRule: `owner = @request.auth.id || ${adminRule}`, viewRule: `owner = @request.auth.id || ${adminRule}`,
    createRule: ownerRule, updateRule: `(owner = @request.auth.id && status = "pending") || ${adminRule}`, deleteRule: null,
    fields: [
      new Field({ name: 'owner', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } }),
      new Field({ name: 'legal_name', type: 'text', required: true }),
      new Field({ name: 'role', type: 'select', required: true, options: { maxSelect: 1, values: ['buyer','seller','buyer_mandate','seller_mandate','facilitator','intermediary'] } }),
      new Field({ name: 'id_number_hash', type: 'text' }),
      new Field({ name: 'mandate_document', type: 'file', options: { maxSelect: 1, maxSize: 10485760, mimeTypes: ['application/pdf','image/jpeg','image/png'] } }),
      new Field({ name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['pending','verified','rejected'] } }),
      new Field({ name: 'verification_notes', type: 'text' }),
      new Field({ name: 'sequence_index', type: 'number', required: true })
    ]
  });
  db.saveCollection(kyc);

  const deals = new Collection({
    type: 'base', name: 'deals', listRule: dealMemberRule, viewRule: dealMemberRule, createRule: authRule,
    updateRule: `@request.auth.id = created_by && commission_locked = false`,
    deleteRule: '@request.auth.id = created_by && status = "open" && commission_locked = false',
    fields: [
      new Field({ name: 'reference', type: 'text', required: true, unique: true }),
      new Field({ name: 'created_by', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } }),
      new Field({ name: 'commodity', type: 'text', required: true }),
      new Field({ name: 'grade', type: 'text' }),
      new Field({ name: 'volume', type: 'number', required: true }),
      new Field({ name: 'unit', type: 'text', required: true }),
      new Field({ name: 'unit_price', type: 'number', required: true }),
      new Field({ name: 'currency', type: 'text', required: true }),
      new Field({ name: 'total_value', type: 'number', required: true }),
      new Field({ name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['open','escrow_secured','closed'] } }),
      new Field({ name: 'total_commission_pct', type: 'number', required: true }),
      new Field({ name: 'commission_locked', type: 'bool' }),
      new Field({ name: 'lock_evidence', type: 'file', options: { maxSelect: 2, maxSize: 20971520, mimeTypes: ['application/pdf','image/jpeg','image/png'] } }),
      new Field({ name: 'remote_pay_reference', type: 'text' })
    ]
  });
  db.saveCollection(deals);

  const participants = new Collection({
    type: 'base', name: 'deal_participants', listRule: participantDealRule, viewRule: participantDealRule,
    createRule: `@request.auth.id != "" && deal.created_by = @request.auth.id && deal.commission_locked = false`,
    updateRule: `@request.auth.id != "" && deal.created_by = @request.auth.id && deal.commission_locked = false`,
    deleteRule: `@request.auth.id != "" && deal.created_by = @request.auth.id && deal.commission_locked = false`,
    fields: [
      new Field({ name: 'deal', type: 'relation', required: true, options: { collectionId: deals.id, cascadeDelete: true, maxSelect: 1 } }),
      new Field({ name: 'user', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } }),
      new Field({ name: 'role', type: 'select', required: true, options: { maxSelect: 1, values: ['buyer','seller','buyer_mandate','seller_mandate','facilitator','intermediary'] } }),
      new Field({ name: 'commission_pct', type: 'number', required: true }),
      new Field({ name: 'commission_amount', type: 'number', required: true }),
      new Field({ name: 'wallet_ready', type: 'bool' }),
      new Field({ name: 'locked_snapshot', type: 'json' })
    ]
  });
  db.saveCollection(participants);

  const documents = new Collection({
    type: 'base', name: 'documents', listRule: `${dealMemberRule} || ${adminRule}`, viewRule: `${dealMemberRule} || ${adminRule}`, createRule: dealMemberRule,
    updateRule: `@request.auth.platform_role = "admin"`, deleteRule: `@request.auth.platform_role = "admin"`,
    fields: [
      new Field({ name: 'deal', type: 'relation', required: true, options: { collectionId: deals.id, cascadeDelete: true, maxSelect: 1 } }),
      new Field({ name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['LOI','BCL','FCO','SCO','POP','SGS','BL','NCNDA','IMFPA'] } }),
      new Field({ name: 'file', type: 'file', required: true, options: { maxSelect: 1, maxSize: 52428800, mimeTypes: ['application/pdf','image/jpeg','image/png'] } }),
      new Field({ name: 'verified', type: 'bool' }),
      new Field({ name: 'verified_by', type: 'relation', options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } }),
      new Field({ name: 'verification_notes', type: 'text' }),
      new Field({ name: 'sequence_index', type: 'number', required: true })
    ]
  });
  db.saveCollection(documents);

  const wallets = new Collection({
    type: 'base', name: 'wallets', listRule: ownerRule, viewRule: ownerRule, createRule: ownerRule, updateRule: ownerRule, deleteRule: null,
    fields: [
      new Field({ name: 'owner', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } }),
      new Field({ name: 'type', type: 'select', required: true, options: { maxSelect: 1, values: ['bank','usdt','btc'] } }),
      new Field({ name: 'destination_encrypted', type: 'text', required: true }),
      new Field({ name: 'verified', type: 'bool' })
    ]
  });
  db.saveCollection(wallets);

  const escrows = new Collection({
    type: 'base', name: 'escrows', listRule: `${dealMemberRule} || ${adminRule}`, viewRule: `${dealMemberRule} || ${adminRule}`, createRule: `@request.auth.id != "" && deal.created_by = @request.auth.id`,
    updateRule: `@request.auth.platform_role = "admin"`, deleteRule: null,
    fields: [
      new Field({ name: 'deal', type: 'relation', required: true, options: { collectionId: deals.id, cascadeDelete: true, maxSelect: 1 } }),
      new Field({ name: 'remote_pay_reference', type: 'text', required: true }),
      new Field({ name: 'status', type: 'select', required: true, options: { maxSelect: 1, values: ['pending','confirmed','release_requested','released','disputed'] } }),
      new Field({ name: 'payment_evidence', type: 'json' }),
      new Field({ name: 'release_evidence', type: 'json' })
    ]
  });
  db.saveCollection(escrows);

  const audit = new Collection({
    type: 'base', listRule: `${dealMemberRule} || ${adminRule}`, viewRule: `${dealMemberRule} || ${adminRule}`, createRule: authRule, updateRule: null, deleteRule: null,
    fields: [
      new Field({ name: 'actor', type: 'relation', required: true, options: { collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1 } }),
      new Field({ name: 'deal', type: 'relation', options: { collectionId: deals.id, cascadeDelete: true, maxSelect: 1 } }),
      new Field({ name: 'event_type', type: 'text', required: true }),
      new Field({ name: 'evidence', type: 'json' })
    ]
  });
  db.saveCollection(audit);
}, (db) => {
  ['audit_events','escrows','wallets','documents','deal_participants','deals','kyc_profiles'].forEach(name => {
    const collection = db.findCollectionByNameOrId(name);
    if (collection) db.deleteCollection(collection);
  });
  const users = db.findCollectionByNameOrId('_pb_users_auth_');
  if (users && users.fields.getByName('platform_role')) {
    users.fields.removeByName('platform_role');
    db.saveCollection(users);
  }
});