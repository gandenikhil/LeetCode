# auth_routes.py
from flask import Blueprint, request, jsonify, session
from firebase_admin import auth as admin_auth, firestore
from firebase_admin.auth import InvalidIdTokenError
import traceback

auth_bp = Blueprint('auth', __name__)
db = firestore.client()

@auth_bp.route('/api/check-credentials', methods=['POST'])
def check_credentials():
    try:
        data = request.json
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({
                'success': False,
                'error': 'Email and password are required'
            }), 400

        try:
            # Get user by email
            user = admin_auth.get_user_by_email(email)
            
            # Get user data from Firestore
            user_doc = db.collection('users').document(user.uid).get()
            if not user_doc.exists:
                return jsonify({
                    'success': False,
                    'error': 'User profile not found'
                }), 404

            user_data = user_doc.to_dict()
            
            # Store user ID temporarily
            session['temp_uid'] = user.uid

            return jsonify({
                'success': True,
                'phoneNumber': user_data.get('phoneNumber'),
                'email': email,
                'userId': user.uid
            }), 200

        except Exception as e:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/api/verify-phone', methods=['POST'])
def verify_phone():
    try:
        data = request.json
        phone_number = data.get('phoneNumber')

        if not phone_number:
            return jsonify({
                'success': False,
                'error': 'Phone number is required'
            }), 400

        # Create a new phone verification session
        verification_session = admin_auth.create_session_cookie({
            'phoneNumber': phone_number,
            'recaptcha': True
        })

        return jsonify({
            'success': True,
            'sessionInfo': verification_session
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/api/verify-code', methods=['POST'])
def verify_code():
    try:
        data = request.json
        session_info = data.get('sessionInfo')
        verification_code = data.get('code')
        id_token = data.get('idToken')

        if not session_info or not verification_code:
            return jsonify({
                'success': False,
                'error': 'Session info and verification code are required'
            }), 400

        # Verify the code with Firebase
        try:
            # Verify the ID token first
            decoded_token = admin_auth.verify_id_token(id_token)
            uid = decoded_token['uid']

            # Check if this matches the stored temp_uid
            if uid != session.get('temp_uid'):
                raise Exception('User mismatch')

            # Create a custom token for the user
            custom_token = admin_auth.create_custom_token(uid)

            # Clear temporary session data
            session.pop('temp_uid', None)

            return jsonify({
                'success': True,
                'customToken': custom_token,
                'userId': uid
            }), 200

        except InvalidIdTokenError:
            return jsonify({
                'success': False,
                'error': 'Invalid session'
            }), 401

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500