export interface Post {
  id: string;
  pictures: {
    url: string;
    name: string;
  }[];
  message: string;
  timeStamp: string;
  shared: boolean;
  displayName: string;
  notSeen: string[];
  liked: string[];
  comments: {}[];
  iFrame: string;
}
