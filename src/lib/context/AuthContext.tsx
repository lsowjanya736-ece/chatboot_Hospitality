'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Organization } from '../db/types';

interface AuthContextType {
  user: User | null;
  currentOrg: Organization | null;
  organizations: Organization[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  switchOrganization: (orgId: string) => void;
  refreshOrganizations: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        setSelectedOrganizationId(localStorage.getItem('healthcare_selected_org'));
        const [sessionRes, orgRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/organizations'),
        ]);
        if (sessionRes.ok) {
          const data = await sessionRes.json();
          setUser(data.user);
        }
        if (orgRes.ok) {
          const data = await orgRes.json();
          setOrganizations(data.organizations || []);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void initAuth();
  }, []);

  const currentOrg = user
    ? user.role === 'super_admin'
      ? organizations.find((org) => org.id === selectedOrganizationId) || organizations[0] || null
      : organizations.find((org) => org.id === user.organizationId) || null
    : null;

  const refreshOrganizations = async () => {
    const response = await fetch('/api/organizations');
    if (!response.ok) {
      throw new Error('Unable to refresh organizations');
    }
    const data = await response.json();
    setOrganizations(data.organizations || []);
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) return false;
      const data = await response.json();
      setUser(data.user);
      try {
        await refreshOrganizations();
      } catch (error) {
        console.error('Organization refresh failed after sign-in:', error);
      }
      return true;
    } catch (error) {
      console.error('Login request failed:', error);
      return false;
    }
  };

  const switchOrganization = (orgId: string) => {
    if (user?.role !== 'super_admin') return;
    const org = organizations.find((organization) => organization.id === orgId);
    if (org) {
      setSelectedOrganizationId(orgId);
      localStorage.setItem('healthcare_selected_org', orgId);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Unable to end the current session');
      }
    } finally {
      setUser(null);
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 401) {
        setUser(null);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentOrg,
        organizations,
        isLoading,
        login,
        switchOrganization,
        refreshOrganizations,
        logout,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
