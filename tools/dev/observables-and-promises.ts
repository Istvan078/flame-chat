// OBSERVABLES //
//   customInterval$ = new Observable(subscriber => {
//     let timesExecuted = 0;
//     const interval = setInterval(() => {
//       // subscriber.error();
//       if (timesExecuted > 5) {
//         clearInterval(interval);
//         subscriber.complete(); // megtisztítja a subscription-t, nem lesz további érték azt is mondom vele
//         return;
//       }
//       subscriber.next({ message: 'új érték' }); // itt azt állítjuk be MIKOR történjen meg a next esemény!!!
//     }, 2000);
//   });
