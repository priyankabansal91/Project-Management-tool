# PostgreSQL Setup Guide for Windows

Since Docker is not available on your system, you need to install PostgreSQL locally. Here are the steps:

## Option 1: Download PostgreSQL Installer (Recommended)

1. **Download PostgreSQL**
   - Go to: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15 or 16 (latest stable version)
   - Choose the "Windows x86-64" installer

2. **Run the Installer**
   - Double-click the downloaded `.exe` file
   - Follow the installation wizard
   - **Important settings:**
     - Installation directory: `C:\Program Files\PostgreSQL\15` (or default)
     - Port: `5432` (default)
     - Superuser password: `password` (or your choice)
     - Locale: `[Default locale]`

3. **Verify Installation**
   - Open Command Prompt or PowerShell
   - Run: `psql --version`
   - You should see the PostgreSQL version

4. **Create Database**
   - Open pgAdmin (installed with PostgreSQL) or use command line:
   ```bash
   psql -U postgres -c "CREATE DATABASE pm_tool;"
   ```
   - When prompted, enter the password you set during installation

5. **Update .env File**
   - Edit `backend/.env`
   - Make sure `DATABASE_URL` matches your setup:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/pm_tool?schema=public
   ```
   - Replace `password` with the password you set during installation

## Option 2: Using Chocolatey (if you have admin rights)

```powershell
choco install postgresql -y --params '/Password:password /Port:5432'
```

## Option 3: Using WSL (Windows Subsystem for Linux)

If you have WSL installed:
```bash
wsl
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

## Verify Database Connection

After installation, test the connection:

```bash
psql -U postgres -h localhost -d pm_tool
```

If successful, you'll see the `pm_tool=#` prompt.

## Initialize Database Schema

Once PostgreSQL is running and the database is created:

```bash
cd backend
npx prisma migrate dev --name init
```

This will:
1. Create all tables based on the Prisma schema
2. Generate the Prisma client

## Troubleshooting

### "psql: command not found"
- PostgreSQL is not in your PATH
- Add `C:\Program Files\PostgreSQL\15\bin` to your Windows PATH environment variable
- Restart your terminal

### "Connection refused"
- PostgreSQL service is not running
- On Windows: Start → Services → Find "postgresql-x64-15" → Right-click → Start
- Or use: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`

### "FATAL: password authentication failed"
- Wrong password in DATABASE_URL
- Check the password you set during installation
- Or reset it using pgAdmin

### "database "pm_tool" does not exist"
- Create the database:
  ```bash
  psql -U postgres -c "CREATE DATABASE pm_tool;"
  ```

## Next Steps

1. Install PostgreSQL using one of the methods above
2. Create the `pm_tool` database
3. Update `backend/.env` with correct credentials
4. Run `npx prisma migrate dev --name init` in the backend folder
5. Restart the backend server
6. Try creating a project again!

## Quick Start Commands

```bash
# Test PostgreSQL connection
psql -U postgres -h localhost

# Create database
psql -U postgres -c "CREATE DATABASE pm_tool;"

# Initialize Prisma migrations
cd backend
npx prisma migrate dev --name init

# Start backend server
npm start

# In another terminal, start frontend
cd frontend
npm run dev
```

Good luck! Let me know if you hit any issues.
