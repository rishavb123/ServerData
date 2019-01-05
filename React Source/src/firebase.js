import firebase from 'firebase/app';
import 'firebase/auth'
import 'firebase/database'
import config from './firebaseConfig.json'
firebase.initializeApp(config);
export default firebase