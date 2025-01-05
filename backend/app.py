# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import auth as admin_auth, firestore
import datetime
import traceback
from config import db, admin_app, auth
import random
app = Flask(__name__)
# setup_questions.py
from firebase_admin import firestore
from config import db
import subprocess
import tempfile
import os
import json
import stripe

# Configure CORS properly
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})


stripe.api_key = ''



# Initialize Firestore
db = firestore.client()

@app.route('/api/check-credentials', methods=['POST', 'OPTIONS'])
def check_credentials():
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 204
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
            
            return jsonify({
                'success': True,
                'phoneNumber': user_data.get('phoneNumber'),
                'email': email,
                'userId': user.uid
            }), 200

        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401

    except Exception as e:
        print(f"Check credentials error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/verify-code', methods=['POST', 'OPTIONS'])
def verify_code():
    if request.method == 'OPTIONS':
        # Handle preflight request
        return '', 204

    try:
        data = request.json
        id_token = data.get('idToken')
        code = data.get('code')

        if not id_token or not code:
            return jsonify({
                'success': False,
                'error': 'ID token and verification code are required'
            }), 400

        try:
            # Verify the ID token
            decoded_token = admin_auth.verify_id_token(id_token)
            uid = decoded_token['uid']

            # Create a custom token
            custom_token = admin_auth.create_custom_token(uid)

            # Update user's phoneVerified status
            db.collection('users').document(uid).update({
                'phoneVerified': True,
                'lastLogin': datetime.datetime.now().isoformat()
            })

            return jsonify({
                'success': True,
                'customToken': custom_token.decode('utf-8') if isinstance(custom_token, bytes) else custom_token,
                'userId': uid
            }), 200

        except Exception as e:
            print(f"Token verification error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid token'
            }), 401

    except Exception as e:
        print(f"Code verification error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400

        required_fields = ['email', 'firstName', 'lastName', 'phoneNumber', 'uid']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400

        user_data = {
            'email': data.get('email'),
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'phoneNumber': data.get('phoneNumber'),
            'address': data.get('address', ''),
            'userType': data.get('userType', []),
            'createdAt': datetime.datetime.now().isoformat(),
            'subscription': 'free',
            'problemsSolved': 0,
            'streak': 0,
            'emailVerified': False,
            'phoneVerified': data.get('phoneVerified', False)
        }
        
        print("Attempting to save user data:", user_data)
        
        try:
            # Try to save to Firestore directly first
            db.collection('users').document(data['uid']).set(user_data)
            print(f"Successfully saved user data to Firestore for uid: {data['uid']}")
            
            return jsonify({
                'success': True,
                'userId': data['uid'],
                'message': 'User registered successfully'
            }), 200
                
        except Exception as e:
            print(f"Firestore error: {str(e)}")
            print(traceback.format_exc())
            return jsonify({
                'success': False,
                'error': f'Database error: {str(e)}'
            }), 500
                
    except Exception as e:
        print(f"Registration error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/complete-login', methods=['POST', 'OPTIONS'])
def complete_login():
    try:
        if request.method == 'OPTIONS':
            # Handle preflight request
            return jsonify({'success': True}), 200

        # Get authorization token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'No token provided'
            }), 401
            
        token = auth_header.split(' ')[1]
        
        try:
            # Verify Firebase token
            decoded_token = admin_auth.verify_id_token(token)
            uid = decoded_token['uid']
            
            # Get user profile from Firestore
            user_doc = db.collection('users').document(uid).get()
            
            if not user_doc.exists:
                print(f"User document not found for uid: {uid}")
                return jsonify({
                    'success': False,
                    'error': 'User profile not found'
                }), 404
                
            user_profile = user_doc.to_dict()
            print(f"Found user profile: {user_profile}")
            
            # Update last login timestamp
            db.collection('users').document(uid).update({
                'lastLogin': datetime.datetime.now().isoformat()
            })
            
            return jsonify({
                'success': True,
                'profile': user_profile,
                'token': token
            }), 200
            
        except Exception as e:
            print(f"Token verification error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid token'
            }), 401
            
    except Exception as e:
        print(f"Login completion error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        




# Updated endpoint in app.py
@app.route('/api/questions', methods=['GET', 'OPTIONS'])
def get_questions():
    if request.method == 'OPTIONS':
        return '', 204

    try:
        # Verify auth token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'No token provided'
            }), 401
            
        token = auth_header.split(' ')[1]
        
        try:
            # Verify Firebase token
            decoded_token = admin_auth.verify_id_token(token)
            uid = decoded_token['uid']
            
            # Get questions from Firestore
            questions_ref = db.collection('questions')
            questions_docs = questions_ref.get()
            
            # Get user progress
            user_progress_ref = db.collection('users').document(uid).collection('progress')
            user_progress = {doc.id: doc.to_dict() for doc in user_progress_ref.get()}
            
            # Sample companies for randomization
            sample_companies = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix']
            difficulty = ['Easy', 'Medium', 'Hard','impossible']
            topics = ['Arrays','Strings','Trees','Dynamic Programming','Graphs','Math']
            
            questions = []
            for doc in questions_docs:
                question_data = doc.to_dict()
                question_id = doc.id
                # Add randomized data
                question_data.update({
                    'id': question_data["id"],
                    'status': user_progress.get(question_id, {}).get('status', 'Todo'),
                    'solvedCount': random.randint(1000, 50000),
                    'acceptance': random.randint(40, 90),
                    'companies': random.sample(sample_companies, random.randint(1, 4)),
                    'difficulty' : random.choice(difficulty),
                    'topics': random.sample(topics, random.randint(1, 3))
                })
                
                questions.append(question_data)
            
            return jsonify({
                'success': True,
                'questions': questions
            }), 200
            
        except Exception as e:
            print(f"Token verification error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Invalid token'
            }), 401
            
    except Exception as e:
        print(f"Get questions error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Function to get user's progress for a specific question
@app.route('/api/questions/<question_id>/progress', methods=['GET'])
def get_question_progress(question_id):
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({
                'success': False,
                'error': 'No token provided'
            }), 401
            
        token = auth_header.split(' ')[1]
        decoded_token = admin_auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        progress_ref = db.collection('users').document(uid)\
                        .collection('progress').document(question_id)
        
        progress_doc = progress_ref.get()
        if progress_doc.exists:
            return jsonify({
                'success': True,
                'progress': progress_doc.to_dict()
            }), 200
        else:
            return jsonify({
                'success': True,
                'progress': {'status': 'Todo'}
            }), 200
            
    except Exception as e:
        print(f"Error getting question progress: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
    

@app.route('/api/questions/<question_id>', methods=['GET', 'OPTIONS'])
def get_question(question_id):
    if request.method == 'OPTIONS':
        return '', 204

    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        decoded_token = admin_auth.verify_id_token(token)
        uid = decoded_token['uid']

        # Query Firestore for the document with the matching field
        query = db.collection('questions').where('id', '==', question_id).limit(1).get()

        if not query:
            return jsonify({'success': False, 'error': 'Question not found'}), 404

        target_doc = query[0]
        question_data = target_doc.to_dict()
        print(question_data["title"])
        print(question_data["testCases"])

        question_data.update({
            'id': question_id,
            'solvedCount': random.randint(1000, 50000),
            'acceptance': random.randint(40, 90),
            'status': 'Todo',
            'companies': random.sample(['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix'], random.randint(1, 4)),
        })

        return jsonify({'success': True, 'question': question_data}), 200

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500



@app.route('/api/execute', methods=['POST'])
def execute_code():
    try:
        # Get the request data
        data = request.get_json()
        code = data.get('code')
        language = data.get('language')
        test_case = data.get('testCase')

        if not code or not language or not test_case:
            return jsonify({'success': False, 'error': 'Code, language, and test case are required'}), 400

        # Define language configuration
        language_config = {
            'python': {'ext': '.py', 'exec': 'python'},
            'javascript': {'ext': '.js', 'exec': 'node'},
            'java': {'ext': '.java', 'exec': 'java'}
        }

        if language not in language_config:
            return jsonify({'success': False, 'error': 'Unsupported language'}), 400

        lang_config = language_config[language]
        input_data = test_case.get('input')
        expected_output = test_case.get('output')

        # Write user code to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=lang_config['ext']) as code_file:
            code_file.write(code.encode())
            code_file.flush()
            code_file_path = code_file.name

        try:
            # Execute the user's code
            exec_command = [lang_config['exec'], code_file_path]
            proc = subprocess.run(
                exec_command,
                input=json.dumps(input_data),  # Pass input as JSON
                text=True,
                capture_output=True,
                timeout=5
            )

            actual_output = proc.stdout.strip()
            error_output = proc.stderr.strip()
            print("Actual Output:", actual_output)
            print("Expected Output:", expected_output)
            print("Error :",error_output)

            # Attempt to parse the output as JSON
            try:
                actual_output_json = json.loads(actual_output)
            except json.JSONDecodeError:
                actual_output_json = actual_output  # Use raw output if JSON parsing fails

            # Compare actual output with expected output
            passed = str(actual_output_json) == str(expected_output)

            result = {
                'input': input_data,
                'expectedOutput': expected_output,
                'actualOutput': actual_output_json,
                'errorOutput': error_output,
                'status': 'PASSED' if passed else 'FAILED'
            }

        except subprocess.TimeoutExpired:
            result = {'status': 'TIMEOUT', 'error': 'Code execution timed out'}
        except Exception as e:
            result = {'status': 'ERROR', 'error': str(e)}
        finally:
            os.unlink(code_file_path)

        return jsonify({'success': True, 'result': result}), 200

    except Exception as e:
        print(f"Execution Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/webhook', methods=['POST'])
def stripe_webhook():
    event = None
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({'error': 'Invalid signature'}), 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        
        # Get customer email from the session
        customer_email = session.get('customer_details', {}).get('email')
        
        try:
            # Find user by email
            user = admin_auth.get_user_by_email(customer_email)
            
            # Update user's subscription status in Firestore
            db.collection('users').document(user.uid).update({
                'subscription': 'pro',
                'subscriptionUpdatedAt': datetime.datetime.now().isoformat(),
                'stripeCustomerId': session.get('customer')
            })
            
            return jsonify({'status': 'success'}), 200
        except Exception as e:
            print(f"Error updating user subscription: {str(e)}")
            return jsonify({'error': str(e)}), 500

    return jsonify({'status': 'success'}), 200

@app.route('/api/subscription/status', methods=['GET'])
def get_subscription_status():
    try:
        # Get authorization token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'No token provided'}), 401

        token = auth_header.split(' ')[1]
        decoded_token = admin_auth.verify_id_token(token)
        uid = decoded_token['uid']

        # Get user's subscription status from Firestore
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            return jsonify({'success': False, 'error': 'User not found'}), 404

        user_data = user_doc.to_dict()
        return jsonify({
            'success': True,
            'subscription': user_data.get('subscription', 'free'),
            'subscriptionUpdatedAt': user_data.get('subscriptionUpdatedAt')
        }), 200

    except Exception as e:
        print(f"Error getting subscription status: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# Add these endpoints to your app.py

@app.route('/api/update-subscription', methods=['POST'])
def update_subscription():
    try:
        # Get authorization token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
            
        token = auth_header.split(' ')[1]
        decoded_token = admin_auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Update user's subscription status in Firestore
        db.collection('users').document(uid).update({
            'subscription': 'pro',
            'subscriptionUpdatedAt': datetime.datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'message': 'Subscription updated successfully'
        })

    except Exception as e:
        print(f"Error updating subscription: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    try:
        # Get authorization token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
            
        token = auth_header.split(' ')[1]
        decoded_token = admin_auth.verify_id_token(token)
        uid = decoded_token['uid']
        
        # Get user data
        user_doc = db.collection('users').document(uid).get()
        if not user_doc.exists:
            return jsonify({'error': 'User not found'}), 404
            
        user_data = user_doc.to_dict()

        try:
            # Create a product first if it doesn't exist
            product = stripe.Product.create(
                name='Pro Membership',
                description='Access to all premium features'
            )

            # Create a price for the product
            price = stripe.Price.create(
                unit_amount=0,  # Free for testing
                currency='usd',
                recurring={"interval": "month"},
                product=product.id,
            )
            price_id = price.id
        except Exception as e:
            print(f"Error creating price: {str(e)}")
            prices = stripe.Price.list(
                limit=1,
                active=True,
                type='recurring'
            )
            if not prices.data:
                raise Exception("No active prices found")
            price_id = prices.data[0].id

        # Create Stripe checkout session with the price
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://127.0.0.1:3000/subscription/success',  # Changed to a success page
            cancel_url='http://127.0.0.1:3000/subscription?canceled=true',
            client_reference_id=uid,
            customer_email=user_data.get('email')
        )
        
        return jsonify({
            'success': True,
            'sessionId': checkout_session.id,
            'url': checkout_session.url
        })

    except Exception as e:
        print(f"Error creating checkout session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Endpoint to verify session and update subscription
@app.route('/api/verify-session/<session_id>', methods=['POST'])
def verify_session(session_id):
    try:
        # Get authorization token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401
            
        token = auth_header.split(' ')[1]
        decoded_token = admin_auth.verify_id_token(token)
        uid = decoded_token['uid']

        # Verify the session with Stripe
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status == 'paid':
            # Update user's subscription status in Firestore
            db.collection('users').document(uid).update({
                'subscription': 'pro',
                'subscriptionUpdatedAt': datetime.datetime.now().isoformat(),
                'stripeCustomerId': session.customer,
                'stripeSubscriptionId': session.subscription
            })
            
            return jsonify({
                'success': True,
                'message': 'Subscription updated successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Payment not completed'
            }), 400

    except Exception as e:
        print(f"Error verifying session: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Add a route to list all prices (for debugging)
@app.route('/api/list-prices', methods=['GET'])
def list_prices():
    try:
        prices = stripe.Price.list(
            limit=100,
            active=True
        )
        return jsonify({
            'success': True,
            'prices': [{
                'id': price.id,
                'product': price.product,
                'amount': price.unit_amount,
                'currency': price.currency,
                'recurring': price.recurring
            } for price in prices.data]
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500



# print("hey")
if __name__ == '__main__':
    app.run(debug=True)
