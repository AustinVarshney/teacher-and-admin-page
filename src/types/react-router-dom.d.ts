interface ReactRouterDOM {
  BrowserRouter: React.ComponentType<{ children: React.ReactNode }>;
  Routes: React.ComponentType<{ children: React.ReactNode }>;
  Route: React.ComponentType<{ path: string; element: React.ReactNode }>;
  Navigate: React.ComponentType<{ to: string; replace?: boolean }>;
  Link: React.ComponentType<{ to: string; children: React.ReactNode; className?: string }>;
  NavLink: React.ComponentType<{ to: string; children: React.ReactNode; className?: string }>;
  Outlet: React.ComponentType<Record<string, never>>;
  useNavigate: () => (path: string) => void;
  useParams: () => Record<string, string>;
  useLocation: () => { pathname: string; search: string; hash: string };
}

declare global {
  interface Window {
    ReactRouterDOM: ReactRouterDOM;
  }
}

export {}; 