import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { NewsComponent } from './news.component';
import { SharedModule } from '../../shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { SwPush } from '@angular/service-worker';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';
import { UserClass } from 'src/app/models/user.model';
import { Observable, of } from 'rxjs';

class MockSwPush {}

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewsComponent],
      imports: [SharedModule, HttpClientModule],
      providers: [{ provide: SwPush, useClass: MockSwPush }],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsComponent);
    const app = fixture.debugElement.componentInstance;
    // fixture.detectChanges();
    expect(app).toBeTruthy();
  });

  it('should create', () => {
    // expect(component).toBeTruthy();
    // const app = fixture.debugElement.componentInstance;
    // const userService = fixture.debugElement.injector.get(BaseService);
    // fixture.detectChanges();
    // expect(userService.userKey).toEqual(component.userProfile.key);
  });
  it('shouldnt fetch data successfully if not called asynchronously!', fakeAsync(() => {
    let user = new UserClass();
    let tomb: any[] = [];
    tomb.push(user);
    fixture = TestBed.createComponent(NewsComponent);
    const app = fixture.debugElement.componentInstance;
    const userService = fixture.debugElement.injector.get(BaseService);
    const spy = spyOn(userService, 'getUserProfiles').and.returnValue(of(tomb));
    fixture.detectChanges();
    tick();
    expect(app.userProfiles).toBeTruthy();
    // fixture.whenStable().then(() => {

    // });
    // expect(app.userProfiles).toBe(undefined);
  }));
});
