/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
    apiKey: "AIzaSyB78Ad0TsmsKplLjc7BiUzsKdBU-EhnP7c",
    authDomain: "volleyballscoringapp.firebaseapp.com",
    projectId: "volleyballscoringapp",
    storageBucket: "volleyballscoringapp.firebasestorage.app",
    messagingSenderId: "847656529256",
    appId: "1:847656529256:web:aa4cb45628ac7b1ed2fadd"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log("Received background message ", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: "/pwa-192.png",
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
