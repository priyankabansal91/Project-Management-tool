import { Page } from '@playwright/test';

/** Inject dev auth into localStorage so ProtectedRoute passes */
export async function injectDevAuth(page: Page, role = 'org_admin') {
  const devUserMap: Record<string, { id: string; role: string; email: string; name: string }> = {
    org_admin:       { id: 'dev-org_admin-id',       role: 'org_admin',       email: 'admin@example.local',     name: 'Priya Sharma' },
    division_admin:  { id: 'dev-division_admin-id',  role: 'division_admin',  email: 'div-admin@example.local', name: 'Vikram Mehta' },
    project_manager: { id: 'dev-project_manager-id', role: 'project_manager', email: 'pm@example.local',        name: 'Anjali Singh' },
    member:          { id: 'dev-member-id',           role: 'member',          email: 'member@example.local',    name: 'Ravi Kumar' },
  };
  const u = devUserMap[role] || devUserMap['org_admin'];

  await page.addInitScript(({ u }: { u: typeof devUserMap[string] }) => {
    const authData = {
      state: {
        accessToken: 'dev-token',
        user: {
          id: u.id,
          email: u.email,
          firstName: u.name.split(' ')[0],
          first_name: u.name.split(' ')[0],
          lastName: u.name.split(' ')[1] || '',
          last_name: u.name.split(' ')[1] || '',
          avatar_url: null,
        },
        currentRole: u.role,
        currentDivisionId: null,
      },
      version: 0,
    };
    localStorage.setItem('pm-auth', JSON.stringify(authData));
  }, { u });
}

export const BASE_API = 'http://localhost:4000/v1';
export const DEV_HEADER = { 'x-dev-user-id': 'dev-org_admin-id', 'Content-Type': 'application/json' };

/** Wait for no loading spinners visible */
export async function waitForLoad(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
}

/** Create a project via API and return its ID */
export async function apiCreateProject(request: any, name: string): Promise<string> {
  const resp = await request.post(`${BASE_API}/projects`, {
    headers: DEV_HEADER,
    data: { name, visibility: 'org_wide', color: '#3B82F6' },
  });
  const body = await resp.json();
  return body.data.id;
}

/** Delete a project via API */
export async function apiDeleteProject(request: any, projectId: string) {
  await request.delete(`${BASE_API}/projects/${projectId}`, { headers: DEV_HEADER });
}

/** Create a task via API */
export async function apiCreateTask(request: any, projectId: string, title: string): Promise<string> {
  const resp = await request.post(`${BASE_API}/tasks/project/${projectId}`, {
    headers: DEV_HEADER,
    data: { title, priority: 'medium', tags: [] },
  });
  const body = await resp.json();
  return body.data?.id;
}
