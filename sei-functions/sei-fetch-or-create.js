const functions = require('@google-cloud/functions-framework');
const Firestore = require("@google-cloud/firestore");
const { Wallet } = require("ethers");

const db = new Firestore({
    projectId: "effisend",
    keyFilename: "credential.json",
});

const Accounts = db.collection("AccountsSei");

functions.http('helloHttp', async (req, res) => {
    try {
        const user = req.body.user
        let query = await Accounts.where("user", "==", user).get();
        if (query.empty) {
            const wallet = Wallet.createRandom();
            let dataframe = {
                privateKey: wallet.privateKey,
                address : wallet.address,
                user,
                rewards:"0.01"
            }
            await Accounts.doc(user).set(dataframe);
            res.send({
                error: null,
                result: {
                    address: wallet.address,
                    user,
                }
            });
        } else {
            const { user, address } = query.docs[0].data();
            res.send({
                error: null,
                result: {
                    address,
                    user,
                }
            });
        }
    }
    catch (e) {
        console.log(e)
        res.send({
            error: "BAD REQUEST",
            result: null
        });
    }
});