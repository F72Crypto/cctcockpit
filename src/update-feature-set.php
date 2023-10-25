<?php
try {
    $db = new PDO('mysql:host=localhost;dbname=cent_chartlib', 'cent_cacique', 'C4r4lh0a4%2023');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_NUMBER_INT);
    $isEnabled = filter_input(INPUT_POST, 'isEnabled', FILTER_SANITIZE_NUMBER_INT);

    $queryCheck = $db->prepare("SELECT id FROM featuresets WHERE id = ?");
    $queryCheck->execute([$id]);
    $exists = $queryCheck->fetchColumn();

    if ($exists) {
        $query = $db->prepare("UPDATE featuresets SET is_enabled = ? WHERE id = ?");
        $executed = $query->execute([$isEnabled, $id]);

        if ($executed && $query->rowCount() > 0) {
            file_put_contents("query.log", "ID {$id}: Query executada com sucesso.\n", FILE_APPEND);
        } else {
            file_put_contents("query.log", "ID {$id}: Nenhuma linha afetada.\n", FILE_APPEND);
        }
    } else {
        file_put_contents("query.log", "ID {$id}: ID não existe na base de dados.\n", FILE_APPEND);
    }

} catch (Exception $e) {
    file_put_contents("query.log", "Exceção capturada: " . $e->getMessage() . "\n", FILE_APPEND);
}
