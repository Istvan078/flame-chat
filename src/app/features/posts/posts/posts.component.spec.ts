import {
  ComponentFixture,
  fakeAsync,
  flushMicrotasks,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, of } from 'rxjs';
import { UserClass } from 'src/app/features/people/user.model';
import { UtilityService } from 'src/app/services/utility.service';
import { PostFormService } from '../post-form.service';
import { PostsComponent } from './posts.component';

describe('PostsComponent', () => {
  let component: PostsComponent;
  let fixture: ComponentFixture<PostsComponent>;
  let utilityService: jasmine.SpyObj<UtilityService>;
  const user = Object.assign(new UserClass(), {
    uid: 'test-user',
    displayName: 'Test User',
  });
  const userIds = [user.uid, 'friend-a', 'friend-b'];

  beforeEach(async () => {
    utilityService = jasmine.createSpyObj('UtilityService', [
      'getUserProfiles',
    ]);
    utilityService.getUserProfiles.and.resolveTo(
      of({
        userProfiles: [user],
        userProfile: user,
        userProfilesUidsArr: userIds,
      })
    );


    await TestBed.configureTestingModule({
      imports: [PostsComponent],
      providers: [
        provideNoopAnimations(),
        { provide: UtilityService, useValue: utilityService },
        { provide: PostFormService, useValue: { getFormDataForPosts: () => [] } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostsComponent);
    component = fixture.componentInstance;
  });

  function initializeForm() {
    fixture.detectChanges();
    flushMicrotasks();
    tick(1000);
    fixture.detectChanges();
  }

  it('initializes the post form with the current user', fakeAsync(() => {
    initializeForm();

    expect(component).toBeTruthy();
    expect(component.publishForm.get('displayName')?.value).toBe(
      user.displayName
    );
    expect(component.publishForm.get('name')?.disabled).toBeTrue();
    expect(component.publishForm.get('notSeen')?.value).toEqual(userIds);
  }));

  it('has a form before a slow profile request completes', fakeAsync(() => {
    let resolveProfiles!: (
      value: Observable<{
        userProfiles: UserClass[];
        userProfile: UserClass;
        userProfilesUidsArr: string[];
      }>
    ) => void;
    utilityService.getUserProfiles.and.returnValue(
      new Promise(resolve => {
        resolveProfiles = resolve;
      })
    );
    fixture.detectChanges();
    tick(1500);
    expect(component.publishForm).toBeDefined();

    resolveProfiles(
      of({
        userProfiles: [user],
        userProfile: user,
        userProfilesUidsArr: userIds,
      })
    );
    flushMicrotasks();
    fixture.detectChanges();
    expect(component.publishForm.get('name')?.value).toBe(user.displayName);
    expect(component.publishForm.get('notSeen')?.value).toEqual(userIds);
  }));

  it('emits the initialized form when submitting a post', fakeAsync(() => {
    initializeForm();
    const onSubmit = jasmine.createSpy('onSubmit');
    component.onSubmit.subscribe(onSubmit);
    component.publishForm.patchValue({ message: 'A test post' });

    component.onFormSubmit();

    expect(onSubmit).toHaveBeenCalledWith({
      chosenFiles: undefined,
      form: component.publishForm,
    });
    expect(component.publishForm.valid).toBeTrue();
  }));
});
