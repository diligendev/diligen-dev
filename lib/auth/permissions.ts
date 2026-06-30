import "server-only"

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer"

const EDITOR_ROLES = new Set<WorkspaceRole>(["owner", "admin", "member"])
const TEAM_MANAGER_ROLES = new Set<WorkspaceRole>(["owner", "admin"])

export function canReadWorkspace(role: WorkspaceRole) {
  return role === "owner" || role === "admin" || role === "member" || role === "viewer"
}

export function canWorkOnDeals(role: WorkspaceRole) {
  return EDITOR_ROLES.has(role)
}

export function canCreateDeal(role: WorkspaceRole) {
  return canWorkOnDeals(role)
}

export function canUpdateDeal(role: WorkspaceRole) {
  return canWorkOnDeals(role)
}

export function canUploadDocument(role: WorkspaceRole) {
  return canWorkOnDeals(role)
}

export function canEditDocument(role: WorkspaceRole) {
  return canWorkOnDeals(role)
}

export function canDeleteDocument(role: WorkspaceRole) {
  return role === "owner" || role === "admin"
}

export function canRunAnalysis(role: WorkspaceRole) {
  return canWorkOnDeals(role)
}

export function canManageNotes(role: WorkspaceRole) {
  return canWorkOnDeals(role)
}

export function canManageTeam(role: WorkspaceRole) {
  return TEAM_MANAGER_ROLES.has(role)
}

export function canManageAdminRoles(role: WorkspaceRole) {
  return role === "owner"
}

export function canTransferOwnership(role: WorkspaceRole) {
  return role === "owner"
}
