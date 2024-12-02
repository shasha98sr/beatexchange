from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, create_access_token
from flask_cors import CORS, cross_origin
from datetime import datetime, timedelta
import os
import mimetypes
from dotenv import load_dotenv
from google.oauth2 import id_token
from google.auth.transport import requests
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

app = Flask(__name__)

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Ensure proper MIME types are registered
mimetypes.add_type('audio/wav', '.wav')
mimetypes.add_type('audio/webm', '.webm')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Configure CORS
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///beatexchange.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
app.config['ADMIN_SECRET'] = os.getenv('ADMIN_SECRET', 'your-admin-secret')  # Add this to your Render env variables

# Enable SQLAlchemy logging
import logging
logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
if not GOOGLE_CLIENT_ID:
    raise ValueError("GOOGLE_CLIENT_ID environment variable is not set")

def init_db():
    print("Initializing database...")
    try:
        # Create database directory if it doesn't exist
        db_path = os.path.dirname(app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', ''))
        if not os.path.exists(db_path) and db_path:
            print(f"Creating database directory: {db_path}")
            os.makedirs(db_path)

        # Create all tables
        with app.app_context():
            print("Creating database tables...")
            db.create_all()
            print("Database tables created successfully")
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

def reset_db():
    print("Resetting database...")
    try:
        with app.app_context():
            print("Dropping all tables...")
            db.drop_all()
            print("Creating new tables...")
            db.create_all()
            print("Database reset successfully")
    except Exception as e:
        print(f"Error resetting database: {str(e)}")
        raise

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    profile_photo = db.Column(db.String(500), nullable=True, default=None)  # Made nullable
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    beats = db.relationship('Beat', backref='author', lazy=True)

class Beat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    audio_url = db.Column(db.String(500), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    comments = db.relationship('Comment', backref='beat', lazy=True)
    likes = db.relationship('Like', backref='beat', lazy=True)

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.Float, nullable=False)  # Timestamp in seconds
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    beat_id = db.Column(db.Integer, db.ForeignKey('beat.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Like(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    beat_id = db.Column(db.Integer, db.ForeignKey('beat.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Basic route for testing
@app.route('/')
def hello_world():
    return jsonify({"message": "Welcome to BeatExchange API!"})

# Route to serve uploaded files
@app.route('/uploads/<path:filename>')
def serve_audio(filename):
    try:
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    except Exception as e:
        return jsonify({"error": str(e)}), 404

# Route to clear database (WARNING: This will delete all data!)
@app.route('/api/clear-db', methods=['POST'])
def clear_database():
    try:
        db.drop_all()
        db.create_all()
        return jsonify({"message": "Database cleared successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Auth routes
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not all(k in data for k in ["username", "email", "password"]):
        return jsonify({"error": "Missing required fields"}), 400
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({
        "token": access_token,
        "user": {"username": user.username, "email": user.email}
    })

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data.get('email')).first()
    
    if user and check_password_hash(user.password_hash, data.get('password')):
        access_token = create_access_token(identity=user.id)
        return jsonify({
            "token": access_token,
            "user": {"username": user.username, "email": user.email}
        })
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/auth/google', methods=['POST'])
@cross_origin()
def google_auth():
    try:
        print("Received Google auth request")
        data = request.get_json()
        print("Request data:", data)
        
        token = data.get('credential')
        if not token:
            print("No token provided in request")
            return jsonify({"error": "No token provided"}), 400

        print(f"Received token: {token[:50]}...")
        client_id = os.getenv('GOOGLE_CLIENT_ID')
        print(f"Using GOOGLE_CLIENT_ID: {client_id}")

        if not client_id:
            print("GOOGLE_CLIENT_ID not set in environment")
            return jsonify({"error": "Server configuration error"}), 500

        try:
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                client_id,
                clock_skew_in_seconds=10
            )
            print(f"Token verified successfully. User info: {idinfo.get('email')}")
        except ValueError as ve:
            print(f"Token verification failed: {str(ve)}")
            return jsonify({"error": f"Token verification failed: {str(ve)}"}), 401
        
        try:
            # Get user info from token
            email = idinfo['email']
            print(f"Looking up user with email: {email}")
            
            try:
                user = User.query.filter_by(email=email).first()
                print(f"Database query for user completed: {'Found' if user else 'Not found'}")
            except Exception as db_e:
                print(f"Error querying database: {str(db_e)}")
                return jsonify({"error": f"Database query failed: {str(db_e)}"}), 500
            
            if not user:
                print(f"Creating new user for email: {email}")
                try:
                    # Create new user if doesn't exist
                    username = email.split('@')[0]
                    base_username = username
                    counter = 1
                    
                    # Handle username conflicts
                    while User.query.filter_by(username=username).first():
                        username = f"{base_username}{counter}"
                        counter += 1
                    
                    user = User(
                        username=username,
                        email=email,
                        password_hash=None,  # Google authenticated users don't need a password
                        profile_photo=idinfo.get('picture')  # Get profile photo URL from Google
                    )
                    print(f"Attempting to add new user to database: {username}")
                    db.session.add(user)
                    db.session.commit()
                    print(f"Successfully created new user: {username}")
                except Exception as create_e:
                    print(f"Error creating new user: {str(create_e)}")
                    db.session.rollback()
                    return jsonify({"error": f"Failed to create user: {str(create_e)}"}), 500
            else:
                print(f"Found existing user: {user.username}")
                try:
                    # Update existing user's profile photo if it has changed
                    profile_photo = idinfo.get('picture')
                    if profile_photo and user.profile_photo != profile_photo:
                        user.profile_photo = profile_photo
                        db.session.commit()
                        print("Updated user's profile photo")
                except Exception as update_e:
                    print(f"Error updating user profile: {str(update_e)}")
                    db.session.rollback()
                    return jsonify({"error": f"Failed to update user: {str(update_e)}"}), 500
            
            try:
                # Create access token
                print(f"Creating access token for user: {user.username}")
                access_token = create_access_token(identity=user.id)
                response_data = {
                    "token": access_token,
                    "user": {
                        "username": user.username,
                        "email": user.email,
                        "profile_photo": user.profile_photo
                    }
                }
                print("Successfully created response data")
                return jsonify(response_data)
            except Exception as token_e:
                print(f"Error creating access token: {str(token_e)}")
                return jsonify({"error": f"Failed to create access token: {str(token_e)}"}), 500
            
        except Exception as e:
            print(f"Database operation failed: {str(e)}")
            db.session.rollback()
            return jsonify({"error": f"Database operation failed: {str(e)}"}), 500
            
    except Exception as e:
        print(f"Unexpected error in google_auth: {str(e)}")
        return jsonify({"error": "Authentication failed"}), 401

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "username": user.username,
        "email": user.email,
        "profile_photo": user.profile_photo
    })

# Add a protected endpoint to reset the database
@app.route('/api/admin/reset-db', methods=['POST'])
def admin_reset_db():
    admin_secret = request.headers.get('Admin-Secret')
    if not admin_secret or admin_secret != app.config['ADMIN_SECRET']:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        reset_db()
        return jsonify({"message": "Database reset successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Initialize database on startup
with app.app_context():
    try:
        # Try to create tables if they don't exist
        db.create_all()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")

if __name__ == '__main__':
    app.run(debug=True)
else:
    # Initialize database when running in production
    init_db()
