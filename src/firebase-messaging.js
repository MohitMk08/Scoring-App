import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase"; // make sure you export app from firebase.js

const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
    try {
        const permission = await Notification.requestPermission();

        if (permission === "granted") {
            console.log("Notification permission granted.");

            const token = await getToken(messaging, {
                vapidKey: "BKm2GN0eWmUE7zAf125yTrU_nL27EkaZ-Mvt4W459pMeGhxnp1R47ebdyzl-_F9zFyYjn_YQR4v2Rjof-v6cYtU",
            });

            if (token) {
                console.log("FCM Token:", token);
                return token;
            } else {
                console.log("No registration token available.");
            }
        } else {
            console.log("Permission denied.");
        }
    } catch (error) {
        console.error("Error getting token:", error);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
