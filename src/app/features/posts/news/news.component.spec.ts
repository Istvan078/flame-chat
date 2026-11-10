import { provideHttpClient } from '@angular/common/http';
import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { UserClass } from 'src/app/features/people/user.model';
import { MessagesService } from 'src/app/features/messaging/messages.service';
import { PostsService } from 'src/app/features/posts/posts.service';
import { UtilityService } from 'src/app/services/utility.service';
import { NewsComponent } from './news.component';
import { PushNotificationsService } from 'src/app/features/notifications/push-notifications.service';

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;
  let utilityService: jasmine.SpyObj<UtilityService>;
  let userDetails: Subject<{
    userProfiles: UserClass[];
    userProfile: UserClass;
    userProfilesUidsArr: string[];
  }>;

  beforeEach(async () => {
    userDetails = new Subject();
    utilityService = jasmine.createSpyObj('UtilityService', [
      'getUserProfiles',
    ]);
    utilityService.getUserProfiles.and.resolveTo(userDetails.asObservable());

    await TestBed.configureTestingModule({
      imports: [NewsComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: UtilityService, useValue: utilityService },
        { provide: PushNotificationsService, useValue: {} },
        {
          provide: MessagesService,
          useValue: { selectedFriendSubject: new BehaviorSubject({}) },
        },
        {
          provide: PostsService,
          useValue: {
            picturesSubject: new Subject(),
            getMyPostsSub: () => new Subject(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    spyOn(component, 'init').and.resolveTo();
  });

  it('should create without connecting to Firebase', () => {
    expect(component).toBeTruthy();
  });

  it('accepts synchronous cached profiles without unsubscribing before assignment', fakeAsync(() => {
    const user = Object.assign(new UserClass(), { uid: 'cached-user' });
    utilityService.getUserProfiles.and.resolveTo(
      of({
        userProfile: user,
        userProfiles: [user],
        userProfilesUidsArr: [user.uid],
      })
    );
    fixture.detectChanges();
    flushMicrotasks();
    tick(1000);
    expect(component.userProfile).toBe(user);
    expect(component.userProfilesSub.closed).toBeTrue();
  }));

  it('updates profiles after the asynchronous user data arrives', fakeAsync(() => {
    const user = Object.assign(new UserClass(), { uid: 'test-user' });
    fixture.detectChanges();
    expect(utilityService.getUserProfiles).toHaveBeenCalled();
    expect(component.userProfiles).toEqual([]);

    flushMicrotasks();
    userDetails.next({
      userProfiles: [user],
      userProfile: user,
      userProfilesUidsArr: [user.uid],
    });
    fixture.detectChanges();

    expect(component.userProfiles).toEqual([user]);
    expect(component.userProfile).toBe(user);
    expect(component.userProfilesUidsArr).toEqual([user.uid]);
    tick(1000);
    expect(component.init).toHaveBeenCalled();
  }));
});
