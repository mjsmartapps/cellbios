// Firebase Configuration provided by user requirement
const firebaseConfig = {
    apiKey: "AIzaSyCOfYScRtu_r2p1MlDVGT_BSnR4VWe1kIU",
    authDomain: "villagefood-19f8a.firebaseapp.com",
    databaseURL: "https://villagefood-19f8a-default-rtdb.firebaseio.com",
    projectId: "villagefood-19f8a",
    storageBucket: "villagefood-19f8a.firebasestorage.app",
    messagingSenderId: "241737075683",
    appId: "1:241737075683:web:e3a7351cdbdbf77116aed6",
    measurementId: "G-1HH6F13ECS"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized
}

// Global service variables
const db = firebase.firestore();