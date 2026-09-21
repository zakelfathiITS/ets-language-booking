<?php

declare(strict_types=1);

$finder = (new PhpCsFixer\Finder())
    ->in([__DIR__.'/src', __DIR__.'/tests', __DIR__.'/config', __DIR__.'/public'])
    ->notPath(['bundles.php', 'preload.php', 'reference.php'])
;

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(true)
    ->setRules([
        '@Symfony' => true,
        '@Symfony:risky' => true,
        '@PHP8x3Migration' => true,
        '@PHPUnit11x0Migration:risky' => true,
        'declare_strict_types' => true,
        // Readability over micro-optimisation.
        'native_function_invocation' => false,
        'yoda_style' => false,
        // Inline @var annotations feed static analysis: keep them as docblocks.
        'phpdoc_to_comment' => false,
    ])
    ->setFinder($finder)
;
