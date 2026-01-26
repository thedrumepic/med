import requests
import sys
from datetime import datetime
import json

class HoneyFarmAPITester:
    def __init__(self, base_url="https://medovik-farm.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_auth = ('armanuha', 'secretboost1')
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, auth=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, auth=auth)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, auth=auth)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, auth=auth)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, auth=auth)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, ensure_ascii=False)[:200]}..."
                except:
                    details += f", Response: {response.text[:200]}..."
            else:
                details += f", Expected: {expected_status}, Response: {response.text[:200]}..."

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_basic_endpoints(self):
        """Test basic API endpoints"""
        print("\n=== TESTING BASIC ENDPOINTS ===")
        
        # Test root endpoint
        self.run_test("API Root", "GET", "", 200)
        
        # Test categories endpoint
        success, categories = self.run_test("Get Categories", "GET", "categories", 200)
        if success and categories:
            print(f"   Found {len(categories)} categories")
            for cat in categories[:3]:  # Show first 3
                print(f"   - {cat.get('name', 'Unknown')} ({cat.get('slug', 'no-slug')})")
        
        # Test products endpoint
        success, products = self.run_test("Get Products", "GET", "products", 200)
        if success and products:
            print(f"   Found {len(products)} products")
            for prod in products[:3]:  # Show first 3
                print(f"   - {prod.get('name', 'Unknown')} - {prod.get('base_price', 0)} ₸")
        
        return categories, products

    def test_admin_login(self):
        """Test admin login"""
        print("\n=== TESTING ADMIN LOGIN ===")
        
        # Test admin login endpoint
        login_data = {"username": "armanuha", "password": "secretboost1"}
        success, response = self.run_test("Admin Login", "POST", "admin/login", 200, login_data)
        
        # Test wrong credentials
        wrong_data = {"username": "wrong", "password": "wrong"}
        self.run_test("Admin Login (Wrong Credentials)", "POST", "admin/login", 401, wrong_data)
        
        return success

    def test_category_crud(self):
        """Test category CRUD operations"""
        print("\n=== TESTING CATEGORY CRUD ===")
        
        # Create category
        new_category = {
            "name": "Тестовая категория",
            "slug": "test-category"
        }
        success, created_cat = self.run_test(
            "Create Category", "POST", "categories", 200, 
            new_category, self.admin_auth
        )
        
        if success and created_cat:
            cat_id = created_cat.get('id')
            print(f"   Created category with ID: {cat_id}")
            
            # Update category
            updated_category = {
                "name": "Обновленная категория",
                "slug": "updated-category"
            }
            self.run_test(
                "Update Category", "PUT", f"categories/{cat_id}", 200,
                updated_category, self.admin_auth
            )
            
            # Delete category
            self.run_test(
                "Delete Category", "DELETE", f"categories/{cat_id}", 200,
                auth=self.admin_auth
            )

    def test_product_crud(self):
        """Test product CRUD operations"""
        print("\n=== TESTING PRODUCT CRUD ===")
        
        # First get a category ID
        success, categories = self.run_test("Get Categories for Product Test", "GET", "categories", 200)
        if not success or not categories:
            print("❌ Cannot test products without categories")
            return
        
        category_id = categories[0]['id']
        
        # Create product
        new_product = {
            "name": "Тестовый мёд",
            "description": "Описание тестового мёда",
            "category_id": category_id,
            "image": "https://example.com/test.jpg",
            "base_price": 1000,
            "weight_prices": [
                {"weight": "250гр", "price": 1000},
                {"weight": "500гр", "price": 1800}
            ]
        }
        success, created_prod = self.run_test(
            "Create Product", "POST", "products", 200,
            new_product, self.admin_auth
        )
        
        if success and created_prod:
            prod_id = created_prod.get('id')
            print(f"   Created product with ID: {prod_id}")
            
            # Get single product
            self.run_test("Get Single Product", "GET", f"products/{prod_id}", 200)
            
            # Update product
            updated_product = {
                "name": "Обновленный тестовый мёд",
                "base_price": 1200
            }
            self.run_test(
                "Update Product", "PUT", f"products/{prod_id}", 200,
                updated_product, self.admin_auth
            )
            
            # Delete product
            self.run_test(
                "Delete Product", "DELETE", f"products/{prod_id}", 200,
                auth=self.admin_auth
            )

    def test_seed_data(self):
        """Test seed data endpoint"""
        print("\n=== TESTING SEED DATA ===")
        self.run_test("Seed Data", "POST", "seed", 200)

    def test_filtering(self):
        """Test product filtering by category"""
        print("\n=== TESTING PRODUCT FILTERING ===")
        
        # Get categories first
        success, categories = self.run_test("Get Categories for Filtering", "GET", "categories", 200)
        if success and categories:
            # Test filtering by first category
            cat_id = categories[0]['id']
            cat_name = categories[0]['name']
            success, filtered_products = self.run_test(
                f"Filter Products by {cat_name}", "GET", f"products?category_id={cat_id}", 200
            )
            if success:
                print(f"   Found {len(filtered_products)} products in category {cat_name}")

    def run_all_tests(self):
        """Run all tests"""
        print("🐝 Starting Honey Farm API Tests...")
        print(f"Testing API at: {self.base_url}")
        
        # Test basic functionality
        categories, products = self.test_basic_endpoints()
        
        # Test admin functionality
        admin_login_success = self.test_admin_login()
        
        # Test CRUD operations (only if admin login works)
        if admin_login_success:
            self.test_category_crud()
            self.test_product_crud()
        
        # Test seed data
        self.test_seed_data()
        
        # Test filtering
        self.test_filtering()
        
        # Print summary
        print(f"\n📊 TEST SUMMARY")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = HoneyFarmAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())