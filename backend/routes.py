from flask import jsonify, request, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from app import app, db, User, Beat, Comment, Like
from datetime import datetime
import os

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def get_full_url(path):
    """Helper function to convert relative paths to full URLs"""
    if path.startswith('/uploads/'):
        return f"http://127.0.0.1:5000{path}"
    return path

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
    
    relative_url = f"/uploads/{filename}"
    beat = Beat(
        title=request.form.get('title', 'Untitled Beat'),
        description=request.form.get('description', ''),
        audio_url=relative_url,
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
            "audio_url": get_full_url(beat.audio_url)
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
        'audio_url': get_full_url(beat.audio_url),
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
