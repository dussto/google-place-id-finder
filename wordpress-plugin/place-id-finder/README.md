
# Place ID Finder WordPress Plugin

A WordPress plugin that allows you to easily find Google Place IDs for any business or location directly on your WordPress site.

## Features

- Search for any business or place worldwide
- Get the exact Google Place ID instantly
- View business details including address, website, and photos
- Fully responsive design that works on all devices

## Installation

1. Upload the `place-id-finder` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Use the shortcode `[place_id_finder]` on any page or post to display the finder

## Usage

Simply add the shortcode `[place_id_finder]` to any page or post where you want the Place ID Finder to appear.

You can customize the height and width using shortcode attributes:

```
[place_id_finder height="600px" width="100%"]
```

## Requirements

- WordPress 5.0 or higher
- PHP 7.0 or higher

## Building from Source

If you want to modify the plugin or build it from source:

1. Navigate to the `src` directory
2. Run `npm install` to install dependencies
3. Make your changes to the React components
4. Run `npm run build` to compile the assets
5. Copy the generated files from the `build` directory to the plugin's `build` directory
