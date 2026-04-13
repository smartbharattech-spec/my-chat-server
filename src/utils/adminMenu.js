export const ALL_ADMIN_MENU_ITEMS = [
    { text: "Dashboard", path: "/admin/dashboard", permission: 'stats' },
    { text: "Users", path: "/admin/users", permission: 'users' },
    { text: "Projects", path: "/admin/projects", permission: 'projects' },
    { text: "Plans", path: "/admin/plans", permission: 'plans' },
    { text: "Payments", path: "/admin/payments", permission: 'payments' },
    { text: "Map Requests", path: "/admin/map-requests", permission: 'projects' },
    { text: "Reviews", path: "/admin/reviews", permission: 'staff' },
    { text: "Followups", path: "/admin/followups", permission: 'followups' },
    { text: "Follow-up Requests", path: "/admin/followup-requests", permission: 'followup_requests' },
    { text: "Analytics", path: "/admin/analytics", permission: 'stats' },
    { text: "Role", path: "/admin/staff", permission: 'staff' },
    { text: "Marketplace Experts", path: "/occult/admin?tab=expertsList", permission: 'staff' },
    { text: "Marketplace Users", path: "/occult/admin?tab=manageUsers", permission: 'staff' },
    { text: "Manage Store", path: "/occult/admin-store", permission: 'staff' },
    { text: "Marketplace Orders", path: "/occult/admin-orders", permission: 'staff' },
    { text: "Manage Tracker", path: "/admin/tracker", permission: 'staff', isTracker: true },
    { text: "Tutorials", path: "/admin/tutorials", permission: 'staff' },
    { text: "Remedies Engine", path: "/admin/remedies", permission: 'remedies', isRemedies: true },
];

export const getFirstPermittedRoute = (adminUser, trackerEnabled = true) => {
    if (!adminUser) return "/admin";
    if (adminUser.role === 'super_admin') return "/admin/dashboard";

    let permissions = adminUser.permissions || [];
    if (typeof permissions === 'string') {
        try { permissions = JSON.parse(permissions); } catch (e) { permissions = []; }
    }

    const permittedItems = ALL_ADMIN_MENU_ITEMS.filter(item => {
        if (item.isTracker && !trackerEnabled) return false;
        return permissions.includes(item.permission);
    });

    return permittedItems.length > 0 ? permittedItems[0].path : "/admin/dashboard";
};
