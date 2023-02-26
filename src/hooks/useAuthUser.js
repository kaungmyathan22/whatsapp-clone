import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import db, { auth, serverTimestamp } from '../firebase';

export default function useAuthUser () {
    const [user] = useAuthState(auth);

    useEffect(() => {
        if (user) {
            const ref = db.collection("users").doc(user.uid);
            ref.get().then(doc => {
                if (!doc.exists) {
                    ref.set({
                        name: user.displayName,
                        photoURL: user.photoURL,
                        timestamp: serverTimestamp()
                    })
                }
            })
        }
    }, [user]);
    return user;
}
