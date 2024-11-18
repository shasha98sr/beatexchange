from flask import jsonify, request, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from flask_cors import cross_origin
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from app import app, db, User, Beat, Comment, Like
from datetime import datetime
import os

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

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
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/auth/login', methods=['POST'])
@cross_origin()
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify({"token": access_token, "user_id": user.id}), 200
    
    return jsonify({"error": "Invalid credentials"}), 401

# Beat routes
@app.route('/api/beats', methods=['POST'])
@jwt_required()
@cross_origin()
def create_beat():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
        
    audio_file = request.files['audio']
    if not audio_file.filename:
        return jsonify({"error": "No selected file"}), 400
    
    # Save audio file
    filename = secure_filename(f"{datetime.utcnow().timestamp()}_{audio_file.filename}")
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio_file.save(audio_path)
    
    beat = Beat(
        title=request.form.get('title', 'Untitled Beat'),
        description=request.form.get('description', ''),
        audio_url=f"/uploads/{filename}",
        user_id=get_jwt_identity()
    )
    db.session.add(beat)
    db.session.commit()
    
    return jsonify({
        "message": "Beat uploaded successfully",
        "beat": {
            "id": beat.id,
            "title": beat.title,
            "description": beat.description,
            "audio_url": beat.audio_url
        }
    }), 201

@app.route('/api/beats', methods=['GET'])
@cross_origin()
def get_beats():
    beats = Beat.query.order_by(Beat.created_at.desc()).all()
    return jsonify([{
        'id': beat.id,
        'title': beat.title,
        'description': beat.description,
        'audio_url': beat.audio_url,
        'author': beat.author.username,
        'created_at': beat.created_at.isoformat(),
        'likes_count': len(beat.likes)
    } for beat in beats]), 200

# Comment routes
@app.route('/api/beats/<int:beat_id>/comments', methods=['POST'])
@jwt_required()
@cross_origin()
def create_comment(beat_id):
    data = request.get_json()
    comment = Comment(
        content=data['content'],
        user_id=get_jwt_identity(),
        beat_id=beat_id
    )
    db.session.add(comment)
    db.session.commit()
    
    return jsonify({"message": "Comment added successfully"}), 201

# Like routes
@app.route('/api/beats/<int:beat_id>/like', methods=['POST'])
@jwt_required()
@cross_origin()
def toggle_like(beat_id):
    user_id = get_jwt_identity()
    existing_like = Like.query.filter_by(user_id=user_id, beat_id=beat_id).first()
    
    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        return jsonify({"message": "Like removed"}), 200
    
    like = Like(user_id=user_id, beat_id=beat_id)
    db.session.add(like)
    db.session.commit()
    return jsonify({"message": "Beat liked"}), 201
