import firebase_admin
from firebase_admin import credentials, storage

cred = credentials.Certificate('spitbox-30877-firebase.json')  
firebase_admin.initialize_app(cred, {
    'storageBucket': 'spitbox-30877.firebasestorage.app'  # Corrected storage bucket URL
})

bucket = storage.bucket()

def upload_file(local_file_path, destination_blob_name):
    try:
        blob = bucket.blob(destination_blob_name)
        blob.upload_from_filename(local_file_path)
        print(f"File {local_file_path} uploaded to {destination_blob_name}")
        
        # Get the public URL
        blob.make_public()
        print(f"Public URL: {blob.public_url}")
        return blob.public_url
    except Exception as e:
        print(f"Error uploading file: {e}")
        return None

if __name__ == "__main__":
    # Example usage
    upload_file('./uploads/1732696960.216383_recording.wav', '1732696960.216383_recording.wav')