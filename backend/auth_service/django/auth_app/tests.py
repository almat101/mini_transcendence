from rest_framework.test import APITestCase

class AuthAppLoginTest(APITestCase):
    def test_login_empty_field(self):
        response = self.client.post('/api/auth/login/', {}) 
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.data)

    def test_login_wrong_credentials(self):
            data = {
                "username": "wrong_user",
                "password": "worngp_asswords"
            }
            response = self.client.post('/api/auth/login/', data)
            self.assertEqual(response.status_code, 400)
            self.assertIn('error', response.data)