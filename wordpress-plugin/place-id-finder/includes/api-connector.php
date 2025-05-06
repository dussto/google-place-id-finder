
<?php
/**
 * Handle API connections to Google Places API
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Ajax handler for place search
 */
function place_id_finder_ajax_search() {
    // Check nonce for security
    check_ajax_referer('place-id-finder-nonce', 'nonce');
    
    // Get the search query
    $query = isset($_POST['query']) ? sanitize_text_field($_POST['query']) : '';
    
    if (empty($query)) {
        wp_send_json_error(array('message' => 'Search query is required'), 400);
        wp_die();
    }
    
    // Get results from Google Places API
    $results = place_id_finder_search_places($query);
    
    if (is_wp_error($results)) {
        wp_send_json_error(array('message' => $results->get_error_message()), 500);
    } else {
        wp_send_json($results);
    }
    
    wp_die();
}
add_action('wp_ajax_place_id_finder_search', 'place_id_finder_ajax_search');
add_action('wp_ajax_nopriv_place_id_finder_search', 'place_id_finder_ajax_search');

/**
 * Search for places using Google Places API
 */
function place_id_finder_search_places($query) {
    // Get API key from options
    $api_key = get_option('place_id_finder_google_api_key', '');
    
    if (empty($api_key)) {
        return new WP_Error('missing_api_key', 'Google Places API key is not configured');
    }
    
    // Build the request URL
    $url = add_query_arg(
        array(
            'input' => urlencode($query),
            'key' => $api_key,
            'inputtype' => 'textquery',
            'fields' => 'place_id,name,formatted_address,photos,website,user_ratings_total',
        ),
        'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
    );
    
    // Make the request
    $response = wp_remote_get($url);
    
    if (is_wp_error($response)) {
        return $response;
    }
    
    $body = wp_remote_retrieve_body($response);
    $data = json_decode($body, true);
    
    if (empty($data) || $data['status'] !== 'OK') {
        $error_message = isset($data['error_message']) ? $data['error_message'] : 'Failed to fetch results';
        return new WP_Error('api_error', $error_message);
    }
    
    // Transform the results to match our expected format
    $results = array();
    
    foreach ($data['candidates'] as $place) {
        $photo_url = '';
        
        // If we have photos, get the first one
        if (!empty($place['photos'])) {
            $photo_reference = $place['photos'][0]['photo_reference'];
            $photo_url = add_query_arg(
                array(
                    'photoreference' => $photo_reference,
                    'key' => $api_key,
                    'maxwidth' => 400,
                    'maxheight' => 400,
                ),
                'https://maps.googleapis.com/maps/api/place/photo'
            );
        }
        
        $results[] = array(
            'place_id' => $place['place_id'],
            'name' => $place['name'],
            'formatted_address' => $place['formatted_address'],
            'photo_url' => $photo_url,
            'website' => isset($place['website']) ? $place['website'] : '',
            'review_count' => isset($place['user_ratings_total']) ? (int) $place['user_ratings_total'] : 0,
        );
    }
    
    return $results;
}

/**
 * Add API key settings field to the admin page
 */
function place_id_finder_settings_init() {
    register_setting('place_id_finder', 'place_id_finder_google_api_key');
    
    add_settings_section(
        'place_id_finder_api_section',
        'API Settings',
        'place_id_finder_api_section_callback',
        'place-id-finder'
    );
    
    add_settings_field(
        'place_id_finder_google_api_key',
        'Google Places API Key',
        'place_id_finder_api_key_callback',
        'place-id-finder',
        'place_id_finder_api_section'
    );
}
add_action('admin_init', 'place_id_finder_settings_init');

/**
 * Settings section description
 */
function place_id_finder_api_section_callback() {
    echo '<p>Enter your Google Places API key to enable place searches.</p>';
    echo '<p>You can get an API key from the <a href="https://developers.google.com/maps/documentation/places/web-service/get-api-key" target="_blank">Google Cloud Console</a>.</p>';
}

/**
 * API key field callback
 */
function place_id_finder_api_key_callback() {
    $api_key = get_option('place_id_finder_google_api_key', '');
    ?>
    <input type="text" name="place_id_finder_google_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text">
    <?php
}
