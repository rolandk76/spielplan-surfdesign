<?php
// Simple converter: extracts INSERTs for tournaments and users from a PostgreSQL dump
// and makes them MySQL-compatible.
// Usage: php scripts/convert_pg_to_mysql.php

$root = dirname(__DIR__);
$input = $root . '/neon_backup.sql';
$output = $root . '/mysql_data.sql';

if (!file_exists($input)) {
    fwrite(STDERR, "Input file not found: $input\n");
    exit(1);
}

$in = fopen($input, 'r');
if (!$in) {
    fwrite(STDERR, "Cannot open input: $input\n");
    exit(1);
}

$out = fopen($output, 'w');
if (!$out) {
    fwrite(STDERR, "Cannot open output: $output\n");
    exit(1);
}

fwrite($out, "-- Auto-generated MySQL data INSERTs from neon_backup.sql\n");

$insertCount = 0;
while (($line = fgets($in)) !== false) {
    // Only process INSERT lines for our tables
    if (strpos($line, 'INSERT INTO public.tournaments') !== false || strpos($line, 'INSERT INTO public.users') !== false) {
        $line = str_replace('INSERT INTO public.tournaments', 'INSERT INTO `tournaments`', $line);
        $line = str_replace('INSERT INTO public.users', 'INSERT INTO `users`', $line);
        // Remove timezone suffix like +00 or +00:00 in timestamp literals
        $line = preg_replace("/([']\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:\+\d{2}(?::?\d{2})?)(['])/", '$1$2', $line);
        fwrite($out, $line);
        $insertCount++;
    }
}

fclose($in);
fclose($out);

echo "Wrote $insertCount INSERT lines to $output\n";
