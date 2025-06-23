// models/Product.js
const {
    collection,
    getDocs,
    getDoc,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp
  } = require("firebase/firestore");
  
  const db = require("../database/firebase");
  
  const productsCol = collection(db, "products");
  const categoriesCol = collection(db, "categories");
  
  const Product = {
    async getAll(callback) {
      try {
        const snapshot = await getDocs(productsCol);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(null, data);
      } catch (err) {
        callback(err);
      }
    },
  
    async getById(id, callback) {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          callback(null, { id: snap.id, ...snap.data() });
        } else {
          callback(new Error("Produit non trouvé"));
        }
      } catch (err) {
        callback(err);
      }
    },
  
    async create(product, callback) {
      try {
        const { name, description, price, image, category } = product;
        const docRef = await addDoc(productsCol, {
          name,
          description,
          price: parseFloat(price),
          image,
          category,
          created_at: Timestamp.now()
        });
        callback(null, { id: docRef.id });
      } catch (err) {
        callback(err);
      }
    },
  
    async createWithCategory(productData, callback) {
      try {
        const docRef = await addDoc(productsCol, {
          name: productData.name,
          description: productData.description,
          price: parseFloat(productData.price),
          image: productData.image,
          category: productData.category_id,
          created_at: Timestamp.now()
        });
        callback(null, { id: docRef.id });
      } catch (err) {
        callback(err);
      }
    },
  
    async update(id, product, callback) {
      try {
        const ref = doc(db, "products", id);
        await updateDoc(ref, {
          name: product.name,
          description: product.description,
          price: parseFloat(product.price),
          image: product.image,
          category: product.category
        });
        callback(null);
      } catch (err) {
        callback(err);
      }
    },
  
    async delete(id, callback) {
      try {
        const ref = doc(db, "products", id);
        await deleteDoc(ref);
        callback(null);
      } catch (err) {
        callback(err);
      }
    },
  
    async search(queryStr, callback) {
      try {
        const snapshot = await getDocs(productsCol);
        const data = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p =>
            p.name.toLowerCase().includes(queryStr.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(queryStr.toLowerCase()))
          );
        callback(null, data);
      } catch (err) {
        callback(err);
      }
    },
  
    async getAllWithCategories(callback) {
      try {
        const [productsSnap, categoriesSnap] = await Promise.all([
          getDocs(productsCol),
          getDocs(categoriesCol)
        ]);
  
        const categories = {};
        categoriesSnap.forEach(doc => {
          categories[doc.id] = doc.data().name;
        });
  
        const data = productsSnap.docs.map(doc => {
          const prod = doc.data();
          return {
            id: doc.id,
            ...prod,
            category_name: categories[prod.category] || "Inconnu"
          };
        });
  
        callback(null, data);
      } catch (err) {
        callback(err);
      }
    },
  
    async getByCategory(categoryId, callback) {
      try {
        const q = query(productsCol, where("category", "==", categoryId));
        const snapshot = await getDocs(q);
  
        const categorySnap = await getDoc(doc(db, "categories", categoryId));
        const category_name = categorySnap.exists() ? categorySnap.data().name : "Inconnu";
  
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          category_name
        }));
  
        callback(null, data);
      } catch (err) {
        callback(err);
      }
    }
  };
  
  module.exports = Product;
  