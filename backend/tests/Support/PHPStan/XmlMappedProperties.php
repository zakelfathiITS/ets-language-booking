<?php

declare(strict_types=1);

namespace App\Tests\Support\PHPStan;

/**
 * Properties declared in the Doctrine ODM XML mapping files. Doctrine reads
 * and writes them through reflection, which static analysis cannot see.
 */
final class XmlMappedProperties
{
    /** @var array<string, list<string>>|null property names, indexed by class */
    private ?array $properties = null;

    public function __construct(private readonly string $mappingDirectory)
    {
    }

    public function isMapped(string $className, string $propertyName): bool
    {
        $this->properties ??= $this->read();

        return \in_array($propertyName, $this->properties[$className] ?? [], true);
    }

    /**
     * @return array<string, list<string>>
     */
    private function read(): array
    {
        $properties = [];

        foreach (glob($this->mappingDirectory.'/*/*.mongodb.xml') ?: [] as $file) {
            $xml = new \DOMDocument();
            $xml->load($file);

            foreach ($xml->getElementsByTagName('document') as $document) {
                $className = $document->getAttribute('name');
                foreach (['id', 'field'] as $tag) {
                    foreach ($document->getElementsByTagName($tag) as $field) {
                        $properties[$className][] = $field->getAttribute('field-name');
                    }
                }
            }
        }

        return $properties;
    }
}
