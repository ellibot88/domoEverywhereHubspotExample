# Domo Embed for HubSpot - Setup Guide

This HubSpot app allows you to embed private Domo dashboards into HubSpot CRM records (Contacts, Companies, and Deals).

## Prerequisites

1. A HubSpot account with access to developer projects
2. A Domo account with API access
3. The HubSpot CLI installed (`npm install -g @hubspot/cli`)

## Setup Instructions

### 1. Get Domo API Credentials

1. Log in to your Domo Developer Portal
2. Navigate to **Developer** > **Manage Client IDs**
3. Click **Create a Client**
4. Provide a name and description
5. Select the necessary scopes:
   - `data`
   - `audit`
   - `user`
   - `dashboard`
6. Click **Create** and securely store the **Client ID** and **Client Secret**

### 2. Get Your Dashboard Embed ID

1. In Domo, navigate to the dashboard you want to embed
2. Click the **Share** button
3. Select **Embed Dashboard/App**
4. Choose **Private** embed option
5. Copy the **Embed ID** (this is the token/ID shown in the embed configuration)

### 3. Configure the HubSpot App

1. Run `hs project dev` in the project directory to start the development server
2. Navigate to your HubSpot account
3. Go to **Settings** > **Integrations** > **Private Apps** (or your app settings)
4. Find the "Domo Embed" app and click **Configure**
5. Enter your Domo credentials:
   - **Domo Client ID**: Your Domo API Client ID
   - **Domo Client Secret**: Your Domo API Client Secret
   - **Dashboard Embed ID**: The embed ID from step 2
6. Click **Save Settings**

### 4. View the Embedded Dashboard

1. Navigate to any Contact, Company, or Deal record in HubSpot
2. Look for the **Domo Dashboard** tab
3. The dashboard should load automatically

## Configuration Options

The settings component supports the following optional configurations (can be added to settings):

- **embedType**: `"dashboard"` or `"card"` (default: `"dashboard"`)
- **sessionLength**: Session length in minutes (default: 1440)
- **permissions**: Array of permissions like `["READ", "FILTER", "EXPORT"]` (default: `["READ", "FILTER", "EXPORT"]`)

## Troubleshooting

### Dashboard Not Loading

1. Verify your Domo credentials are correct in the app settings
2. Check that the Embed ID matches the dashboard you want to display
3. Ensure your Domo Client ID has the required scopes
4. Check the browser console for any error messages

### Authentication Errors

- Verify your Client ID and Client Secret are correct
- Ensure your Domo Client ID has not been revoked
- Check that the required scopes are enabled

### Permission Errors

- Verify the Embed ID is correct
- Ensure the dashboard is set to "Private" embed in Domo
- Check that your Domo user has access to the dashboard

## Security Notes

- Client Secret is stored securely in HubSpot app settings
- All API calls are made server-side through HubSpot app functions
- Embed tokens are generated on-demand and not stored

## Development

To develop locally:

```bash
# Install dependencies
cd src/app/cards
npm install

# Start development server
hs project dev
```

## Components

- **Settings Component** (`/app/settings`): Allows users to configure Domo credentials
- **Card Component** (`/app/cards/domo-embed-card`): Displays the embedded Domo dashboard
- **App Function** (`/app/functions/domo-embed-auth`): Handles Domo API authentication server-side

