/// <reference path="../pb_data/types.d.ts" />

migrate((db) => {
  const deals = db.findCollectionByNameOrId('deals');
  if (deals) {
    deals.updateRule = '@request.auth.id = created_by';
    db.saveCollection(deals);
  }

  const escrows = db.findCollectionByNameOrId('escrows');
  if (escrows) {
    const add = (field) => {
      if (!escrows.fields.getByName(field.name)) escrows.fields.add(field);
    };
    add(new Field({ name: 'provider_status', type: 'text' }));
    add(new Field({ name: 'last_provider_sync', type: 'date' }));
    add(new Field({ name: 'release_reference', type: 'text' }));
    add(new Field({ name: 'release_requested_at', type: 'date' }));
    add(new Field({ name: 'released_at', type: 'date' }));
    add(new Field({ name: 'dispute_reason', type: 'text' }));
    db.saveCollection(escrows);
  }
}, (db) => {
  const escrows = db.findCollectionByNameOrId('escrows');
  if (escrows) {
    ['provider_status','last_provider_sync','release_reference','release_requested_at','released_at','dispute_reason'].forEach((name) => {
      if (escrows.fields.getByName(name)) escrows.fields.removeByName(name);
    });
    db.saveCollection(escrows);
  }
});