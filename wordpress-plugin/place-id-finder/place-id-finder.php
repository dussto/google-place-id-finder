
<?php
/**
 * Plugin Name: Place ID Finder
 * Description: Easily find Google Place IDs for any business or location
 * Version: 1.0.0
 * Author: Lovable
 * Author URI: https://lovable.dev
 * Text Domain: place-id-finder
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PLACE_ID_FINDER_VERSION', '1.0.0');
define('PLACE_ID_FINDER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PLACE_ID_FINDER_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include API connector
require_once PLACE_ID_FINDER_PLUGIN_DIR . 'includes/api-connector.php';

/**
 * Enqueue the bundled React app scripts and styles
 */
function place_id_finder_enqueue_scripts() {
    // Enqueue the main JavaScript bundle
    wp_enqueue_script(
        'place-id-finder-js',
        PLACE_ID_FINDER_PLUGIN_URL . 'build/assets/index-UNIQUE_HASH.js',
        array(),
        PLACE_ID_FINDER_VERSION,
        true
    );
    
    // Enqueue the main CSS file
    wp_enqueue_style(
        'place-id-finder-css',
        PLACE_ID_FINDER_PLUGIN_URL . 'build/assets/index-UNIQUE_HASH.css',
        array(),
        PLACE_ID_FINDER_VERSION
    );
    
    // Pass variables to JavaScript
    wp_localize_script(
        'place-id-finder-js',
        'placeidFinderData',
        array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('place-id-finder-nonce'),
        )
    );
}

/**
 * Register shortcode for displaying the Place ID Finder app
 */
function place_id_finder_shortcode($atts) {
    // Enqueue scripts and styles
    place_id_finder_enqueue_scripts();
    
    // Attributes
    $atts = shortcode_atts(
        array(
            'height' => '800px',
            'width' => '100%',
        ),
        $atts,
        'place_id_finder'
    );
    
    // Start output buffering
    ob_start();
    
    // The container where React will mount
    echo '<div id="place-id-finder-root" style="width: ' . esc_attr($atts['width']) . '; height: ' . esc_attr($atts['height']) . ';"></div>';
    
    // Return the buffered content
    return ob_get_clean();
}

// Register the shortcode
add_shortcode('place_id_finder', 'place_id_finder_shortcode');

/**
 * Admin menu
 */
function place_id_finder_admin_menu() {
    add_menu_page(
        'Place ID Finder',
        'Place ID Finder',
        'manage_options',
        'place-id-finder',
        'place_id_finder_admin_page',
        'dashicons-location-alt',
        30
    );
}
add_action('admin_menu', 'place_id_finder_admin_menu');

/**
 * Admin page content
 */
function place_id_finder_admin_page() {
    ?>
    <div class="wrap">
        <h1>Place ID Finder Settings</h1>
        
        <form method="post" action="options.php">
            <?php
            settings_fields('place_id_finder');
            do_settings_sections('place-id-finder');
            submit_button();
            ?>
        </form>
        
        <hr>
        
        <h2>Usage Instructions</h2>
        <p>Use the shortcode <code>[place_id_finder]</code> to display the Place ID Finder on any page or post.</p>
        <p>You can customize the height and width using the shortcode attributes:</p>
        <code>[place_id_finder height="600px" width="100%"]</code>
        
        <?php if (get_option('place_id_finder_google_api_key')): ?>
        <div style="margin-top: 30px;">
            <h2>Preview</h2>
            <div style="border: 1px solid #ddd; padding: 20px;">
                <?php echo place_id_finder_shortcode(array('height' => '600px')); ?>
            </div>
        </div>
        <?php else: ?>
        <div class="notice notice-warning">
            <p><strong>Please enter your Google Places API key above to enable the Place ID Finder.</strong></p>
        </div>
        <?php endif; ?>
    </div>
    <?php
}

/**
 * Setup function that runs on plugin activation
 */
function place_id_finder_activate() {
    // Create any necessary database tables or options
    add_option('place_id_finder_version', PLACE_ID_FINDER_VERSION);
}
register_activation_hook(__FILE__, 'place_id_finder_activate');

/**
 * Cleanup function that runs on plugin deactivation
 */
function place_id_finder_deactivate() {
    // Cleanup tasks if needed
}
register_deactivation_hook(__FILE__, 'place_id_finder_deactivate');
