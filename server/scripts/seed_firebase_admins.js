const admin = require('firebase-admin');

// Initialize (copied from firebaseAdmin.js)
let serviceAccount;
try {
    serviceAccount = require('../serviceAccountKey.json');
    console.log("✅ Found serviceAccountKey.json");
} catch (e) {
    console.error("❌ Service Account Key NOT FOUND. Cannot seed Firebase.");
    process.exit(1);
}

if (serviceAccount) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("✅ Firebase Admin Initialized");
    } catch (e) {
        if (e.code === 'app/already-exists') {
            // ignore
            console.log("✅ Firebase Admin already initialized");
        } else {
            console.error("❌ Initialization Failed:", e);
            process.exit(1);
        }
    }
}

// Admins to Seed
const admins = [
    { email: 'uni@admin.com', password: 'admin123', name: 'Uni Admin', uid: 'admin-uni' },
    { email: 'super@admin.com', password: 'admin123', name: 'Super Admin', uid: 'admin-super' }
];

async function seed() {
    for (const user of admins) {
        try {
            console.log(`Seeding ${user.email}...`);
            await admin.auth().updateUser(user.uid, {
                email: user.email,
                password: user.password,
                displayName: user.name,
                emailVerified: true
            });
            console.log(`✅ Updated ${user.email}`);
        } catch (e) {
            if (e.code === 'auth/user-not-found') {
                try {
                    await admin.auth().createUser({
                        uid: user.uid,
                        email: user.email,
                        password: user.password,
                        displayName: user.name,
                        emailVerified: true
                    });
                    console.log(`✅ Created ${user.email}`);
                } catch (err) {
                    console.error(`❌ Failed to create ${user.email}:`, err.message);
                }
            } else {
                console.error(`❌ Failed to update ${user.email}:`, e.message);
            }
        }
    }
    console.log("Script Finished.");
    process.exit(0);
}

seed();
