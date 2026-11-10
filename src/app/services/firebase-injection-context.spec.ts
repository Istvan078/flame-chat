import { EnvironmentInjector, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { isObservable, queueScheduler } from 'rxjs';
import { BaseService } from './base.service';
import { FirestoreService } from './firestore.service';

describe('Firebase calls outside the construction injection context', () => {
  let base: BaseService;
  let firestore: FirestoreService;
  let update: jasmine.Spy;
  let deleteDocument: jasmine.Spy;
  let document: jasmine.Spy;
  let collection: jasmine.Spy;

  beforeEach(() => {
    // Keep AngularFire's real reference factories, replacing only the SDK I/O.
    // These factories call inject(), which plain service mocks would miss.
    const database = Object.create(AngularFireDatabase.prototype);
    const store = Object.create(AngularFirestore.prototype);
    update = jasmine.createSpy('update').and.resolveTo();
    deleteDocument = jasmine.createSpy('delete').and.resolveTo();
    document = jasmine.createSpy('doc').and.returnValue({
      update,
      delete: deleteDocument,
    });
    const collectionRef = {
      doc: document,
      where: jasmine.createSpy('where'),
      orderBy: jasmine.createSpy('orderBy'),
      limit: jasmine.createSpy('limit'),
      get: jasmine.createSpy('get').and.resolveTo({
        docs: [{ id: 'usage-id' }],
        empty: false,
      }),
    };
    collectionRef.where.and.returnValue(collectionRef);
    collectionRef.orderBy.and.returnValue(collectionRef);
    collectionRef.limit.and.returnValue(collectionRef);
    collection = jasmine.createSpy('collection').and.returnValue(collectionRef);

    const query = {
      ref: {} as object,
      update,
      orderByChild: jasmine.createSpy('orderByChild'),
      orderByValue: jasmine.createSpy('orderByValue'),
      startAt: jasmine.createSpy('startAt'),
      endAt: jasmine.createSpy('endAt'),
      equalTo: jasmine.createSpy('equalTo'),
      limitToLast: jasmine.createSpy('limitToLast'),
    };
    query.ref = query;
    for (const method of [
      query.orderByChild,
      query.orderByValue,
      query.startAt,
      query.endAt,
      query.equalTo,
      query.limitToLast,
    ]) {
      method.and.returnValue(query);
    }

    TestBed.configureTestingModule({
      providers: [
        BaseService,
        FirestoreService,
        { provide: AngularFireDatabase, useValue: database },
        { provide: AngularFirestore, useValue: store },
        { provide: AngularFireStorage, useValue: {} },
        { provide: NgbModal, useValue: {} },
      ],
    });

    Object.assign(database, {
      database: { ref: () => query },
      injector: TestBed.inject(EnvironmentInjector),
      schedulers: { outsideAngular: queueScheduler },
    });
    Object.assign(store, {
      firestore: { collection },
      ngZone: TestBed.inject(NgZone),
      schedulers: { outsideAngular: queueScheduler },
    });
    base = TestBed.inject(BaseService);
    firestore = TestBed.inject(FirestoreService);
  });

  it('creates friend and message streams from a component callback', () => {
    expect(isObservable(base.getFriends('user'))).toBeTrue();
    expect(isObservable(base.getNewMessages('user', 'friend'))).toBeTrue();
    expect(isObservable(base.getUpdatedMessages('user', 'friend'))).toBeTrue();
    expect(isObservable(base.getScrolledMessages('user', 'friend'))).toBeTrue();
    expect(
      isObservable(base.getAllMessagesFromFriend('friend', 'user', 'f', 'u')),
    ).toBeTrue();
  });

  it('creates database object references after an async boundary', async () => {
    await Promise.resolve();
    await base.addFriends({ confirmed: true }, 'friend', 'user');

    expect(update).toHaveBeenCalledWith({ confirmed: true });
  });

  it('creates Firestore streams from a component callback', () => {
    expect(isObservable(firestore.refreshSharedWithMePosts())).toBeTrue();
    expect(isObservable(firestore.refreshMyPosts('user'))).toBeTrue();
    expect(isObservable(firestore.getFilesFromChat('user'))).toBeTrue();
    expect(isObservable(firestore.getUserNotiSubscription('user'))).toBeTrue();
    expect(isObservable(firestore.getAILimit())).toBeTrue();
  });

  it('creates Firestore document references when updating a post', async () => {
    await firestore.updatePost('post', { message: 'Updated post' });

    expect(document).toHaveBeenCalledWith('post');
    expect(update).toHaveBeenCalledWith({ message: 'Updated post' });
  });

  it('creates private post references after awaiting the shared post deletion', async () => {
    await firestore.deletePost('shared-post', 'user', 'private-post');

    expect(collection).toHaveBeenCalledWith(
      'users/posts/my-posts/user/my-posts',
    );
    expect(document).toHaveBeenCalledWith('shared-post');
    expect(document).toHaveBeenCalledWith('private-post');
    expect(deleteDocument).toHaveBeenCalledTimes(2);
  });

  it('creates the AI usage document after awaiting its query', async () => {
    await firestore.updateAiUsage({ count: 1 });

    expect(document).toHaveBeenCalledWith('usage-id');
    expect(update).toHaveBeenCalledWith({ count: 1 });
  });
});
