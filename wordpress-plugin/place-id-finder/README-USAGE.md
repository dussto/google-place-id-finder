
# How to Convert Your Place ID Finder App to a WordPress Plugin

This guide explains how to take your existing Place ID Finder app and create a WordPress plugin from it.

## Step 1: Prepare Your Files

1. Create a new directory called `place-id-finder` for your WordPress plugin
2. Copy all the files from this `wordpress-plugin/place-id-finder` directory into it

## Step 2: Modify Your React App for WordPress Integration

1. Copy your existing React components from your app to the `src` directory
2. Make sure to update any imports to use the correct paths
3. You may need to modify some components to work within the WordPress environment
4. Check the `vite.config.ts` file to ensure it's configured properly for building a WordPress-compatible bundle

## Step 3: Install Dependencies and Build

```bash
cd place-id-finder
npm install
npm run build
```

This will create a `build` directory with all the compiled assets.

## Step 4: Update the Plugin PHP File

In `place-id-finder.php`, update the JavaScript and CSS file paths to match your actual built files. 
After building, check the `build/manifest.json` file to get the correct file names with hashes.

For example, replace:
```php
'build/assets/index-UNIQUE_HASH.js'
'build/assets/index-UNIQUE_HASH.css'
```
with the actual file names generated in your build process.

## Step 5: Package the Plugin

Create a ZIP file containing:
- place-id-finder.php
- build/ (directory with all your compiled assets)
- README.md
- Any other necessary files

## Step 6: Install on WordPress

1. Go to your WordPress admin panel
2. Navigate to Plugins > Add New > Upload Plugin
3. Upload the ZIP file and activate the plugin
4. Use the shortcode `[place_id_finder]` on any page or post

## Additional Notes

- For the Google Places API integration, you'll need to ensure your Supabase Edge Function is publicly accessible
- Consider adding WordPress admin settings to configure API keys and other settings
- Test thoroughly in a WordPress environment before distributing
