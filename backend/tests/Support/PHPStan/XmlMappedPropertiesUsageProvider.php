<?php

declare(strict_types=1);

namespace App\Tests\Support\PHPStan;

use ShipMonk\PHPStan\DeadCode\Provider\ReflectionBasedMemberUsageProvider;
use ShipMonk\PHPStan\DeadCode\Provider\VirtualUsageData;

/**
 * Dead-code detector: properties persisted by Doctrine ODM are used.
 */
final class XmlMappedPropertiesUsageProvider extends ReflectionBasedMemberUsageProvider
{
    public function __construct(private readonly XmlMappedProperties $mapping)
    {
    }

    protected function shouldMarkPropertyAsRead(\ReflectionProperty $property): ?VirtualUsageData
    {
        return $this->usage($property);
    }

    protected function shouldMarkPropertyAsWritten(\ReflectionProperty $property): ?VirtualUsageData
    {
        return $this->usage($property);
    }

    private function usage(\ReflectionProperty $property): ?VirtualUsageData
    {
        return $this->mapping->isMapped($property->getDeclaringClass()->getName(), $property->getName())
            ? VirtualUsageData::withNote('Persisted by Doctrine ODM (XML mapping)')
            : null;
    }
}
