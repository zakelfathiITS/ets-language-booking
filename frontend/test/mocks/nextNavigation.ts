/**
 * Controllable stand-in for next/navigation (the App Router is not available
 * outside of Next.js).
 */
export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn(),
};

export const navigation = {
  pathname: "/",
  searchParams: new URLSearchParams(),
  params: {} as Record<string, string>,
};

export function resetNavigation(): void {
  Object.values(router).forEach((fn) => fn.mockReset());
  navigation.pathname = "/";
  navigation.searchParams = new URLSearchParams();
  navigation.params = {};
}

export const useRouter = () => router;
export const usePathname = () => navigation.pathname;
export const useSearchParams = () => navigation.searchParams;
export const useParams = () => navigation.params;
