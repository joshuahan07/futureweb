'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

type User = 'joshua' | 'sophie' | null;

interface UserContextType {
  currentUser: User;
  setUser: (user: User) => void;
}

const UserContext = createContext<UserContextType>({
  currentUser: null,
  setUser: () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('js-current-user') as User;
    if (stored === 'joshua' || stored === 'sophie') {
      setCurrentUser(stored);
    }
    setLoaded(true);
  }, []);

  const setUser = (user: User) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('js-current-user', user);
    } else {
      localStorage.removeItem('js-current-user');
    }
  };

  if (!loaded) return null;

  return (
    <UserContext.Provider value={{ currentUser, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
