// models/Category.js
const { collection, getDocs, addDoc, doc, getDoc } = require("firebase/firestore");
const db = require("../database/firebase");

const Category = {
    defaultCategories: [
        'Soins Visage',
        'Nettoyants',
        'Sérums',
        'Hydratants',
        'Masques',
        'Protection Solaire',
        'Soins Anti-Acné',
        'Éclaircissants',
        'Produits Anti-âge',
        'Parfums',
        'Savons',
        'Laits de toilette',
        'Coffrets & Packs',
        'Autres...'
    ],

    async getAll(callback) {
        try {
            const snapshot = await getDocs(collection(db, "categories"));
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(null, data);
        } catch (err) {
            callback(err);
        }
    },

    async getById(id, callback) {
        try {
            const docRef = doc(db, "categories", id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                callback(null, { id: docSnap.id, ...docSnap.data() });
            } else {
                callback(new Error("Catégorie introuvable"));
            }
        } catch (err) {
            callback(err);
        }
    },

    async create(name, callback) {
        try {
            const newCat = await addDoc(collection(db, "categories"), {
                name,
                created_at: new Date()
            });
            callback(null, newCat);
        } catch (err) {
            callback(err);
        }
    }
};

module.exports = Category;
