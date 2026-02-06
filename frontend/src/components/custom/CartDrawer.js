import { useState, useEffect, useCallback } from "react";
import { useCart } from "@/App";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FaShoppingCart, FaTimes, FaPlus, FaMinus, FaWhatsapp, FaTelegramPlane, FaTag, FaCheck } from "react-icons/fa";
import { GiHoneycomb } from "react-icons/gi";
import { toast } from "sonner";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Компонент промежуточного уведомления
const RedirectNotification = ({ isOpen, onClose, messenger, countdown, url }) => {
  const isWhatsApp = messenger === 'whatsapp';
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 rounded-2xl">
        {/* Header */}
        <div className={`p-6 text-center ${isWhatsApp ? 'bg-green-500' : 'bg-blue-500'}`}>
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            {isWhatsApp ? (
              <FaWhatsapp className="w-8 h-8 text-white" />
            ) : (
              <FaTelegramPlane className="w-8 h-8 text-white" />
            )}
          </div>
          <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Заказ сформирован!
          </h3>
        </div>
        
        {/* Content */}
        <div className="p-6 text-center bg-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GiHoneycomb className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-muted-foreground">Ферма Медовик</span>
          </div>
          
          <p className="text-foreground font-bold mb-4">
            Сейчас вы будете перенаправлены в {isWhatsApp ? 'WhatsApp' : 'Telegram'}
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-black text-amber-800">
              ⚠️ ВАЖНО
            </p>
            <p className="text-sm text-amber-700 mt-1 font-bold">
              После перехода нажмите кнопку «Отправить» в самом чате, чтобы мы получили ваш заказ
            </p>
          </div>
          
          {/* Countdown */}
          <div className="flex items-center justify-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-xl ${isWhatsApp ? 'bg-green-500' : 'bg-blue-500'}`}>
              {countdown}
            </div>
            <span className="text-muted-foreground font-bold text-sm">
              Переход через {countdown} сек...
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("+7 ");
  const [promocode, setPromocode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  
  // State for redirect notification
  const [showRedirectNotification, setShowRedirectNotification] = useState(false);
  const [redirectMessenger, setRedirectMessenger] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(4);
  const [redirectUrl, setRedirectUrl] = useState("");

  const discount = appliedPromo?.discount || 0;
  const finalTotal = Math.max(0, cartTotal - discount);

  const formatPhoneNumber = (value) => {
    // Remove all non-digits except the leading +
    let digits = value.replace(/[^\d]/g, '');
    
    // Ensure it starts with 7 for Kazakhstan
    if (digits.length === 0) {
      return '+7 ';
    }
    if (digits[0] !== '7') {
      digits = '7' + digits;
    }
    
    // Limit to 11 digits (7 + 10 digits)
    digits = digits.slice(0, 11);
    
    // Format: +7 (XXX) XXX XX XX
    let formatted = '+7';
    if (digits.length > 1) {
      formatted += ' (' + digits.slice(1, 4);
    }
    if (digits.length >= 4) {
      formatted += ') ' + digits.slice(4, 7);
    }
    if (digits.length >= 7) {
      formatted += ' ' + digits.slice(7, 9);
    }
    if (digits.length >= 9) {
      formatted += ' ' + digits.slice(9, 11);
    }
    
    return formatted;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setCustomerPhone(formatted);
  };

  const applyPromocode = async () => {
    if (!promocode.trim()) return;
    
    setPromoLoading(true);
    try {
      const response = await axios.post(`${API}/promocodes/validate`, {
        code: promocode.trim(),
        subtotal: cartTotal
      });
      setAppliedPromo(response.data);
      toast.success(`Промокод применён! Скидка: ${response.data.discount} ₸`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Промокод не найден");
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  };

  const removePromocode = () => {
    setAppliedPromo(null);
    setPromocode("");
  };

  const formatOrderMessage = () => {
    let message = `Новый заказ от Ферма Медовик!\n\n`;
    message += `Имя: ${customerName}\n`;
    message += `Телефон: ${customerPhone}\n\n`;
    message += `Заказ:\n`;
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name}`;
      if (item.weight) message += ` (${item.weight})`;
      message += ` - ${item.quantity} шт. x ${item.price} ₸ = ${item.quantity * item.price} ₸\n`;
    });
    
    message += `\nСумма: ${cartTotal} ₸`;
    if (appliedPromo) {
      message += `\nПромокод: ${appliedPromo.code} (-${discount} ₸)`;
    }
    message += `\nИтого: ${finalTotal} ₸`;
    return message;
  };

  const validateOrder = () => {
    if (!customerName.trim()) {
      toast.error("Введите ваше имя");
      return false;
    }
    // Check if phone has at least 11 digits (full Kazakhstan number)
    const phoneDigits = customerPhone.replace(/[^\d]/g, '');
    if (phoneDigits.length < 11) {
      toast.error("Введите полный номер телефона");
      return false;
    }
    if (cart.length === 0) {
      toast.error("Корзина пуста");
      return false;
    }
    return true;
  };

  const saveOrder = async () => {
    try {
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        items: cart.map(item => ({
          name: item.name,
          weight: item.weight || null,
          price: item.price,
          quantity: item.quantity
        })),
        subtotal: cartTotal,
        discount: discount,
        total: finalTotal,
        promocode: appliedPromo?.code || null
      };
      
      await axios.post(`${API}/orders`, orderData);
      console.log("Order saved successfully");
      return true;
    } catch (error) {
      console.error("Error saving order:", error);
      return false;
    }
  };

  // Проверка запуска внутри Telegram WebApp
  const isTelegramWebApp = () => {
    return typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp;
  };

  // Функция открытия внешней ссылки с учётом окружения
  const openExternalLink = useCallback((url, isTelegramLink = false) => {
    if (isTelegramWebApp()) {
      const tg = window.Telegram.WebApp;
      if (isTelegramLink && tg.openTelegramLink) {
        // Для ссылок на Telegram используем openTelegramLink
        tg.openTelegramLink(url);
      } else if (tg.openLink) {
        // Для внешних ссылок (WhatsApp) используем openLink
        tg.openLink(url);
      } else {
        // Fallback
        window.location.href = url;
      }
    } else {
      // Для Safari и других браузеров - прямой переход
      window.location.href = url;
    }
  }, []);

  // Эффект для обратного отсчёта и перехода
  useEffect(() => {
    let timer;
    if (showRedirectNotification && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
    } else if (showRedirectNotification && redirectCountdown === 0) {
      // Выполняем переход
      const isTelegramLink = redirectMessenger === 'telegram';
      openExternalLink(redirectUrl, isTelegramLink);
      
      // Сбрасываем состояние
      setShowRedirectNotification(false);
      setRedirectCountdown(4);
    }
    return () => clearTimeout(timer);
  }, [showRedirectNotification, redirectCountdown, redirectUrl, redirectMessenger, openExternalLink]);

  const orderViaWhatsApp = () => {
    if (!validateOrder()) return;
    
    const message = encodeURIComponent(formatOrderMessage());
    const whatsappUrl = `https://wa.me/77083214571?text=${message}`;
    
    // Сохраняем заказ в фоновом режиме
    saveOrder().then(saved => {
      if (saved) {
        console.log("Order saved in background");
      }
    });
    
    // Показываем уведомление с обратным отсчётом
    setRedirectUrl(whatsappUrl);
    setRedirectMessenger('whatsapp');
    setRedirectCountdown(4);
    setShowRedirectNotification(true);
  };

  const orderViaTelegram = () => {
    if (!validateOrder()) return;
    
    const message = encodeURIComponent(formatOrderMessage());
    const telegramUrl = `https://t.me/fermamedovik?text=${message}`;
    
    // Сохраняем заказ в фоновом режиме
    saveOrder().then(saved => {
      if (saved) {
        console.log("Order saved in background");
      }
    });
    
    // Показываем уведомление с обратным отсчётом
    setRedirectUrl(telegramUrl);
    setRedirectMessenger('telegram');
    setRedirectCountdown(4);
    setShowRedirectNotification(true);
  };

  return (
<Sheet open={isOpen} onOpenChange={onClose}>
  {/* Класс [&>button]:hidden удаляет стандартный крестик */}
  <SheetContent className="w-full sm:max-w-md p-0 flex flex-col bg-white max-h-screen [&>button]:hidden">
    
    <SheetHeader className="p-4 border-b border-border/50 flex-shrink-0 flex-row items-center justify-between space-y-0">
      <SheetTitle className="flex items-center gap-2 text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <FaShoppingCart className="w-5 h-5 text-primary" />
        Корзина
      </SheetTitle>
      
      {/* Обычная кнопка, которая вызывает функцию закрытия */}
      <button 
        onClick={onClose}
        className="text-[10px] font-bold text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors outline-none"
      >
        Добавить товары
      </button>
    </SheetHeader>

        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto cart-scroll overscroll-contain min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center min-h-[200px]">
              <FaShoppingCart className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Ваши товары тут</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Добавьте товары в корзину</p>
            </div>
          ) : (
            <div className="p-3 md:p-4 space-y-2 md:space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="cart-item flex gap-2 md:gap-3 p-2 md:p-3 bg-secondary/30 rounded-lg"
                  data-testid={`cart-item-${item.id}`}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs md:text-sm text-foreground line-clamp-1">
                      {item.name}
                      {item.weight && <span className="text-primary ml-1">({item.weight})</span>}
                    </h4>
                    <p className="text-primary font-black text-xs md:text-sm mt-0.5 md:mt-1">
                      {item.price} ₸
                    </p>
                    <div className="flex items-center gap-1 md:gap-2 mt-1 md:mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                        data-testid={`decrease-qty-${item.id}`}
                      >
                        <FaMinus className="w-3 h-3" />
                      </button>
                      <span className="font-black text-xs md:text-sm w-5 md:w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-white border border-border flex items-center justify-center hover:bg-secondary transition-colors"
                        data-testid={`increase-qty-${item.id}`}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    data-testid={`remove-item-${item.id}`}
                  >
                    <FaTimes className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        {cart.length > 0 && (
          <div className="border-t border-border/50 p-3 md:p-4 space-y-3 md:space-y-4 bg-white flex-shrink-0">
            {/* Subtotal & Discount */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-bold">Сумма:</span>
                <span className="text-foreground font-bold">{cartTotal} ₸</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-600 flex items-center gap-1 font-bold">
                    <FaTag className="w-3 h-3" />
                    Скидка ({appliedPromo.code}):
                  </span>
                  <span className="text-green-600 font-bold">-{discount} ₸</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t border-border/30">
                <span className="font-black text-foreground text-sm md:text-base">Итого:</span>
                <span className="text-lg md:text-xl font-black text-foreground" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {finalTotal} ₸
                </span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-2 md:space-y-3">
              <Input
                placeholder="Ваше имя"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-secondary/50 border-border/50 text-sm md:text-base h-10 md:h-11"
                data-testid="customer-name-input"
              />
              <Input
                placeholder="Телефон"
                value={customerPhone}
                onChange={handlePhoneChange}
                className="bg-secondary/50 border-border/50 text-sm md:text-base h-10 md:h-11"
                data-testid="customer-phone-input"
              />
              
              {/* Promocode */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Введите промокод"
                    value={promocode}
                    onChange={(e) => {
                      setPromocode(e.target.value);
                      if (appliedPromo) setAppliedPromo(null);
                    }}
                    disabled={!!appliedPromo}
                    className="bg-secondary/50 border-border/50 text-sm md:text-base h-10 md:h-11 pl-8"
                    data-testid="promocode-input"
                  />
                  <FaTag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {appliedPromo ? (
                  <Button
                    variant="outline"
                    onClick={removePromocode}
                    className="h-10 md:h-11 px-3 text-red-500 border-red-200 hover:bg-red-50"
                  >
                    <FaTimes className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={applyPromocode}
                    disabled={promoLoading || !promocode.trim()}
                    className="h-10 md:h-11 px-3"
                  >
                    {promoLoading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaCheck className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Order Buttons */}
            <div className="space-y-2">
              <Button
                onClick={orderViaWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 md:py-5 text-sm md:text-base"
                data-testid="order-whatsapp-btn"
              >
                <FaWhatsapp className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Заказать через WhatsApp
              </Button>
              <Button
                onClick={orderViaTelegram}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 md:py-5 text-sm md:text-base"
                data-testid="order-telegram-btn"
              >
                <FaTelegramPlane className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Заказать через Telegram
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
      
      {/* Redirect Notification */}
      <RedirectNotification 
        isOpen={showRedirectNotification}
        onClose={() => setShowRedirectNotification(false)}
        messenger={redirectMessenger}
        countdown={redirectCountdown}
        url={redirectUrl}
      />
    </Sheet>
  );
};

export default CartDrawer;
