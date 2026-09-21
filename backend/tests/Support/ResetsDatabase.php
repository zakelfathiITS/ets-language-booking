<?php

declare(strict_types=1);

namespace App\Tests\Support;

use Doctrine\ODM\MongoDB\DocumentManager;

/**
 * Empties every mapped collection of the test database before each test.
 *
 * Indexes are created once and kept: uniqueness rules are part of what the
 * tests verify, so documents are deleted rather than collections dropped.
 */
trait ResetsDatabase
{
    private static bool $schemaReady = false;

    protected static function resetDatabase(): void
    {
        $documentManager = static::getContainer()->get(DocumentManager::class);

        if (!self::$schemaReady) {
            $documentManager->getSchemaManager()->ensureIndexes();
            self::$schemaReady = true;
        }

        foreach ($documentManager->getMetadataFactory()->getAllMetadata() as $metadata) {
            if ($metadata->isMappedSuperclass || $metadata->isEmbeddedDocument || $metadata->isQueryResultDocument) {
                continue;
            }

            $documentManager->getDocumentCollection($metadata->getName())->deleteMany([]);
        }

        $documentManager->clear();
    }
}
