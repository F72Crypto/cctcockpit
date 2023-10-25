<?php
header('Content-Type: application/json');

// Conexão com o banco de dados
$db = new PDO('mysql:host=localhost;dbname=cent_chartlib', 'cent_cacique', 'C4r4lh0a4%2023');

// Query para buscar os estados dos recursos, grupos e as descrições
$query = $db->query("SELECT id, feature_name, feature_group, is_enabled, feature_description FROM featuresets");
$features = $query->fetchAll(PDO::FETCH_ASSOC);

$enable_features = [];
$disable_features = [];

foreach ($features as $feature) {
    $featureArray = [
        'id' => $feature['id'], 
        'feature_name' => $feature['feature_name'],
        'feature_group' => $feature['feature_group'], // novo campo
        'feature_description' => $feature['feature_description']
    ];
    
    if ($feature['is_enabled'] == 1) {
        $enable_features[] = $featureArray;
    } else {
        $disable_features[] = $featureArray;
    }
}

echo json_encode(['enable_features' => $enable_features, 'disable_features' => $disable_features]);
?>
