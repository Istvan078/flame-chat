import { EnvironmentInjector, inject, Injectable, runInInjectionContext } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, DocumentData, QueryFn } from '@angular/fire/compat/firestore';
import { SwPush } from '@angular/service-worker';
import { Environments } from 'src/app/environments';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationsService {
  private readonly injector = inject(EnvironmentInjector);

  notiSub: any;

  readonly VAPID_PUBLIC_KEY = Environments.VAPID_PUBLIC_KEY;

  constructor(
    private fireStore: AngularFirestore,
    public swPush: SwPush,
  ) {}

  // Re-enter DI for every new reference, including calls made after await.
  private collection<T = DocumentData>(
    path: string,
    queryFn?: QueryFn,
  ): AngularFirestoreCollection<T> {
    return runInInjectionContext(this.injector, () =>
      this.fireStore.collection<T>(path, queryFn),
    );
  }

  private document<T>(
    collection: AngularFirestoreCollection<T>,
    docId: string,
  ) {
    return runInInjectionContext(this.injector, () => collection.doc(docId));
  }

  saveUserNotiSubscription(userKey: string, sub: any) {
    const notiSubPath = this.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`,
    );
    return notiSubPath.add(sub);
  }

  getUserNotiSubscription(userKey: string) {
    const notiSubPath = this.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`,
    );
    return notiSubPath.valueChanges();
  }

  getUserNotiSubscriptionReformed(userKey: string, endpoint: string) {
    const notiSubPath = this.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`,
    );
    return notiSubPath.ref.where('endpoint', '==', endpoint).get();
  }

  deleteUserNotificationSub(userKey: string, id: string) {
    const notiSubPath = this.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`,
    );
    return this.document(notiSubPath, id).delete();
  }

  deleteUserNotiSubscription(userKey: string, endpoint: string) {
    const notiSubPath = this.collection(
      `users/profiles/pushSubscription/${userKey}/subscription`,
    );
    return new Promise((res, rej) => {
      notiSubPath.ref
        .where('endpoint', '==', endpoint)
        .get()
        .then((docs: any) => {
          if (docs.empty) {
            rej('Nincs feliratkozás');
          } else {
            docs.forEach((doc: any) => {
              console.log(doc.id, doc.data());
              const deletedDoc = this.document(notiSubPath, doc.id)
                .delete()
                .then(() => {
                  console.log('törlés');
                  res('');
                });
            });
          }
        });
    });
  }

  swPushh() {
    return this.notiSub;
  }

  async subscribeToNotifications() {
    if (this.swPush.isEnabled) {
      try {
        const myPushSub = await this.swPush.requestSubscription({
          serverPublicKey: this.VAPID_PUBLIC_KEY,
        });
        this.notiSub = myPushSub;
        // console.log('SIKERES FELIRATKOZÁS AZ ÉRTESÍTÉSEKRE');
      } catch (err) {
        // console.error('NEM TUDTAM FELIRATKOZNI AZ ÉRTESÍTÉSEKRE', err);
      }
    }
  }
}
