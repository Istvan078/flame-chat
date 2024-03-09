//  import { initializeApp } from "firebase/app";
//   import { getMessaging } from "firebase/messaging/sw";

importScripts("https://www.gstatic.com/firebasejs/8.1.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.1.1/firebase-messaging.js");

const firebaseConfig = {
  apiKey: "AIzaSyAqSzVgcm58_Y7k3PvuvQ5L-qW8vJrrq30",
  authDomain: "project0781.firebaseapp.com",
  databaseURL:
    "https://project0781-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "project0781",
  storageBucket: "project0781.appspot.com",
  messagingSenderId: "254100950894",
  appId: "1:254100950894:web:74273920b751120e19fb7f",
  measurementId: "G-4JXLN15RYP",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
const messaging = firebase.messaging();

// (function requestPermission() {
//   console.log("Requesting permission...");
//   Notification.requestPermission().then((permission) => {
//     if (permission === "granted") {
//       console.log("Notification permission granted.");
//     }
//   });
// })()

(function requestPermission() {
    messaging.onBackgroundMessage((payload) => {
        console.log(
          "[firebase-messaging-sw.js] Received background message ",
          payload
        );
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
          body: payload.notification.body,
        };
        return self.registration.showNotification(
          notificationTitle,
          notificationOptions
        );
      });
      self.addEventListener("notificationclick", (event) => {
        console.log(event);
      });
})();

// const messaging = firebase.messaging();
// messaging.onBackgroundMessage((payload) => {
//   console.log(
//     "[firebase-messaging-sw.js] Received background message ",
//     payload
//   );
//   const notificationTitle = payload.notification.title;
//   const notificationOptions = {
//     body: payload.notification.body,
//   };
//   return self.registration.showNotification(
//     notificationTitle,
//     notificationOptions
//   );
// });
// self.addEventListener("notificationclick", (event) => {
//   console.log(event);
// });
