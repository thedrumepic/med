import { useState } from "react";
import { 
  FaCheck, FaCheckCircle, FaStar, FaHeart, FaLeaf, FaTruck, 
  FaShieldAlt, FaCertificate, FaAward, FaMedal, FaGem, 
  FaHandshake, FaUserCheck, FaThumbsUp, FaSmile, FaLightbulb,
  FaBolt, FaFire, FaSun, FaMoon, FaCloud, FaSnowflake,
  FaHome, FaStore, FaWarehouse, FaIndustry, FaHospital,
  FaClock, FaCalendarAlt, FaPhone, FaEnvelope, FaMapMarkerAlt,
  FaDollarSign, FaCreditCard, FaGift, FaPercent, FaChartLine,
  FaBox, FaShoppingCart, FaRecycle
} from "react-icons/fa";

const iconList = [
  { name: "FaCheckCircle", icon: FaCheckCircle, label: "Галочка в круге" },
  { name: "FaCheck", icon: FaCheck, label: "Галочка" },
  { name: "FaStar", icon: FaStar, label: "Звезда" },
  { name: "FaHeart", icon: FaHeart, label: "Сердце" },
  { name: "FaLeaf", icon: FaLeaf, label: "Листок" },
  { name: "FaTruck", icon: FaTruck, label: "Грузовик" },
  { name: "FaShieldAlt", icon: FaShieldAlt, label: "Щит" },
  { name: "FaCertificate", icon: FaCertificate, label: "Сертификат" },
  { name: "FaAward", icon: FaAward, label: "Награда" },
  { name: "FaMedal", icon: FaMedal, label: "Медаль" },
  { name: "FaGem", icon: FaGem, label: "Алмаз" },
  { name: "FaHandshake", icon: FaHandshake, label: "Рукопожатие" },
  { name: "FaUserCheck", icon: FaUserCheck, label: "Пользователь с галочкой" },
  { name: "FaThumbsUp", icon: FaThumbsUp, label: "Большой палец вверх" },
  { name: "FaSmile", icon: FaSmile, label: "Улыбка" },
  { name: "FaLightbulb", icon: FaLightbulb, label: "Лампочка" },
  { name: "FaBolt", icon: FaBolt, label: "Молния" },
  { name: "FaFire", icon: FaFire, label: "Огонь" },
  { name: "FaSun", icon: FaSun, label: "Солнце" },
  { name: "FaMoon", icon: FaMoon, label: "Луна" },
  { name: "FaCloud", icon: FaCloud, label: "Облако" },
  { name: "FaSnowflake", icon: FaSnowflake, label: "Снежинка" },
  { name: "FaHome", icon: FaHome, label: "Дом" },
  { name: "FaStore", icon: FaStore, label: "Магазин" },
  { name: "FaWarehouse", icon: FaWarehouse, label: "Склад" },
  { name: "FaIndustry", icon: FaIndustry, label: "Производство" },
  { name: "FaHospital", icon: FaHospital, label: "Больница" },
  { name: "FaClock", icon: FaClock, label: "Часы" },
  { name: "FaCalendarAlt", icon: FaCalendarAlt, label: "Календарь" },
  { name: "FaPhone", icon: FaPhone, label: "Телефон" },
  { name: "FaEnvelope", icon: FaEnvelope, label: "Конверт" },
  { name: "FaMapMarkerAlt", icon: FaMapMarkerAlt, label: "Метка" },
  { name: "FaDollarSign", icon: FaDollarSign, label: "Доллар" },
  { name: "FaCreditCard", icon: FaCreditCard, label: "Карта" },
  { name: "FaGift", icon: FaGift, label: "Подарок" },
  { name: "FaPercent", icon: FaPercent, label: "Процент" },
  { name: "FaChartLine", icon: FaChartLine, label: "График" },
  { name: "FaBox", icon: FaBox, label: "Коробка" },
  { name: "FaShoppingCart", icon: FaShoppingCart, label: "Корзина" },
  { name: "FaRecycle", icon: FaRecycle, label: "Переработка" },
];

const IconSelector = ({ selectedIcon, onSelectIcon, onClose }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = iconList.filter(icon =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">Выберите иконку</h3>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск иконки..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <div className="overflow-y-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {filteredIcons.map((icon) => {
              const Icon = icon.icon;
              const isSelected = selectedIcon === icon.name;
              return (
                <button
                  key={icon.name}
                  onClick={() => onSelectIcon(icon.name)}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                    }
                  `}
                  title={icon.label}
                >
                  <Icon className={`w-6 h-6 mx-auto ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};

export { IconSelector, iconList };
export default IconSelector;
