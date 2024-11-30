from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from app import app, db, User, Beat, Comment, Like
from datetime import datetime
import os
from firestore import upload_file

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def get_full_url(path):
    """Helper function to convert relative paths to full URLs"""
    if path.startswith('https://'):  
        return path
    if path.startswith('/uploads/'):
        return f"http://127.0.0.1:8000{path}"
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
    
    # Save audio file temporarily
    filename = secure_filename(f"{datetime.utcnow().timestamp()}_{audio_file.filename}")
    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    audio_file.save(temp_path)
    
    # Upload to Firebase Storage
    firebase_url = upload_file(temp_path, filename)
    if not firebase_url:
        return jsonify({"error": "Failed to upload file to storage"}), 500
    
    # Remove temporary file
    os.remove(temp_path)
    
    beat = Beat(
        title=request.form.get('title', 'Untitled Beat'),
        description=request.form.get('description', ''),
        audio_url=firebase_url,  
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
        'audio_url': get_full_url(beat.audio_url),
        'author': beat.author.username if beat.author else 'Unknown User',
        'created_at': beat.created_at.isoformat(),
        'likes_count': len(beat.likes),
        'author_photo': get_full_url(beat.author.profile_photo) if beat.author and beat.author.profile_photo else None
    } for beat in beats]), 200

@app.route('/api/users/<string:username>/beats', methods=['GET'])
@cross_origin()
def get_user_beats(username):
    # Remove @ symbol if present
    clean_username = username[1:] if username.startswith('@') else username
    
    user = User.query.filter_by(username=clean_username).first()
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    beats = Beat.query.filter_by(user_id=user.id).order_by(Beat.created_at.desc()).all()
    return jsonify([{
        'id': beat.id,
        'title': beat.title,
        'description': beat.description,
        'audio_url': get_full_url(beat.audio_url),
        'author': beat.author.username if beat.author else 'Unknown User',
        'created_at': beat.created_at.isoformat(),
        'likes_count': len(beat.likes),
        'author_photo': get_full_url(beat.author.profile_photo) if beat.author and beat.author.profile_photo else None
    } for beat in beats]), 200

@app.route('/api/users/me/beats', methods=['GET'])
@jwt_required()
@cross_origin()
def get_my_beats():
    current_user_id = get_jwt_identity()
    beats = Beat.query.filter_by(user_id=current_user_id).order_by(Beat.created_at.desc()).all()
    return jsonify([{
        'id': beat.id,
        'title': beat.title,
        'description': beat.description,
        'audio_url': get_full_url(beat.audio_url),
        'author': beat.author.username if beat.author else 'Unknown User',
        'created_at': beat.created_at.isoformat(),
        'likes_count': len(beat.likes),
        'author_photo': get_full_url(beat.author.profile_photo) if beat.author and beat.author.profile_photo else None
    } for beat in beats]), 200

# Comment routes
@app.route('/api/beats/<int:beat_id>/comments', methods=['GET'])
@jwt_required()
@cross_origin()
def get_beat_comments(beat_id):
    """Get all comments for a specific beat"""
    try:
        comments = Comment.query.filter_by(beat_id=beat_id).order_by(Comment.timestamp).all()
        return jsonify([{
            'id': comment.id,
            'content': comment.content,
            'timestamp': comment.timestamp,
            'username': User.query.get(comment.user_id).username,
            'created_at': comment.created_at.isoformat()
        } for comment in comments]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/beats/<int:beat_id>/comments', methods=['POST'])
@jwt_required()
@cross_origin()
def add_beat_comment(beat_id):
    """Add a new comment to a beat"""
    try:
        data = request.get_json()
        if not data or 'content' not in data or 'timestamp' not in data:
            return jsonify({'error': 'Missing required fields'}), 400

        # Verify beat exists
        beat = Beat.query.get(beat_id)
        if not beat:
            return jsonify({'error': 'Beat not found'}), 404

        # Get current user
        current_user_id = get_jwt_identity()

        # Create new comment
        new_comment = Comment(
            content=data['content'],
            timestamp=float(data['timestamp']),
            user_id=current_user_id,
            beat_id=beat_id
        )

        db.session.add(new_comment)
        db.session.commit()

        # Return the created comment
        return jsonify({
            'id': new_comment.id,
            'content': new_comment.content,
            'timestamp': new_comment.timestamp,
            'username': User.query.get(current_user_id).username,
            'created_at': new_comment.created_at.isoformat()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/comments/<int:comment_id>', methods=['PUT'])
@jwt_required()
def update_comment(comment_id):
    """Update an existing comment"""
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Missing content field'}), 400

        # Get current user
        current_user_id = get_jwt_identity()

        # Find comment
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        # Verify ownership
        if comment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Update comment
        comment.content = data['content']
        if 'timestamp' in data:
            comment.timestamp = float(data['timestamp'])
        
        db.session.commit()

        return jsonify({
            'id': comment.id,
            'content': comment.content,
            'timestamp': comment.timestamp,
            'username': User.query.get(comment.user_id).username,
            'created_at': comment.created_at.isoformat()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/comments/<int:comment_id>', methods=['DELETE'])
@jwt_required()
def delete_comment(comment_id):
    """Delete a comment"""
    try:
        # Get current user
        current_user_id = get_jwt_identity()

        # Find comment
        comment = Comment.query.get(comment_id)
        if not comment:
            return jsonify({'error': 'Comment not found'}), 404

        # Verify ownership
        if comment.user_id != current_user_id:
            return jsonify({'error': 'Unauthorized'}), 403

        # Delete comment
        db.session.delete(comment)
        db.session.commit()

        return jsonify({'message': 'Comment deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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
