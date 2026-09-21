<?php

declare(strict_types=1);

namespace App\Tests\Support\PHPStan;

use PHPStan\Reflection\ExtendedPropertyReflection;
use PHPStan\Rules\Properties\ReadWritePropertiesExtension;

/**
 * PHPStan: a persisted field (e.g. an audit date) is not "never read" merely
 * because no getter exposes it.
 */
final class XmlMappedPropertiesExtension implements ReadWritePropertiesExtension
{
    public function __construct(private readonly XmlMappedProperties $mapping)
    {
    }

    public function isAlwaysRead(ExtendedPropertyReflection $property, string $propertyName): bool
    {
        return $this->mapping->isMapped($property->getDeclaringClass()->getName(), $propertyName);
    }

    public function isAlwaysWritten(ExtendedPropertyReflection $property, string $propertyName): bool
    {
        return $this->mapping->isMapped($property->getDeclaringClass()->getName(), $propertyName);
    }

    public function isInitialized(ExtendedPropertyReflection $property, string $propertyName): bool
    {
        return $this->mapping->isMapped($property->getDeclaringClass()->getName(), $propertyName);
    }
}
