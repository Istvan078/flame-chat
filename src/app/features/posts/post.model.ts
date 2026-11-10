interface Comment {
  uid: '';
  text: '';
}
export interface SharedWith {
  byWhoKey: string;
  friendUid: string;
  myKey: string;
  timeStamp: number;
}

export interface SharedPublicly {
  byWhoKey: string;
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
  sharedPubliclyNewestTimeStamp?: number; // nyilvános újramegosztásokhoz
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
  sharedWith?: SharedWith[];
  sharedPublicly?: SharedPublicly[]; // nyilvános újramegosztásokhoz
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
