# Cloud-Based Real-Time Chat App Architecture

This document explains the technical architecture and deployment strategy for this project.

## 🏗️ System Architecture

The application follows a standard client-server model optimized for real-time communication using WebSockets.

### 1. Frontend (Client Layer)
- **Hosted on:** AWS S3 (Static Website Hosting)
- **Technologies:** HTML5, CSS3, Vanilla JavaScript
- **Role:** Provides the user interface, handles browser-based WebSocket events, and renders messages dynamically.
- **Why S3?** S3 is highly durable, scalable, and cost-effective for hosting static assets without needing a web server like Nginx (though Nginx is an alternative if using EC2 for frontend).

### 2. Backend (Application Layer)
- **Hosted on:** AWS EC2 (Elastic Compute Cloud)
- **Technologies:** Python, FastAPI, Uvicorn (ASGI Server)
- **Role:** Manages WebSocket connections, maintains an in-memory `ConnectionManager`, and broadcasts messages to all connected clients.
- **Why FastAPI?** It is extremely fast, built on Starlette for WebSocket support, and uses asynchronous programming (`async/await`) which is ideal for real-time apps.

### 3. Communication Protocol
- **Protocol:** WebSocket (WS)
- **How it works:** Unlike HTTP (which is request-response), WebSockets provide a **full-duplex** communication channel over a single, long-lived connection. This allows the server to "push" messages to the client instantly.

---

## 🚀 Step-by-Step AWS Deployment Guide

### Part 1: Deploying Backend (EC2)
1.  **Launch Instance:** Go to AWS Console > EC2 > Launch Instance. Choose **Ubuntu 24.04** (Free Tier).
2.  **Security Group:** In "Inbound Rules", add:
    - **Port 22 (SSH):** To My IP.
    - **Port 8000 (Custom TCP):** To `0.0.0.0/0` (This is where the Chat Server runs).
3.  **Connect via SSH:** `ssh -i your-key.pem ubuntu@your-ec2-ip`.
4.  **Setup Code:**
    ```bash
    mkdir cloud-chat && cd cloud-chat
    # (Upload your backend/ folder files here using SCP or git clone)
    sudo apt update && sudo apt install -y python3-pip
    pip install -r requirements.txt --break-system-packages
    ```
5.  **Run Server:** 
    ```bash
    # Use screen or nohup to keep it running after closing terminal
    nohup uvicorn main:app --host 0.0.0.0 --port 8000 &
    ```

### Part 2: Preparing Frontend
1.  **Important:** Open [script.js](file:///Users/naveeng/Desktop/cloud/frontend/script.js).
2.  Update the `host` logic to your **EC2 Public IP**:
    ```javascript
    // Change this in script.js to point to your EC2 instance
    const host = 'your-ec2-public-ip:8000'; 
    ```
3.  Save the file.

### Part 3: Deploying Frontend (S3)
1.  **Create Bucket:** AWS Console > S3 > Create Bucket. (Name must be unique).
2.  **Uncheck** "Block all public access" (Required for static website hosting).
3.  **Enable Static Hosting:** Bucket > Properties > Static website hosting > Edit > Enable. Set `index.html` as the index document.
4.  **Upload Files:** Upload `index.html`, `style.css`, and your updated `script.js`.
5.  **Set Policy:** Bucket > Permissions > Bucket policy > Edit:
    ```json
    {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::your-bucket-name/*"
            }
        ]
    }
    ```
6.  **Test:** Visit the **Bucket Website Endpoint** provided in the Properties tab.

---
### Step 3: Scalability (Bonus Explanation)
- **Load Balancer (ALB):** In a real-world scenario, you would place an Application Load Balancer in front of multiple EC2 instances. WebSockets require **Sticky Sessions** (session affinity) to work correctly with load balancers.
- **Redis (Pub/Sub):** To scale horizontally (multiple servers), you would use Redis to broadcast messages across all server instances.

---

## 🎓 Viva Questions & Answers
- **Q: Why WebSockets instead of HTTP polling?**
  - A: HTTP polling has high latency and overhead. WebSockets provide real-time, bi-directional communication with low overhead.
- **Q: What happens if the server restarts?**
  - A: In this simple version, all in-memory connections are lost. A production version would use Redis or a database to manage state.
- **Q: How can we secure this?**
  - A: Using HTTPS/WSS (SSL/TLS), adding JWT authentication, and rate limiting.
