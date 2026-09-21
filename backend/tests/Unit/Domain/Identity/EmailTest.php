<?php

declare(strict_types=1);

namespace App\Tests\Unit\Domain\Identity;

use App\Domain\Identity\Email;
use App\Domain\Identity\Exception\InvalidEmail;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

#[CoversClass(Email::class)]
#[CoversClass(InvalidEmail::class)]
final class EmailTest extends TestCase
{
    public function testItIsNormalisedToTrimmedLowerCase(): void
    {
        self::assertSame('jane.doe@example.com', Email::fromString('  Jane.Doe@Example.COM ')->value);
    }

    public function testTwoSpellingsOfTheSameAddressAreEqual(): void
    {
        self::assertTrue(Email::fromString('JANE@example.com')->equals(Email::fromString('jane@EXAMPLE.com')));
    }

    #[DataProvider('invalidEmails')]
    public function testItRejectsInvalidAddresses(string $email): void
    {
        $this->expectException(InvalidEmail::class);

        Email::fromString($email);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function invalidEmails(): iterable
    {
        yield 'empty' => [''];
        yield 'blank' => ['   '];
        yield 'missing domain' => ['jane@'];
        yield 'missing at sign' => ['jane.example.com'];
        yield 'too long' => [str_repeat('a', 175).'@example.com'];
    }
}
