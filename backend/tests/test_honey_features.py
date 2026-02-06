"""
Backend tests for Honey Farm e-commerce app - Feature Testing
Tests: Categories reorder, Orders with products display
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH = ("armanuha", "secretboost1")

class TestCategoriesReorder:
    """Test category reorder functionality"""
    
    def test_get_categories_with_order_field(self):
        """Verify categories have order field and are sorted by it"""
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert len(categories) > 0
        
        # Verify each category has order field
        for cat in categories:
            assert "order" in cat, f"Category {cat['name']} missing 'order' field"
            assert "id" in cat
            assert "name" in cat
        
        # Verify categories are sorted by order
        orders = [cat["order"] for cat in categories]
        assert orders == sorted(orders), "Categories not sorted by order field"
        print(f"✓ Found {len(categories)} categories with order field, properly sorted")
    
    def test_reorder_categories_endpoint(self):
        """Test POST /api/categories/reorder endpoint"""
        # Get current categories
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        categories = response.json()
        original_order = [cat["id"] for cat in categories]
        
        # Reverse the order
        new_order = list(reversed(original_order))
        
        # Call reorder endpoint
        response = requests.post(
            f"{BASE_URL}/api/categories/reorder",
            json=new_order,
            auth=AUTH
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify order changed
        response = requests.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        updated_categories = response.json()
        updated_order = [cat["id"] for cat in updated_categories]
        assert updated_order == new_order, "Category order not updated correctly"
        
        # Restore original order
        response = requests.post(
            f"{BASE_URL}/api/categories/reorder",
            json=original_order,
            auth=AUTH
        )
        assert response.status_code == 200
        print("✓ Category reorder endpoint works correctly")
    
    def test_reorder_requires_auth(self):
        """Verify reorder endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/categories/reorder",
            json=["cat-honey", "cat-bee"]
        )
        assert response.status_code == 401, "Reorder should require authentication"
        print("✓ Reorder endpoint properly requires authentication")


class TestOrdersWithProducts:
    """Test orders display with products list"""
    
    def test_create_order_with_items(self):
        """Test creating order with product items"""
        order_data = {
            "customer_name": "TEST_Тест Покупатель",
            "customer_phone": "+7 (700) 111 22 33",
            "items": [
                {"name": "Мёд Разнотравье", "weight": "250гр", "price": 1201, "quantity": 2},
                {"name": "Пыльца цветочная", "weight": "100гр", "price": 1500, "quantity": 1}
            ],
            "subtotal": 3902,
            "discount": 0,
            "total": 3902,
            "promocode": None
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        order = response.json()
        assert order["customer_name"] == "TEST_Тест Покупатель"
        assert order["customer_phone"] == "+7 (700) 111 22 33"
        assert len(order["items"]) == 2
        assert order["total"] == 3902
        
        # Verify items structure
        item1 = order["items"][0]
        assert item1["name"] == "Мёд Разнотравье"
        assert item1["weight"] == "250гр"
        assert item1["price"] == 1201
        assert item1["quantity"] == 2
        
        print(f"✓ Order created with {len(order['items'])} items")
        return order["id"]
    
    def test_create_order_with_promocode(self):
        """Test creating order with promocode"""
        order_data = {
            "customer_name": "TEST_Промо Покупатель",
            "customer_phone": "+7 (700) 222 33 44",
            "items": [
                {"name": "Мёд Гречишный", "weight": "1кг", "price": 3500, "quantity": 1}
            ],
            "subtotal": 3500,
            "discount": 350,
            "total": 3150,
            "promocode": "TESTPROMO"
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        assert response.status_code == 200
        
        order = response.json()
        assert order["promocode"] == "TESTPROMO"
        assert order["discount"] == 350
        assert order["total"] == 3150
        print("✓ Order with promocode created successfully")
        return order["id"]
    
    def test_get_orders_with_items(self):
        """Test getting orders list with items"""
        response = requests.get(f"{BASE_URL}/api/orders", auth=AUTH)
        assert response.status_code == 200
        
        orders = response.json()
        assert isinstance(orders, list)
        
        # Check order structure
        for order in orders:
            assert "id" in order
            assert "customer_name" in order
            assert "customer_phone" in order
            assert "items" in order
            assert "total" in order
            assert isinstance(order["items"], list)
            
            # Check items structure
            for item in order["items"]:
                assert "name" in item
                assert "price" in item
                assert "quantity" in item
        
        print(f"✓ Retrieved {len(orders)} orders with items")
    
    def test_orders_require_auth(self):
        """Verify orders endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/orders")
        assert response.status_code == 401, "Orders should require authentication"
        print("✓ Orders endpoint properly requires authentication")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_orders(self):
        """Remove test orders"""
        response = requests.get(f"{BASE_URL}/api/orders", auth=AUTH)
        if response.status_code == 200:
            orders = response.json()
            for order in orders:
                if order["customer_name"].startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/orders/{order['id']}", auth=AUTH)
        print("✓ Test orders cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
