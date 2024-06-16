export interface Post {
  pictures: {
    url: string;
    name: string;
  }[];
  message: string;
  timeStamp: string;
  shared: boolean;
  displayName: string;
  notSeen: string[];
}
