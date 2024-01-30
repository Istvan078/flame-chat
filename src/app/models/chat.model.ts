export class Chat {

  public participants: [
    string,
    string
  ]

  public message: {
    senderId: string
    message: string
    timeStamp: string
    displayName: string
    profilePhoto: string
    email: string
    seen: boolean
  }

  [indexS: string | number]: string | number | object
  constructor(
  ) {
    this.participants = [
      "user_id_1", "user_id_2"
    ]

    this.message = {
      senderId: "user_id_1",
      message: "",
      timeStamp: "2024.01.27",
      displayName: "",
      profilePhoto: "",
      email: "",
      seen: false
    }
  }
}
