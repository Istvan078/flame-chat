import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, provideRouter, UrlSegment } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject } from 'rxjs';
import { UserClass } from 'src/app/features/people/user.model';
import { PeopleService } from 'src/app/features/people/people.service';
import { PostsService } from 'src/app/features/posts/posts.service';
import { UtilityService } from 'src/app/services/utility.service';
import { MyPostsComponent } from './my-posts.component';

describe('MyPostsComponent initialization', () => {
  let component: MyPostsComponent;
  let fixture: ComponentFixture<MyPostsComponent>;
  let utility: jasmine.SpyObj<UtilityService>;
  let routeParams: BehaviorSubject<{}>;
  let postUpdates: Subject<{ isGetMyPosts: boolean }>;
  const user = Object.assign(new UserClass(), {
    uid: 'current-user',
    key: 'current-user-key',
    displayName: 'Test User',
  });
  const userIds = [user.uid, 'friend-a', 'friend-b'];
  const details = {
    userProfile: user,
    userProfiles: [user],
    userProfilesUidsArr: userIds,
    userFriends: [],
  };

  beforeEach(async () => {
    utility = jasmine.createSpyObj('UtilityService', ['getUserProfiles']);
    utility.getUserProfiles.and.resolveTo(of(details));
    routeParams = new BehaviorSubject({});
    postUpdates = new Subject();

    await TestBed.configureTestingModule({
      imports: [MyPostsComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: UtilityService, useValue: utility },
        { provide: PeopleService, useValue: {} },
        {
          provide: PostsService,
          useValue: {
            picturesSubject: new Subject(),
            getMyPostsSub: () => postUpdates,
          },
        },
      ],
    }).compileComponents();

    const route = TestBed.inject(ActivatedRoute);
    route.url = of([new UrlSegment('my-posts', {})]);
    route.params = routeParams.asObservable();
    fixture = TestBed.createComponent(MyPostsComponent);
    component = fixture.componentInstance;
    spyOn(component, 'init').and.resolveTo();
  });

  it('accepts cached synchronous profiles with multiple notification recipients', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    tick(1000);
    component.isNewPost = true;
    fixture.detectChanges();

    expect(component.publishForm.get('notSeen')?.value).toEqual(userIds);
    expect(component.publishForm.get('notSeen')?.validator).toBeNull();
    expect(component.publishForm.get('name')?.value).toBe(user.displayName);
    expect(component.publishForm.get('name')?.disabled).toBeTrue();
    expect(component.userProfilesSub.closed).toBeTrue();
    expect(component.init).toHaveBeenCalledTimes(1);
  }));

  it('keeps the form usable when the profile request takes more than a second', fakeAsync(() => {
    let resolveProfiles!: (value: Observable<typeof details>) => void;
    utility.getUserProfiles.and.returnValue(
      new Promise(resolve => {
        resolveProfiles = resolve;
      })
    );

    fixture.detectChanges();
    tick(1500);
    expect(component.publishForm).toBeDefined();
    expect(component.init).not.toHaveBeenCalled();

    resolveProfiles(of(details));
    flushMicrotasks();
    fixture.detectChanges();
    expect(component.publishForm.get('displayName')?.value).toBe(
      user.displayName
    );
    expect(component.init).toHaveBeenCalledTimes(1);
  }));

  it('loads posts only after the profile stream emits and takes its first value', fakeAsync(() => {
    const profiles = new Subject<typeof details>();
    utility.getUserProfiles.and.resolveTo(profiles.asObservable());
    fixture.detectChanges();
    flushMicrotasks();
    tick(1500);
    expect(component.init).not.toHaveBeenCalled();

    profiles.next(details);
    flushMicrotasks();
    expect(component.userProfile.key).toBe(user.key);
    expect(component.publishForm.get('notSeen')?.value).toEqual(userIds);
    expect(component.init).toHaveBeenCalledTimes(1);
    profiles.next(details);
    expect(component.init).toHaveBeenCalledTimes(1);
  }));

  it('stops listening for route changes and post updates on destruction', fakeAsync(() => {
    fixture.detectChanges();
    flushMicrotasks();
    tick(1000);
    expect(component.init).toHaveBeenCalledTimes(1);
    fixture.destroy();

    routeParams.next({});
    postUpdates.next({ isGetMyPosts: true });
    flushMicrotasks();
    expect(component.init).toHaveBeenCalledTimes(1);
  }));

  it('ignores profile requests completed after navigation away', fakeAsync(() => {
    let resolveProfiles!: (value: Observable<typeof details>) => void;
    utility.getUserProfiles.and.returnValue(
      new Promise(resolve => {
        resolveProfiles = resolve;
      })
    );
    fixture.detectChanges();
    fixture.destroy();

    resolveProfiles(of(details));
    flushMicrotasks();
    tick(1500);
    expect(component.init).not.toHaveBeenCalled();
  }));
});
