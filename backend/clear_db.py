from app import db, app

# Use Flask application context
with app.app_context():
    # Clear all tables
    print("Dropping all tables...")
    db.drop_all()

    # Recreate all tables
    print("Recreating all tables...")
    db.create_all()

    print("Database has been cleared successfully!")
