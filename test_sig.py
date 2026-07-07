from jose import jwt as jose_jwt
import jwt as pyjwt

secret = "default_super_secret_for_local_dev_only"

# Sign with python-jose (similar to what Auth.js uses under the hood)
# Wait, Auth.js uses 'jose' which is a JS library.
