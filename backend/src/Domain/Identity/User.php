<?php

declare(strict_types=1);

namespace App\Domain\Identity;

use App\Domain\Identity\Exception\InvalidUserName;

/**
 * User account aggregate.
 *
 * State is stored as primitives so the XML mapping stays plain; the public API
 * exposes value objects. Instances are created through register() only.
 *
 * Not final: Doctrine generates lazy-loading proxies that extend persisted classes.
 */
class User
{
    public const NAME_MIN_LENGTH = 2;
    public const NAME_MAX_LENGTH = 100;

    private string $id;
    private string $name;
    private string $email;
    private string $passwordHash;

    /** @var list<string> */
    private array $roles;

    private \DateTimeImmutable $createdAt;
    private \DateTimeImmutable $updatedAt;

    /**
     * @param list<Role> $roles
     */
    private function __construct(
        UserId $id,
        string $name,
        Email $email,
        string $passwordHash,
        array $roles,
        \DateTimeImmutable $now,
    ) {
        $this->id = $id->value;
        $this->name = self::validName($name);
        $this->email = $email->value;
        $this->passwordHash = self::validPasswordHash($passwordHash);
        $this->roles = self::normalizeRoles($roles);
        $this->createdAt = $now;
        $this->updatedAt = $now;
    }

    /**
     * @param list<Role> $roles ROLE_USER is always granted, whatever is given
     */
    public static function register(
        UserId $id,
        string $name,
        Email $email,
        string $passwordHash,
        \DateTimeImmutable $now,
        array $roles = [],
    ): self {
        return new self($id, $name, $email, $passwordHash, $roles, $now);
    }

    public function updateProfile(string $name, Email $email, \DateTimeImmutable $now): void
    {
        $this->name = self::validName($name);
        $this->email = $email->value;
        $this->updatedAt = $now;
    }

    public function grantRole(Role $role, \DateTimeImmutable $now): void
    {
        if ($this->hasRole($role)) {
            return;
        }

        $this->roles[] = $role->value;
        $this->updatedAt = $now;
    }

    /**
     * Used when the hashing algorithm or its cost changes (rehash on login).
     */
    public function changePasswordHash(string $passwordHash, \DateTimeImmutable $now): void
    {
        $this->passwordHash = self::validPasswordHash($passwordHash);
        $this->updatedAt = $now;
    }

    public function id(): UserId
    {
        return UserId::fromString($this->id);
    }

    public function name(): string
    {
        return $this->name;
    }

    public function email(): Email
    {
        return Email::fromString($this->email);
    }

    public function passwordHash(): string
    {
        return $this->passwordHash;
    }

    /**
     * @return list<Role>
     */
    public function roles(): array
    {
        return array_map(static fn (string $role): Role => Role::from($role), $this->roles);
    }

    public function hasRole(Role $role): bool
    {
        return \in_array($role->value, $this->roles, true);
    }

    public function createdAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function updatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    private static function validName(string $name): string
    {
        $name = trim($name);
        $length = mb_strlen($name);

        if ($length < self::NAME_MIN_LENGTH || $length > self::NAME_MAX_LENGTH) {
            throw InvalidUserName::lengthOutOfRange(self::NAME_MIN_LENGTH, self::NAME_MAX_LENGTH);
        }

        return $name;
    }

    private static function validPasswordHash(string $passwordHash): string
    {
        if ($passwordHash === '') {
            throw new \InvalidArgumentException('A password hash cannot be empty.');
        }

        return $passwordHash;
    }

    /**
     * @param list<Role> $roles
     *
     * @return list<string>
     */
    private static function normalizeRoles(array $roles): array
    {
        $values = array_map(static fn (Role $role): string => $role->value, [Role::User, ...$roles]);

        return array_values(array_unique($values));
    }
}
