# YouTube Clone (backend only) --> IN PROGRESS
Used tech stack for this project: **MongoDB, Express, Node**

## Core packages
1. **bcrypt**: for password hashing
2. **cloudinary**: for storing images separately on cloud
3. **cookie-parser**: to parse cookie header
4. **cors**: for cross origin resource sharing
5. **dotenv**: to load env variables into process.env
6. **jsonwebtoken**: for authentication via token generation
7. **mongoose**: ODM for mongoDB
8. **multer**: for uploading on server temporarily

## Features 
- Login/Register -->  ![Static Badge](https://img.shields.io/badge/status-available-green)
- Edit profile --> ![Static Badge](https://img.shields.io/badge/status-available-green)
- Homepage --> ![Static Badge](https://img.shields.io/badge/status-in_progress-blue)
- Recommendation page --> ![Static Badge](https://img.shields.io/badge/status-planned-white)
- Watch History --> ![Static Badge](https://img.shields.io/badge/status-available-green)
---
- Upload video --> ![Static Badge](https://img.shields.io/badge/status-in_progress-blue)
- Make a playlist --> ![Static Badge](https://img.shields.io/badge/status-in_progress-blue)
- View video --> ![Static Badge](https://img.shields.io/badge/status-planned-white)
- Share Video --> ![Static Badge](https://img.shields.io/badge/status-planned-white)
---
- Search video by channel name/title --> ![Static Badge](https://img.shields.io/badge/status-in_progress-blue)
---
- Subscribe/Unsubscribe from channels --> ![Static Badge](https://img.shields.io/badge/status-in_progress-blue)
- Add or view comments --> ![Static Badge](https://img.shields.io/badge/status-in_progress-blue)


## Setup and run development server
1. Clone this repo
```shell
git clone https://github.com/keshavguptawork/project-y.git
```
2. Navigate to repo directory
```shell
cd project-y
```
3. Create a `.env` file at the root directory with the following contents
```shell
PORT = 8000
MONGODB_URI = [YOUR_DB_CONNECTION_URI]
CORS_ORIGIN = * 
ACCESS_TOKEN_SECRET = metaIsEverywhere # opt for something more secure
ACCESS_TOKEN_EXPIRY = 1d
REFRESH_TOKEN_SECRET = someRandomSecret
REFRESH_TOKEN_EXPIRY = 10d

CLOUDINARY_CLOUD_NAME = [YOUR_CLOUDINARY_CLOUD_NAME]
CLOUDINARY_API_KEY = [YOUR_CLOUDINARY_API_KEY]
CLOUDINARY_API_SECRET = [YOUR_CLOUDINARY_API_SECRET_KEY]
```
4. Install the dependencies
```shell
npm install
```
5. Run the development server
```shell
npm run dev # server started running at http://localhost:8000
```