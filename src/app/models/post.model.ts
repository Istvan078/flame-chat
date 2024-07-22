interface Comment {
  uid: '';
  text: '';
}
export interface SharedWithMe {
  byWhoKey: string;
  friendUid: string;
  myKey: string;
  timeStamp: number;
}

export class MyPost {
  id?: string;
  liked?: string[];
  comments?: Comment[];
  constructor(public fromPostId?: string, public seen?: boolean) {}
}

export class Post {
  id: string;
  userKey: string;
  pictures?: {
    url: string;
    name: string;
  }[];
  message?: string;
  timeStamp: number;
  newestTimeStamp?: number;
  isShared: string;
  private: {
    isPrivate: boolean;
    sharedByKey?: string;
  };
  displayName: string;
  notSeen?: string[];
  liked?: string[];
  comments?: Comment[];
  iFrame?: string;
  sharedWithMe?: SharedWithMe[];
  userKeys?: string[];
  isSharedWithMe?: boolean;
  constructor() {
    this.id = '';
    this.userKey = '';
    this.timeStamp = 0;
    this.isShared = '';
    this.private = {
      isPrivate: false,
    };
    this.displayName = '';
  }
}
