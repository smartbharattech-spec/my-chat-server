<?php
// Test scraping trackon.in
function get_status($id) {
    $url = "https://trackon.in/track-shipment?awb=" . $id;
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    $res = curl_exec($ch);
    curl_close($ch);
    return $res;
}

$id = "500658245945";
$html = get_status($id);
file_put_contents('test_scrape.html', $html);
echo "Dumped to test_scrape.html";
?>
