from flask import jsonify, request
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
        # Use the actual domain from request
        return f"{request.url_root.rstrip('/')}{path}"
    return path

# Beat routes
@app.route('/api/beats', methods=['POST'])
@jwt_required()
@cross_origin(supports_credentials=True)
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
            "audio_url": get_full_url(beat.audio_url),
            "user_id": beat.user_id,
            "username": beat.author.username,
            "created_at": beat.created_at.isoformat(),
            "likes_count": 0,
            "liked_by_user": False
        }
    }), 201

@app.route('/api/beats', methods=['GET'])
@cross_origin(supports_credentials=True)
def get_beats():
    try:
        beats = Beat.query.order_by(Beat.created_at.desc()).all()
        current_user_id = get_jwt_identity() if request.headers.get('Authorization') else None
        
        beats_list = []
        for beat in beats:
            likes_count = Like.query.filter_by(beat_id=beat.id).count()
            liked_by_user = False
            if current_user_id:
                liked_by_user = Like.query.filter_by(
                    beat_id=beat.id,
                    user_id=current_user_id
                ).first() is not None
                
            beats_list.append({
                'id': beat.id,
                'title': beat.title,
                'description': beat.description,
                'audio_url': get_full_url(beat.audio_url),
                'user_id': beat.user_id,
                'username': beat.author.username,
                'created_at': beat.created_at.isoformat(),
                'likes_count': likes_count,
                'liked_by_user': liked_by_user,
                'author_photo': get_full_url(beat.author.profile_photo) if beat.author and beat.author.profile_photo else None
            })
        
        return jsonify(beats_list), 200
    except Exception as e:
        print(f"Error fetching beats: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Comment routes
@app.route('/api/beats/<int:beat_id>/comments', methods=['GET'])
@jwt_required()
@cross_origin(supports_credentials=True)
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
@cross_origin(supports_credentials=True)
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
@cross_origin(supports_credentials=True)
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
@cross_origin(supports_credentials=True)
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
@cross_origin(supports_credentials=True)
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
