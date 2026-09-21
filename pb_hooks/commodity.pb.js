// Commodity Connect server-side invariants.
// Financial truth remains external to this app: RemotePay/provider evidence must
// confirm payment before an escrow can secure a deal, and release evidence must
// exist before a deal can close.

function actorId(e) {
  return e.auth ? e.auth.get('id') : '';
}

function audit(app, actor, deal, eventType, evidence) {
  if (!deal || !actor) return;
  const collection = app.findCollectionByNameOrId('audit_events');
  const record = new Record(collection);
  record.set('actor', actor);
  record.set('deal', deal);
  record.set('event_type', eventType);
  record.set('evidence', evidence || {});
  app.save(record);
}

function verifiedDocument(app, dealId, type) {
  try {
    app.findFirstRecordByFilter(
      'documents',
      'deal = {:deal} && type = {:type} && verified = true',
      { deal: dealId, type },
    );
    return true;
  } catch (_) {
    return false;
  }
}

function escrowForDeal(app, dealId) {
  try {
    return app.findFirstRecordByFilter('escrows', 'deal = {:deal}', { deal: dealId });
  } catch (_) {
    return null;
  }
}

onRecordCreateRequest((e) => {
  if (e.collection.name === 'audit_events') {
    if (!e.auth) throw e.unauthorizedError('Authentication is required for audit events.');
    e.record.set('actor', e.auth.get('id'));
  }
  e.next();
}, 'audit_events');

onRecordUpdateRequest((e) => {
  const oldRecord = e.record.original();
  const wasLocked = oldRecord.getBool('commission_locked');
  const isLocked = e.record.getBool('commission_locked');

  if (!wasLocked && isLocked) {
    if (!e.auth || e.auth.get('id') !== e.record.get('created_by')) {
      throw e.forbiddenError('Only the deal owner can lock the commission chain.');
    }

    const dealId = e.record.get('id');
    for (const requiredType of ['NCNDA', 'IMFPA']) {
      if (!verifiedDocument(e.app, dealId, requiredType)) {
        throw e.badRequestError(`Verified ${requiredType} evidence is required before locking the commission chain.`);
      }
    }
  }

  if (wasLocked) {
    const immutableFields = ['created_by','reference','commodity','grade','volume','unit','unit_price','currency','total_value','total_commission_pct'];
    for (const field of immutableFields) {
      if (String(oldRecord.get(field)) !== String(e.record.get(field))) {
        throw e.badRequestError(`Deal field ${field} is immutable after commission lock.`);
      }
    }
    if (oldRecord.getBool('commission_locked') !== e.record.getBool('commission_locked')) {
      throw e.badRequestError('A locked commission chain cannot be unlocked.');
    }
  }

  const oldStatus = oldRecord.get('status');
  const newStatus = e.record.get('status');
  if (oldStatus !== newStatus) {
    if (!e.auth || e.auth.get('id') !== e.record.get('created_by')) {
      throw e.forbiddenError('Only the deal owner can advance the deal lifecycle.');
    }
    if (oldStatus === 'open' && newStatus === 'escrow_secured') {
      if (!isLocked) throw e.badRequestError('Commission chain must be locked before escrow can be secured.');
      const escrow = escrowForDeal(e.app, e.record.get('id'));
      if (!escrow || escrow.get('status') !== 'confirmed') {
        throw e.badRequestError('RemotePay/provider confirmation is required before escrow can be secured.');
      }
    } else if (oldStatus === 'escrow_secured' && newStatus === 'closed') {
      if (!isLocked) throw e.badRequestError('Commission chain must remain locked until close.');
      const escrow = escrowForDeal(e.app, e.record.get('id'));
      if (!escrow || escrow.get('status') !== 'released') {
        throw e.badRequestError('Escrow release evidence is required before the deal can close.');
      }
      if (!verifiedDocument(e.app, e.record.get('id'), 'BL')) {
        throw e.badRequestError('Verified BL/delivery evidence is required before the deal can close.');
      }
    } else {
      throw e.badRequestError(`Invalid lifecycle transition: ${oldStatus} -> ${newStatus}.`);
    }
  }

  e.next();

  if (oldStatus !== newStatus) {
    audit(e.app, actorId(e), e.record.get('id'), 'deal.lifecycle_advanced', {
      from: oldStatus,
      to: newStatus,
      evidence_required: newStatus === 'escrow_secured' ? 'provider_payment_confirmation' : 'released_escrow_and_verified_BL',
    });
  }
  if (!wasLocked && isLocked) {
    audit(e.app, actorId(e), e.record.get('id'), 'deal.commission_locked', {
      evidence: ['verified_NCNDA', 'verified_IMFPA'],
    });
  }
}, 'deals');

onRecordCreateRequest((e) => {
  if (e.collection.name === 'escrows') {
    if (!e.auth) throw e.unauthorizedError('Authentication is required for escrow records.');
    const deal = e.app.findRecordById('deals', e.record.get('deal'));
    if (deal.get('created_by') !== e.auth.get('id')) {
      throw e.forbiddenError('Only the deal owner can create the escrow record.');
    }
    e.record.set('status', 'pending');
    e.record.set('provider_status', 'pending');
  }
  e.next();
}, 'escrows');

onRecordUpdateRequest((e) => {
  const oldStatus = e.record.original().get('status');
  const newStatus = e.record.get('status');
  if (oldStatus === newStatus) return e.next();

  if (!e.auth || e.auth.get('platform_role') !== 'admin') {
    throw e.forbiddenError('Only an authorized Commodity Connect operator can reconcile escrow status.');
  }

  const allowed = {
    pending: ['confirmed', 'disputed'],
    confirmed: ['release_requested', 'disputed'],
    release_requested: ['released', 'disputed'],
    released: [],
    disputed: ['confirmed', 'release_requested'],
  };
  if (!(allowed[oldStatus] || []).includes(newStatus)) {
    throw e.badRequestError(`Invalid escrow transition: ${oldStatus} -> ${newStatus}.`);
  }

  if (newStatus === 'confirmed') {
    const evidence = e.record.get('payment_evidence');
    if (!evidence) throw e.badRequestError('Payment confirmation evidence is required.');
  }
  if (newStatus === 'release_requested') {
    const deal = e.app.findRecordById('deals', e.record.get('deal'));
    if (!deal.getBool('commission_locked')) throw e.badRequestError('Commission chain must be locked before release can be requested.');
    if (deal.get('status') !== 'escrow_secured') throw e.badRequestError('Deal must be escrow_secured before release can be requested.');
    if (!verifiedDocument(e.app, deal.get('id'), 'BL')) throw e.badRequestError('Verified BL/delivery evidence is required before release.');
    e.record.set('release_requested_at', new Date().toISOString());
  }
  if (newStatus === 'released') {
    if (!e.record.get('release_reference')) throw e.badRequestError('A provider release reference is required before marking escrow released.');
    const evidence = e.record.get('release_evidence');
    if (!evidence) throw e.badRequestError('Release evidence is required before marking escrow released.');
    e.record.set('released_at', new Date().toISOString());
  }

  e.next();
  audit(e.app, actorId(e), e.record.get('deal'), 'escrow.status_reconciled', {
    from: oldStatus,
    to: newStatus,
    provider_status: e.record.get('provider_status'),
  });
}, 'escrows');

onRecordAfterCreateSuccess((e) => {
  if (e.collection.name === 'deals') {
    const actor = e.record.get('created_by');
    audit(e.app, actor, e.record.get('id'), 'deal.created', {
      reference: e.record.get('reference'),
      commodity: e.record.get('commodity'),
      total_value: e.record.get('total_value'),
      currency: e.record.get('currency'),
    });
  }
  e.next();
});

onRecordAfterCreateSuccess((e) => {
  if (e.collection.name === 'documents') {
    const dealId = e.record.get('deal');
    const deal = e.app.findRecordById('deals', dealId);
    audit(e.app, deal.get('created_by'), dealId, 'document.uploaded', {
      type: e.record.get('type'),
      sequence_index: e.record.get('sequence_index'),
      verified: e.record.getBool('verified'),
    });
  }
  e.next();
});

onRecordAfterUpdateSuccess((e) => {
  if (e.collection.name === 'documents' && e.record.getBool('verified')) {
    const dealId = e.record.get('deal');
    const deal = e.app.findRecordById('deals', dealId);
    audit(e.app, e.record.get('verified_by') || deal.get('created_by'), dealId, 'document.verified', {
      type: e.record.get('type'),
      verification_notes: e.record.get('verification_notes'),
    });
  }
  e.next();
});
