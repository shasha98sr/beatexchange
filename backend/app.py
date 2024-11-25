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
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    },
    r"/uploads/*": {
        "origins": ["*"],
        "methods": ["GET", "OPTIONS"],
        "allow_headers": ["Content-Type", "Range", "Accept-Ranges", "Content-Range"],
        "expose_headers": ["Content-Type", "Accept-Ranges", "Content-Range", "Content-Length"]
    }
})

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///beatexchange.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)

# Google OAuth configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
if not GOOGLE_CLIENT_ID:
    raise ValueError("GOOGLE_CLIENT_ID environment variable is not set")

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    profile_photo = db.Column(db.String(500))
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
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if not os.path.exists(file_path):
            app.logger.error(f"File not found: {file_path}")
            return jsonify({"error": "File not found"}), 404

        # Get the file's MIME type
        mime_type, _ = mimetypes.guess_type(filename)
        if not mime_type:
            mime_type = 'application/octet-stream'

        response = send_from_directory(
            app.config['UPLOAD_FOLDER'],
            filename,
            mimetype=mime_type,
            as_attachment=False,
            conditional=True  # Enable conditional responses
        )

        # Add necessary headers for audio streaming
        response.headers['Accept-Ranges'] = 'bytes'
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Headers'] = 'Range'
        response.headers['Access-Control-Expose-Headers'] = 'Content-Range'

        app.logger.info(f"Serving audio file: {filename} with MIME type: {mime_type}")
        return response

    except Exception as e:
        app.logger.error(f"Error serving audio file {filename}: {str(e)}")
        return jsonify({"error": "Error serving file"}), 500

# Route to clear database (WARNING: This will delete all data!)
@app.route('/api/clear-db', methods=['POST'])
def clear_database():
    try:
        db.drop_all()
        db.create_all()
        return jsonify({"message": "Database cleared successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Auth routes
@app.route('/api/auth/register', methods=['POST'])
@cross_origin()
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already taken"}), 400
    
    user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity=user.id)
    return jsonify({"token": access_token, "user": {"username": user.username}}), 201

@app.route('/api/auth/login', methods=['POST'])
@cross_origin()
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({"token": access_token, "user": {"username": user.username}}), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/auth/google', methods=['POST'])
@cross_origin()
def google_auth():
    try:
        data = request.get_json()
        token = data.get('credential')
        
        if not token:
            return jsonify({"error": "No token provided"}), 400

        # Verify the token
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Invalid issuer')
            
        # Get user info from token
        email = idinfo['email']
        user = User.query.filter_by(email=email).first()
        
        if not user:
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
            db.session.add(user)
            db.session.commit()
        else:
            # Update existing user's profile photo if it has changed
            profile_photo = idinfo.get('picture')
            if profile_photo and user.profile_photo != profile_photo:
                user.profile_photo = profile_photo
                db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        response_data = {
            "token": access_token,
            "user": {
                "username": user.username,
                "email": user.email,
                "profile_photo": user.profile_photo
            }
        }
        
        return jsonify(response_data)
        
    except ValueError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": "Authentication failed"}), 401

# Import routes after app and extensions are initialized
from routes import *

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
