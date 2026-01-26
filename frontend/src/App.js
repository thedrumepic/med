import { useEffect, useState, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import HomePage from "@/pages/HomePage";
import AdminPage from "@/pages/AdminPage";
import PrivacyPage from "@/pages/PrivacyPage";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Cart Context
export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

function App() {
  const [cart, setCart] = useState(() => {
    // Load cart from localStorage on init
    const savedCart = localStorage.getItem("medovik_cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("medovik_cart", JSON.stringify(cart));
  }, [cart]);

  const fetchData = async () => {
    try {
      // Seed data first
      await axios.post(`${API}/seed`);
      
      const [catRes, prodRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/products`)
      ]);
      setCategories(catRes.data);
      setProducts(prodRes.data);
    } catch (e) {
      console.error("Error fetching data:", e);
      toast.error("Ошибка загрузки данных");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (product, selectedWeight = null) => {
    const cartItem = {
      id: `${product.id}-${selectedWeight?.weight || 'default'}`,
      productId: product.id,
      name: product.name,
      image: product.image,
      weight: selectedWeight?.weight || null,
      price: selectedWeight?.price || product.base_price,
      quantity: 1
    };

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === cartItem.id);
      if (existingIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        return newCart;
      }
      return [...prevCart, cartItem];
    });
    
    toast.success("Товар добавлен в корзину");
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      cartTotal,
      categories,
      products,
      loading,
      fetchData
    }}>
      <div className="App min-h-screen bg-background">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster 
          position="top-center" 
          duration={1500}
          toastOptions={{
            style: {
              background: '#FFFBEB',
              border: '1px solid #F59E0B',
              color: '#92400E',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '12px',
            },
            className: 'shadow-lg',
          }}
        />
      </div>
    </CartContext.Provider>
  );
}

export default App;
