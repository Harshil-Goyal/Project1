import admin from "firebase-admin";

// We only need the projectId to verify ID tokens, no service account needed!
admin.initializeApp({
  projectId: "gupshup-4f071",
});

export const verifyIdToken = async (idToken) => {
  return admin.auth().verifyIdToken(idToken);
};
