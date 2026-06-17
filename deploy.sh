#!/bin/bash
set -e

echo "=== OG.X Simulator Deploy Script ==="
echo ""

# Check dependencies
if ! command -v git &> /dev/null; then echo "❌ git not installed"; exit 1; fi
if ! command -v gh &> /dev/null; then echo "❌ gh not installed"; exit 1; fi
if ! npx --yes vercel --version &> /dev/null; then echo "❌ vercel not available"; exit 1; fi

# Check gh auth
if ! gh auth status &> /dev/null; then
  echo "🔐 Login to GitHub first:"
  echo "   gh auth login"
  echo "   Then re-run this script."
  exit 1
fi

GITHUB_USER=$(gh api user --jq '.login')
echo "✅ GitHub authenticated as: $GITHUB_USER"
echo ""

# Create GitHub repo if it doesn't exist
if ! gh repo view "ogx-simulator" &> /dev/null 2>&1; then
  echo "📦 Creating GitHub repo: $GITHUB_USER/ogx-simulator..."
  gh repo create ogx-simulator --public --description "OG.X Off-Grid Simulator — Interactive cost calculator" --remote origin
else
  echo "📦 Repo exists, adding remote..."
  git remote add origin "https://github.com/$GITHUB_USER/ogx-simulator.git" 2>/dev/null || true
fi

# Push to GitHub
echo "🚀 Pushing to GitHub..."
git push -u origin main

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
npx vercel --prod --yes --name ogx-simulator

echo ""
echo "✅ Done! Your simulator is live at:"
echo "   https://ogx-simulator.vercel.app"
echo ""
echo "   To set a custom domain:"
echo "   vercel domains add ogx-simulator.vercel.app simulator.yourdomain.com"
