from app import app, db

with app.app_context():
    db.drop_all()  # Clear existing tables
    db.create_all()  # Create new tables
    print("Database initialized successfully!")
