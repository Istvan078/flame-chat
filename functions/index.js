const functions = require("firebase-functions");
const admin = require("firebase-admin")
const express = require("express");
const cors = require('cors');
const bodyParser = require("body-parser");

const forecast = require("./utils/forecast");
const geocode = require("./utils/geocode");

const serviceAccount = require("./project0781-firebase-adminsdk-xbbql-1dc8cfc27d.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://project0781-default-rtdb.europe-west1.firebasedatabase.app"
});

const app = express();

app.use(cors({
    origin: '*'
}));

app.use(bodyParser.json());

const verifyToken = (req, res, next) => {
    const idToken = req.headers.authorization;

    admin
        .auth()
        .verifyIdToken(idToken)
        .then((decodedToken) => {
            req.user = decodedToken;
            next();
        })
        .catch((error) => {
            console.error('Hiba történt a token ellenőrzésekor:', error);
            res.sendStatus(401);
        });
};

app.post('/setCustomClaims', verifyToken, (req, res) => {
    const { uid, claims } = req.body;
    admin
        .auth()
        .setCustomUserClaims(uid, claims)
        .then(() => {
            console.log('Felhasználó claimsek sikeresen beállítva.');
            res.json({ message: 'OK' });
        })
        .catch((error) => {
            console.error('Hiba történt a felhasználó claimsek beállításakor:', error);
            res.sendStatus(500);
        });
});

app.get('/users', verifyToken, (req, res) => {
    admin
        .auth()
        .listUsers()
        .then((userRecords) => {
            const users = userRecords.users.map((user) => ({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                claims: user.customClaims,
                profilePicture: user.photoURL
                // Egyéb felhasználói adatok ......
            }));
            res.json(users);
        })
        .catch((error) => {
            console.error('Hiba történt a felhasználók lekérésekor:', error);
            res.sendStatus(500);
        });
});

app.get('/users/:uid/claims', verifyToken, (req, res) => {
    const { uid } = req.params;
    admin
        .auth()
        .getUser(uid)
        .then((userRecord) => {
            res.json(userRecord.customClaims);
        })
        .catch((error) => {
            console.error('Hiba történt a felhasználó lekérdezésekor:', error);
            res.sendStatus(500);
        });
});

app.get("/weather", (req, res) => {
    if(!req.query.address) {
        return res.send({
            error: "Kérem adjon meg egy címet!"
        })
    }

    geocode(req.query.address, (error, { latitude, longitude, location} = {}) => {
        if(error) {
            return res.send({ error })
        }

        forecast(latitude + "," + longitude, (error, forecastData) => {
            if(error) {
                return res.send({ error })
            }

            res.send({
                forecast: forecastData,
                location,
                address: req.query.address
            })
        })
    })
})

exports.api = functions.https.onRequest(app);