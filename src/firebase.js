import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBmkMG2dbLBtJTsfKnYvK7BuuUG-1UtXAI",
  authDomain: "dayton1-salsa.firebaseapp.com",
  projectId: "dayton1-salsa",
  storageBucket: "dayton1-salsa.firebasestorage.app",
  messagingSenderId: "831997134474",
  appId: "1:831997134474:web:81d92373866d237a604f73"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)