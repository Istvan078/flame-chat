import { AfterContentInit, AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Observer, Subscription } from 'rxjs';
import { Chat } from 'src/app/models/chat.model';
import { UserClass, UserInterface } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { BaseService } from 'src/app/services/base.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy{
  users: Chat[] = []
  isSAdmin: boolean = false
  message: Chat = new Chat();
  messages: Chat[] = []
  userProfiles: UserClass[] = []
  user: {
    messageId: string,
    userId: string,
    displayName: string,
    email: string
  } = {
      messageId: "",
      userId: "",
      displayName: "",
      email: ""
    }

  userLoggedInSubscription!: Subscription;
  isSuperAdminSubscription!: Subscription;
  usersSubscription!: Subscription;

  constructor(
    private auth: AuthService,
    private base: BaseService
  ) {
    this.base.getUserProfiles().subscribe(
      (userProfiles: any[]) => {
        this.userProfiles = userProfiles
      }
    )
  }

  ngOnInit() {

    
   setTimeout(() =>  {
    
     this.base.getMessages().subscribe(
       (messages: any[]) => {
        if(this.messages.length === 0){
           for(let message of messages){
            if (message.uid === this.user.userId) {
              this.user.messageId = message.uid
              
            }
            message.id = message['key']
            message.id = message.uid

             this.messages = messages
            console.log(this.messages)
             this.base.updateMessage(message['key'], message)  
           }
        // messages.forEach(
        //      (message: Chat) => {
   
  
        //      }
        //    )
          }
         }
        
       )

   this.userLoggedInSubscription =  this.auth.userLoggedInSubject.subscribe(
        (user: any) => {
          this.user.userId = user.uid;
          this.user.displayName = user.displayName;
          this.user.email = user.email;
          if (!user.displayName) {
            this.user.displayName = "Névtelen felhasználó"
          }
          if (!user.email) {
            this.user.email = "Nincs regisztrált e-mail cím"
          }
        }
      )
  this.usersSubscription =  this.auth.getUsersSubject().subscribe(
        (users: any) => {
          this.users = users
          this.users.forEach(
            (user) => {
              if (user.displayName === "") {
                user.displayName = "Névtelen felhasználó"
              } if (user.email === "") {
                user.email = "Nincs regisztrált e-mail cím"
              }
            }
          )

          
        }

      )
    

    }, 2000);
   this.isSuperAdminSubscription = this.auth.isSuperAdmin.subscribe(
      (value) => this.isSAdmin = value
    )
  }



  addMessage() {
    if (!this.message.uid) {
      this.message.uid = this.user.userId
    }
    this.message.date = new Date().toLocaleDateString();
    this.message.displayName = this.user.displayName;
    this.message.email = this.user.email
    
    this.base.addMessage(this.message)
    this.base.getMessages().subscribe(
      (messages: any[]) => this.messages = messages
    )
  }

  deleteMessage(message: Chat) {
    this.base.deleteMessage(message).then(
      (res) =>  this.base.getMessages().subscribe(
        (messages: any[]) => this.messages = messages
      )
    )
  }

  deleteMessages() {
    this.base.deleteMessages()
  }

  ngOnDestroy(): void {
    if(this.userLoggedInSubscription){
    this.userLoggedInSubscription.unsubscribe();
    }
    if(this.isSuperAdminSubscription){
    this.isSuperAdminSubscription.unsubscribe();
    }
    if(this.usersSubscription){
    this.usersSubscription.unsubscribe();
    }
  }

}
