# Deploying Antigrav to GitHub Pages

This guide will walk you through deploying your game to GitHub Pages for free hosting.

## Prerequisites

- A GitHub account (create one at [github.com](https://github.com) if you don't have one)
- Git installed on your computer

## Step 1: Initialize Git Repository

Open Terminal and navigate to your project directory:

```bash
cd /Users/asini/Documents/antigrav
```

Initialize a new Git repository:

```bash
git init
```

## Step 2: Create .gitignore File

Create a `.gitignore` file to exclude unnecessary files:

```bash
echo "node_modules/
.DS_Store
*.log" > .gitignore
```

## Step 3: Commit Your Files

Add all your files to Git:

```bash
git add .
git commit -m "Initial commit - Antigrav game"
```

## Step 4: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon in the top right corner
3. Select **New repository**
4. Name it `antigrav` (or any name you prefer)
5. **Do NOT** initialize with README, .gitignore, or license
6. Click **Create repository**

## Step 5: Push to GitHub

Copy the commands from GitHub (they'll look like this):

```bash
git remote add origin https://github.com/YOUR_USERNAME/antigrav.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 6: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under **Source**, select **main** branch
5. Click **Save**

## Step 7: Access Your Game

After a few minutes, your game will be live at:

```
https://YOUR_USERNAME.github.io/antigrav/
```

## Updating Your Game

Whenever you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

GitHub Pages will automatically update within a few minutes.

## Troubleshooting

### Game doesn't load
- Check browser console (F12) for errors
- Verify all file paths are relative (no absolute paths)
- Ensure all files are committed and pushed

### Audio doesn't play
- GitHub Pages uses HTTPS, ensure audio files are accessible
- Check browser autoplay policies

### 404 Error
- Wait 5-10 minutes after enabling GitHub Pages
- Check that `index.html` is in the root directory
- Verify the repository is public

## Optional: Custom Domain

You can use a custom domain:
1. Buy a domain from a registrar
2. In GitHub Pages settings, add your custom domain
3. Configure DNS settings with your registrar

---

**Your game will be publicly accessible once deployed!**
