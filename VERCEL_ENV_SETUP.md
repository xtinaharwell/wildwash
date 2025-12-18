# Vercel Environment Configuration

## Required Steps to Deploy

The frontend requires the following environment variable to be set in Vercel for production deployments:

### Setting Environment Variable in Vercel Dashboard

1. Go to: https://vercel.com/dashboard
2. Select your **wildwash** project
3. Navigate to: **Settings** → **Environment Variables**
4. Click **Add New** and fill in:
   - **Name:** `NEXT_PUBLIC_API_BASE`
   - **Value:** `https://api.wildwash.co.ke`
   - **Environments:** Select "Production" (and optionally "Preview" and "Development")

5. Click **Save**
6. **Redeploy** your project:
   - Go to **Deployments**
   - Click the three dots on the latest deployment
   - Select **Redeploy**

### Why This is Required

- Next.js public environment variables must be prefixed with `NEXT_PUBLIC_`
- These variables are embedded at build time
- They must be set in the deployment platform (Vercel) for production
- Local `.env.local` only works for local development

### Verification

After deployment, the checkout page should:
- Send requests to: `https://api.wildwash.co.ke/payments/mpesa/stk-push/`
- **NOT** to `http://localhost:8000`

If you still see localhost errors after redeploy:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+F5)
3. Check Vercel deployment logs
